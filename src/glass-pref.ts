/** User glass transparency, 0–100. Higher means a clearer lens. 35 is the reference look. */
export const GLASS_TRANSPARENCY_DEFAULT = 35;
const KEY = "hv-glass-transparency";

export function clampTransparency(value: number): number {
  if (!Number.isFinite(value)) return GLASS_TRANSPARENCY_DEFAULT;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/**
 * Scales state opacity. At the default 35 the factor is 1, so off stays 0.35 and on stays 0.25.
 * 100 clears the surface. 0 thickens it. Edges and highlights do not use this.
 */
export function clearFactorForTransparency(transparency: number): number {
  const t = clampTransparency(transparency);
  return Math.round(((100 - t) / 65) * 1000) / 1000;
}

export function applyGlassTransparency(value: number): number {
  const v = clampTransparency(value);
  const factor = clearFactorForTransparency(v);
  const onAlpha = Math.min(1, 0.25 * factor);
  // The on-state is a light veil, so type stays charcoal until the user clears the glass.
  const onIsLight = onAlpha >= 0.2;
  const root = document.documentElement;
  root.style.setProperty("--glass-transparency", String(v));
  root.style.setProperty("--glass-clear-factor", String(factor));
  root.style.setProperty("--glass-text-on", onIsLight ? "#292929" : "rgba(255, 255, 255, 0.96)");
  root.style.setProperty("--glass-secondary-on", onIsLight ? "rgba(40, 40, 40, 0.55)" : "rgba(255, 255, 255, 0.68)");
  try {
    localStorage.setItem(KEY, String(v));
  } catch {
    /* private mode */
  }
  return v;
}

export function readGlassTransparency(): number {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw == null) return GLASS_TRANSPARENCY_DEFAULT;
    return clampTransparency(Number(raw));
  } catch {
    return GLASS_TRANSPARENCY_DEFAULT;
  }
}

export function initGlassTransparency(): number {
  return applyGlassTransparency(readGlassTransparency());
}
