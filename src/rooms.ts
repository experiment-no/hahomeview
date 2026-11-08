// Pure room model: HA registries + states -> rooms of tiles. No DOM, no library imports (node --test loads it).

export interface Area {
  area_id: string;
  name: string;
  floor_id?: string | null;
  icon?: string | null;
  temperature_entity_id?: string | null;
  humidity_entity_id?: string | null;
}
export interface Device {
  id: string;
  area_id?: string | null;
  name?: string | null;
  name_by_user?: string | null;
}
/** Compact entry from `config/entity_registry/list_for_display`. */
export interface EntityEntry {
  ei: string;
  di?: string;
  ai?: string;
  lb?: string[];
  ec?: number;
  en?: string;
  ic?: string;
  pl?: string;
  tk?: string;
  hb?: boolean;
  hn?: boolean;
  dp?: number;
}
export interface EntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
}

export type Group = "lights" | "climate" | "covers" | "media" | "security" | "actions" | "others";
const GROUP_ORDER: Group[] = ["lights", "climate", "covers", "media", "security", "actions", "others"];

export interface Tile {
  id: string;
  name: string;
  domain: string;
  group: Group;
  active: boolean;
  state: string;
  stateText: string;
  /** Room name, shown as the subtitle on the Home page. */
  room?: string;
  /** Camera snapshot URL when the tile is a camera. */
  image?: string;
  /** 0–100 bottom-up fill for dimmable entities. Absent when the entity has no level. */
  fill?: number;
  entry: EntityEntry;
}
export interface Room {
  id: string;
  name: string;
  tiles: Tile[];
  temperature?: string;
}
export interface Home {
  favorites: Tile[];
  rooms: Room[];
}

export const FAVORITE_LABEL = "favorite";
const HIDDEN_PLATFORMS = new Set(["backup", "mobile_app"]);

export const computeDomain = (id: string) => id.slice(0, id.indexOf("."));

/** Which tiles exist at all: domain (+ device_class for binary sensors) -> group. */
export function tileGroup(domain: string, deviceClass?: string): Group | undefined {
  switch (domain) {
    case "light":
      return "lights";
    case "climate":
    case "humidifier":
    case "water_heater":
      return "climate";
    case "cover":
      return "covers";
    case "media_player":
      return "media";
    case "alarm_control_panel":
    case "lock":
    case "camera":
      return "security";
    case "scene":
    case "script":
      return "actions";
    case "binary_sensor":
      if (deviceClass === "door" || deviceClass === "garage_door" || deviceClass === "window") return "covers";
      if (deviceClass === "motion" || deviceClass === "occupancy") return "security";
      return undefined;
    case "vacuum":
    case "lawn_mower":
    case "valve":
    case "switch":
    case "fan":
    case "siren":
    case "button":
    case "input_boolean":
    case "input_button":
      return "others";
  }
  return undefined;
}

