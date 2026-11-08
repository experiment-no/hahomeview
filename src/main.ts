import "./ui/hv-app.ts";
import { initGlassTransparency } from "./glass-pref.ts";
import { startLensTracking } from "./glass-lens.ts";

initGlassTransparency();
startLensTracking();
import type { HvApp } from "./ui/hv-app.ts";
import { connect, type Registries } from "./ha.ts";
import { buildRooms } from "./rooms.ts";
import type { HassEntities } from "home-assistant-js-websocket";

const app = document.querySelector("hv-app") as HvApp;
let states: HassEntities = {};
let regs: Registries | undefined;
let cameraTick = 0;

const rebuild = () => {
  app.states = states;
  if (regs) app.home = buildRooms(regs.areas, regs.devices, regs.entities, states);
};

connect({
  states: (s) => {
    states = s;
    rebuild();
  },
  registries: (r) => {
    regs = r;
    rebuild();
  },
  config: (c) => (app.version = c.version),
})
  .then((ha) => (app.ha = ha))
  .catch((err) => (app.error = `Could not connect: ${err?.message ?? err}`));

// Camera snapshots: bust the cache every 10 s so <img> reloads.
setInterval(() => {
  if (!regs) return;
  cameraTick++;
  for (const id in states) {
    if (id.startsWith("camera.") && states[id].attributes.entity_picture) {
      states = { ...states, [id]: { ...states[id], attributes: { ...states[id].attributes, entity_picture: `${states[id].attributes.entity_picture.split("&t=")[0]}&t=${cameraTick}` } } };
    }
  }
  rebuild();
}, 10000);
