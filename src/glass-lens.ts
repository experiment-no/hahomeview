import { svg } from "lit";

const SCALE = 1.12;
let started = false;
let scheduled = false;

/** Keeps each lens copy of the wallpaper lined up with the viewport, magnified about the tile center. */
function placeLenses() {
  scheduled = false;
  const visit = (root: ParentNode) => {
    root.querySelectorAll<HTMLElement>(".lens").forEach((el) => {
      const rootNode = el.getRootNode();
      const host = rootNode instanceof ShadowRoot ? (rootNode.host as HTMLElement) : el;
      const r = host.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      const raw = getComputedStyle(host).getPropertyValue("--lens-scale");
      const s = Number(raw) || SCALE;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      el.style.backgroundPosition = `${r.width / 2 - cx * s}px ${r.height / 2 - cy * s}px`;
    });
    root.querySelectorAll<HTMLElement>("*").forEach((el) => {
      if (el.shadowRoot) visit(el.shadowRoot);
    });
  };
  visit(document);
}

function scheduleLens() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(placeLenses);
}

export function pokeLens() {
  scheduleLens();
}

export function startLensTracking() {
  if (started) return;
  started = true;
  scheduleLens();
  window.addEventListener("scroll", scheduleLens, { capture: true, passive: true });
  window.addEventListener("resize", scheduleLens);
  new MutationObserver(scheduleLens).observe(document.documentElement, { childList: true, subtree: true });
}

let mapUrl: string | undefined;

/** Radial edge bulge: neutral gray in the center, outward shift near the rim. Built once. */
function displacementMapUrl(): string {
  if (mapUrl) return mapUrl;
  const size = 96;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return (mapUrl = "");
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x / (size - 1) - 0.5) * 2;
      const ny = (y / (size - 1) - 0.5) * 2;
      const dist = Math.min(1, Math.hypot(nx, ny));
      const edge = dist <= 0.42 ? 0 : ((dist - 0.42) / 0.58) ** 2;
      const dx = Math.max(0, Math.min(255, Math.round(128 + nx * edge * 96)));
      const dy = Math.max(0, Math.min(255, Math.round(128 + ny * edge * 96)));
      const i = (y * size + x) * 4;
      img.data[i] = dx;
      img.data[i + 1] = dy;
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return (mapUrl = canvas.toDataURL());
}

/** Filter lives in the shadow root so url(#glass-lens) can see it. */
export function lensSvg() {
  const href = displacementMapUrl();
  return svg`<svg class="defs" width="0" height="0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <filter id="glass-lens" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
      <feImage href=${href} xlink:href=${href} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map"></feImage>
      <feDisplacementMap in="SourceGraphic" in2="map" scale="28" xChannelSelector="R" yChannelSelector="G"></feDisplacementMap>
    </filter>
  </svg>`;
}