// Copied from HA frontend src/common/entity/state_active.ts (trimmed to tile domains).
export function stateActive(s: EntityState): boolean {
  const domain = computeDomain(s.entity_id);
  const st = s.state;
  if (domain === "button" || domain === "input_button" || domain === "scene" || domain === "script") return false;
  if (st === "unavailable" || st === "unknown" || st === "off") return false;
  switch (domain) {
    case "alarm_control_panel":
      return st !== "disarmed";
    case "cover":
    case "valve":
      return st !== "closed";
    case "lawn_mower":
    case "vacuum":
      return !["docked", "paused", "idle"].includes(st);
    case "lock":
      return st !== "locked";
    case "media_player":
      return st !== "standby";
    case "camera":
      return st === "streaming" || st === "recording";
  }
  return true;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");

/** 0–100 brightness for a dimmable light. Undefined when the light cannot be dimmed. Off is 0. */
export function brightnessPercent(s: EntityState): number | undefined {
  if (computeDomain(s.entity_id) !== "light") return undefined;
  if (s.state === "unavailable" || s.state === "unknown") return undefined;
  const a = s.attributes;
  const canDim = ((a.supported_features ?? 0) & 1) === 1 || typeof a.brightness === "number";
  if (!canDim) return undefined;
  if (s.state !== "on") return 0;
  if (typeof a.brightness !== "number") return 100;
  return Math.max(0, Math.min(100, Math.round(a.brightness / 2.55)));
}

/** Bottom-up glass fill. A light is the full white veil or nothing; brightness is changed by holding, not drawn as a bar. */
export function fillPercent(s: EntityState): number | undefined {
  if (s.state === "unavailable" || s.state === "unknown") return undefined;
  const domain = computeDomain(s.entity_id);
  const a = s.attributes;
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  if (domain === "light") return undefined;
  if (domain === "cover" && typeof a.current_position === "number") return clamp(a.current_position);
  if (domain === "fan" && typeof a.percentage === "number") return clamp(a.percentage);
  if (domain === "media_player" && typeof a.volume_level === "number" && s.state !== "off" && s.state !== "standby")
    return clamp(a.volume_level * 100);
  if (domain === "sensor" && a.device_class === "battery") {
    const n = Number(s.state);
    if (Number.isFinite(n)) return clamp(n);
  }
  return undefined;
}

export function stateText(s: EntityState): string {
  const a = s.attributes;
  const domain = computeDomain(s.entity_id);
  if (s.state === "unavailable") return "Unavailable";
  if (domain === "light" && s.state === "on" && typeof a.brightness === "number") return `${Math.round(a.brightness / 2.55)}%`;
  if (domain === "climate" && typeof a.current_temperature === "number") return `${a.current_temperature}°`;
  if (domain === "cover" && typeof a.current_position === "number" && s.state === "open" && a.current_position < 100)
    return `${a.current_position}% open`;
  if (domain === "media_player" && s.state === "playing" && a.media_title) return String(a.media_title);
  if (domain === "scene" || domain === "script" || domain === "button" || domain === "input_button") return "";
  if (domain === "binary_sensor") {
    const dc = a.device_class;
    if (dc === "door" || dc === "garage_door" || dc === "window") return s.state === "on" ? "Open" : "Closed";
    if (dc === "motion") return s.state === "on" ? "Motion" : "Clear";
    if (dc === "occupancy") return s.state === "on" ? "Occupied" : "Clear";
  }
  return cap(s.state);
}

export interface ServiceCall {
  domain: string;
  service: string;
}

const supports = (s: EntityState, bit: number) => ((s.attributes.supported_features ?? 0) & bit) === bit;

/** What a tap does; undefined = read-only tile. Mirrors HA's get_toggle_action special cases. */
export function tapAction(s: EntityState): ServiceCall | undefined {
  const domain = computeDomain(s.entity_id);
  switch (domain) {
    case "light":
    case "switch":
    case "input_boolean":
    case "fan":
    case "humidifier":
    case "siren":
      return { domain: "homeassistant", service: "toggle" };
    case "lock":
      return { domain, service: s.state === "locked" ? "unlock" : "lock" };
    case "cover":
      return supports(s, 1) && supports(s, 2) ? { domain, service: "toggle" } : undefined; // OPEN | CLOSE
    case "valve":
      return { domain, service: s.state === "closed" ? "open_valve" : "close_valve" };
    case "scene":
    case "script":
      return { domain, service: "turn_on" };
    case "button":
    case "input_button":
      return { domain, service: "press" };
    case "media_player":
      return supports(s, 16384) || supports(s, 1) // PLAY | PAUSE
        ? { domain, service: "media_play_pause" }
        : { domain: "homeassistant", service: "toggle" };
    case "vacuum":
      return { domain, service: s.state === "docked" || s.state === "idle" ? "start" : "return_to_base" };
  }
  return undefined;
}

function tileName(s: EntityState, entry: EntityEntry, device?: Device): string {
  let name: string = s.attributes.friendly_name ?? cap(s.entity_id.slice(s.entity_id.indexOf(".") + 1));
  const deviceName = device?.name_by_user || device?.name;
  // has_entity_name: friendly_name is "<device> <entity>"; drop the device part inside a room.
  if (entry.hn && deviceName && name !== deviceName && name.startsWith(deviceName)) name = name.slice(deviceName.length).trim();
  return name;
}

export function buildRooms(
  areas: Area[],
  devices: Device[],
  entries: EntityEntry[],
  states: Record<string, EntityState>
): Home {
  const deviceById = new Map(devices.map((d) => [d.id, d]));
  const areaById = new Map(areas.map((a) => [a.area_id, a]));
  const tilesByArea = new Map<string, Tile[]>();
  const favorites: Tile[] = [];
  const scenes: Tile[] = [];

  for (const entry of entries) {
    const s = states[entry.ei];
    if (!s || entry.hb || entry.ec !== undefined || (entry.pl && HIDDEN_PLATFORMS.has(entry.pl))) continue;
    const domain = computeDomain(entry.ei);
    const group = tileGroup(domain, s.attributes.device_class);
    if (!group) continue;
    const device = entry.di ? deviceById.get(entry.di) : undefined;
    const areaId = entry.ai || device?.area_id || undefined;
    const area = areaId ? areaById.get(areaId) : undefined;
    const tile: Tile = {
      id: entry.ei,
      name: tileName(s, entry, device),
      domain,
      group,
      active: stateActive(s),
      state: s.state,
      stateText: stateText(s),
      fill: fillPercent(s),
      room: area?.name,
      image: domain === "camera" && s.attributes.entity_picture ? s.attributes.entity_picture : undefined,
      entry,
    };
    if (area) {
      let list = tilesByArea.get(area.area_id);
      if (!list) tilesByArea.set(area.area_id, (list = []));
      list.push(tile);
    }
    if (entry.lb?.includes(FAVORITE_LABEL)) favorites.push(tile);
    else if (domain === "scene") scenes.push(tile);
  }

  const rooms: Room[] = [];
  for (const area of areas) {
    const tiles = tilesByArea.get(area.area_id);
    if (!tiles) continue;
    const temp = area.temperature_entity_id ? states[area.temperature_entity_id] : undefined;
    rooms.push({
      id: area.area_id,
      name: area.name,
      tiles: sortTiles(tiles),
      temperature:
        temp && temp.state !== "unavailable" && temp.state !== "unknown"
          ? `${Math.round(Number(temp.state))}°`
          : undefined,
    });
  }
  // ponytail: favorites = HA label "favorite"; padded with scenes so a fresh install isn't blank.
  const favs = sortTiles(favorites);
  for (const sc of sortTiles(scenes)) {
    if (favs.length >= 8) break;
    favs.push(sc);
  }
  return { favorites: favs, rooms };
}

function sortTiles(tiles: Tile[]): Tile[] {
  return tiles.sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) || a.name.localeCompare(b.name));
}
