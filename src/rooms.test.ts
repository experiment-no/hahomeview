import { test } from "node:test";
import assert from "node:assert/strict";
import { brightnessPercent, buildRooms, fillPercent, tapAction, stateText } from "./rooms.ts";

const areas = [
  { area_id: "living", name: "Living Room", temperature_entity_id: "sensor.living_temp" },
  { area_id: "bed", name: "Bedroom" },
  { area_id: "empty", name: "Garage" },
];
const devices = [{ id: "d1", area_id: "bed", name: "Hue Lamp" }];
const entries = [
  { ei: "light.sofa", ai: "living", lb: ["favorite"] },
  { ei: "light.bed_lamp", di: "d1", hn: true },
  { ei: "lock.front", ai: "living" },
  { ei: "scene.movie", ai: "living" },
  { ei: "scene.good_morning" },
  { ei: "switch.hidden", ai: "living", hb: true },
  { ei: "switch.config", ai: "living", ec: 0 },
  { ei: "sensor.living_temp", ai: "living" },
  { ei: "binary_sensor.door", ai: "living" },
  { ei: "light.no_state", ai: "living" },
];
const states: Record<string, any> = {
  "light.sofa": { entity_id: "light.sofa", state: "on", attributes: { friendly_name: "Sofa", brightness: 128 } },
  "light.bed_lamp": { entity_id: "light.bed_lamp", state: "off", attributes: { friendly_name: "Hue Lamp Light" } },
  "lock.front": { entity_id: "lock.front", state: "locked", attributes: { friendly_name: "Front Door" } },
  "scene.movie": { entity_id: "scene.movie", state: "unknown", attributes: { friendly_name: "Movie" } },
  "scene.good_morning": { entity_id: "scene.good_morning", state: "unknown", attributes: { friendly_name: "Good Morning" } },
  "switch.hidden": { entity_id: "switch.hidden", state: "on", attributes: {} },
  "switch.config": { entity_id: "switch.config", state: "on", attributes: {} },
  "sensor.living_temp": { entity_id: "sensor.living_temp", state: "21.6", attributes: {} },
  "binary_sensor.door": { entity_id: "binary_sensor.door", state: "on", attributes: { device_class: "door", friendly_name: "Patio Door" } },
};

test("buildRooms groups by area, filters hidden/category, sorts controls first", () => {
  const home = buildRooms(areas, devices, entries, states);
  assert.deepEqual(home.rooms.map((r) => r.name), ["Living Room", "Bedroom"]); // Garage has no tiles
  const living = home.rooms[0];
  assert.deepEqual(living.tiles.map((t) => t.id), ["light.sofa", "binary_sensor.door", "lock.front", "scene.movie"]);
  assert.equal(living.temperature, "22°");
  assert.equal(living.tiles[0].stateText, "50%");
  assert.equal(living.tiles[0].fill, undefined); // lights fill the whole button or none; brightness is not a bar
  assert.equal(living.tiles[0].active, true);
  assert.equal(living.tiles[2].fill, undefined); // lock has no level
  assert.equal(living.tiles[1].stateText, "Open");
  assert.equal(living.tiles[2].active, false); // locked = inactive
  const bed = home.rooms[1];
  assert.equal(bed.tiles[0].name, "Light"); // device name stripped (has_entity_name)
  assert.equal(bed.tiles[0].room, "Bedroom"); // area via device
});

test("favorites come from the label, padded with scenes", () => {
  const home = buildRooms(areas, devices, entries, states);
  assert.deepEqual(home.favorites.map((t) => t.id), ["light.sofa", "scene.good_morning", "scene.movie"]);
  assert.equal(home.favorites[0].room, "Living Room");
});

test("tapAction per domain", () => {
  assert.deepEqual(tapAction(states["light.sofa"]), { domain: "homeassistant", service: "toggle" });
  assert.deepEqual(tapAction(states["lock.front"]), { domain: "lock", service: "unlock" });
  assert.deepEqual(tapAction(states["scene.movie"]), { domain: "scene", service: "turn_on" });
  assert.equal(tapAction(states["binary_sensor.door"]), undefined);
  assert.equal(tapAction({ entity_id: "cover.x", state: "open", attributes: { supported_features: 1 } }), undefined);
  assert.deepEqual(tapAction({ entity_id: "cover.x", state: "open", attributes: { supported_features: 3 } }), { domain: "cover", service: "toggle" });
  assert.equal(stateText({ entity_id: "climate.x", state: "heat", attributes: { current_temperature: 20.5 } }), "20.5°");
});

test("fillPercent follows position and fan speed, and lights stay empty until a dim gesture", () => {
  assert.equal(fillPercent({ entity_id: "light.a", state: "on", attributes: { brightness: 117 } }), undefined);
  assert.equal(fillPercent({ entity_id: "light.a", state: "off", attributes: { brightness: 117 } }), undefined);
  assert.equal(brightnessPercent({ entity_id: "light.a", state: "on", attributes: { brightness: 117 } }), 46);
  assert.equal(brightnessPercent({ entity_id: "light.a", state: "off", attributes: { brightness: 117, supported_features: 1 } }), 0);
  assert.equal(brightnessPercent({ entity_id: "light.a", state: "on", attributes: {} }), undefined);
  assert.equal(fillPercent({ entity_id: "cover.a", state: "open", attributes: { current_position: 40 } }), 40);
  assert.equal(fillPercent({ entity_id: "fan.a", state: "on", attributes: { percentage: 75 } }), 75);
  assert.equal(fillPercent({ entity_id: "light.a", state: "unavailable", attributes: {} }), undefined);
  assert.equal(fillPercent({ entity_id: "lock.a", state: "locked", attributes: {} }), undefined);
  assert.equal(fillPercent({ entity_id: "sensor.phone", state: "64", attributes: { device_class: "battery" } }), 64);
});
