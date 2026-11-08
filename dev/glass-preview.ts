import { html, render } from "lit";
import { applyGlassTransparency, readGlassTransparency } from "/src/glass-pref.ts";
import { startLensTracking } from "/src/glass-lens.ts";
import "/src/ui/hv-tile.ts";
import "/src/ui/hv-clock.ts";
import type { Tile } from "/src/rooms.ts";

const entry = { ei: "x" };

const tiles: Array<Tile & { size?: "S" | "M" | "L"; wide?: boolean; big?: boolean }> = [
  {
    id: "light.kitchen",
    name: "Kitchen Lights",
    domain: "light",
    group: "lights",
    active: true,
    state: "on",
    stateText: "On",
    room: "Kitchen",
    entry,
  },
  {
    id: "light.ceiling",
    name: "Ceiling Lights",
    domain: "light",
    group: "lights",
    active: false,
    state: "off",
    stateText: "Off",
    room: "Living Room",
    entry,
  },
  {
    id: "lock.front",
    name: "Front Door",
    domain: "lock",
    group: "security",
    active: false,
    state: "locked",
    stateText: "Locked",
    room: "Entry",
    entry,
  },
  {
    id: "lock.garage",
    name: "Garage",
    domain: "lock",
    group: "security",
    active: true,
    state: "unlocked",
    stateText: "Unlocked",
    room: "Garage",
    entry,
    wide: true,
    size: "M",
  },
  {
    id: "climate.living",
    name: "Thermostat",
    domain: "climate",
    group: "climate",
    active: true,
    state: "heat",
    stateText: "21°",
    room: "Living Room",
    entry,
  },
  {
    id: "scene.movie",
    name: "Movie Night",
    domain: "scene",
    group: "actions",
    active: false,
    state: "unknown",
    stateText: "",
    room: "Living Room",
    entry,
  },
  {
    id: "switch.fan",
    name: "Ceiling Fan",
    domain: "fan",
    group: "others",
    active: true,
    state: "on",
    stateText: "75%",
    fill: 75,
    room: "Bedroom",
    entry,
    big: true,
    size: "L",
  },
  {
    id: "cover.blinds",
    name: "Blinds",
    domain: "cover",
    group: "covers",
    active: true,
    state: "open",
    stateText: "40% open",
    fill: 40,
    room: "Office",
    entry,
  },
];

const icon = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2zm-2 18a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1h-4v1z"/></svg>`;

const grid = document.getElementById("grid")!;
render(
  html`
    <hv-clock></hv-clock>
    ${tiles.map(
      (t) => html`<hv-tile
        class=${t.big ? "big" : t.wide ? "wide" : ""}
        .tile=${t}
        .iconPath=${icon}
        .size=${t.size ?? "S"}
        subtitle="state"
      ></hv-tile>`
    )}
  `,
  grid
);
startLensTracking();

document.querySelectorAll<HTMLButtonElement>(".themes button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.documentElement.dataset.theme = btn.dataset.theme ?? "dark";
  });
});

const params = new URLSearchParams(location.search);
document.documentElement.dataset.theme = params.get("theme") ?? "dark";

const range = document.querySelector<HTMLInputElement>("#glass-range")!;
const out = document.querySelector<HTMLOutputElement>("#glass-out")!;
const initial = params.has("glass") ? Number(params.get("glass")) : readGlassTransparency();
range.value = String(initial);
out.value = String(applyGlassTransparency(initial));
range.addEventListener("input", () => {
  out.value = String(applyGlassTransparency(Number(range.value)));
});
