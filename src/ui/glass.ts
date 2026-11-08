import { css, html, unsafeCSS } from "lit";
import { lensSvg } from "../glass-lens.ts";

/**
 * Optical layers for one glass object. The parent must not use CSS opacity:
 * icons stay in a later stacking level. `fill` is a 0–100 bottom-up level.
 */
export function glassLayers(fill = 0) {
  const level = Number.isFinite(fill) ? Math.max(0, Math.min(100, fill)) : 0;
  return html`${lensSvg()}
    <div class="lens"></div>
    <div class="surface"></div>
    <div class="fill" style="height:${level}%"></div>`;
}

/**
 * Shared Liquid Glass.
 * Safari cannot displace a backdrop-filter, so the rim is a copy of the wallpaper
 * (fixed to the viewport), warped by a static edge map, and masked to the perimeter.
 * The center is the live blurred backdrop. State opacity tints only `.surface`.
 */
function glassRoot(root: string) {
  const r = unsafeCSS(root);
  return css`
    ${r} {
      position: relative;
      overflow: hidden;
      border-radius: var(--radius);
      background: transparent;
      color: var(--glass-text-off);
      --_icon: var(--glass-text-off);
      --surface-alpha: var(--glass-opacity-off);
      box-shadow: var(--glass-shadow-stack);
      transition:
        box-shadow var(--duration) var(--ease-out),
        color var(--duration) var(--ease-out),
        transform var(--duration-fast) var(--ease-out);
    }

    ${r} .defs {
      position: absolute;
      width: 0;
      height: 0;
      overflow: hidden;
    }

    /*
     * Rim refraction. A magnified, edge-displaced copy of the wallpaper is
     * masked to a band that follows the real corner radius. The frosted
     * surface sits inside that band so the bend stays visible.
     */
    ${r} .lens {
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      border-radius: inherit;
      padding: 12px;
      background: var(--wallpaper);
      background-attachment: scroll;
      background-size: var(--wallpaper-lens-size, calc(var(--lens-scale) * 100vw) calc(var(--lens-scale) * 100vh));
      background-repeat: var(--wallpaper-repeat, no-repeat);
      filter: url(#glass-lens);
      -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      -webkit-mask-composite: xor;
      mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      mask-composite: exclude;
    }

    ${r} .surface {
      position: absolute;
      inset: 8px;
      z-index: 1;
      pointer-events: none;
      border-radius: calc(var(--radius) - 8px);
      background: rgba(255, 255, 255, min(1, calc(var(--surface-alpha) * var(--glass-clear-factor))));
      box-shadow: 0 0 10px 5px rgba(255, 255, 255, min(1, calc(var(--surface-alpha) * var(--glass-clear-factor))));
      -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
      backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
      transition: background var(--duration) var(--ease-out), box-shadow var(--duration) var(--ease-out);
    }

    ${r} .fill {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 2;
      height: 0;
      pointer-events: none;
      background: var(--fill-color);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
      -webkit-mask-image: linear-gradient(#000 0, #000 calc(100% - 22px), transparent 100%);
      mask-image: linear-gradient(#000 0, #000 calc(100% - 22px), transparent 100%);
      transition: height var(--duration) var(--ease-out);
    }

    /* Bevel: bright along the top and left, shaded along the bottom. */
    ${r}::before {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 3;
      pointer-events: none;
      border-radius: inherit;
      padding: 1.5px;
      background: linear-gradient(
        160deg,
        rgba(255, 255, 255, 0.95) 0%,
        rgba(255, 255, 255, 0.28) 28%,
        rgba(255, 255, 255, 0.08) 62%,
        rgba(255, 255, 255, 0.45) 100%
      );
      -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      -webkit-mask-composite: xor;
      mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      mask-composite: exclude;
    }

    ${r}::after {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 4;
      pointer-events: none;
      border-radius: inherit;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0.08) 10%, transparent 28%),
        radial-gradient(80% 42% at 18% 0%, rgba(255, 255, 255, 0.32), transparent 60%),
        linear-gradient(to top, rgba(255, 255, 255, 0.14), transparent 18%);
      opacity: var(--glass-highlight-opacity);
    }

    @supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) {
      ${r} .surface {
        background: rgba(255, 255, 255, min(1, calc((var(--surface-alpha) + 0.25) * var(--glass-clear-factor))));
      }
    }

    @media (hover: hover) and (pointer: fine) {
      ${r}:hover {
        box-shadow: var(--glass-shadow-stack-lift);
      }
      ${r}:hover::after {
        opacity: 1;
      }
    }

    ${r}:active {
      transform: scale(var(--press-scale));
    }

    @media (prefers-reduced-motion: reduce) {
      ${r},
      ${r} .surface,
      ${r} .fill {
        transition: none;
      }
      ${r}:active {
        transform: none;
      }
    }
  `;
}

export const glass = glassRoot(":host");
export const glassChip = glassRoot(".glass-chip");
