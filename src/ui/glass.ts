import { css } from "lit";

/**
 * Shared Liquid Glass surface for tiles and chrome.
 * Tokens live on :root (styles.css); this sheet only composes the material.
 *
 * Safari cannot apply SVG filters to backdrop-filter, so depth comes from
 * blur + saturate, translucent fill, specular rim, and layered shadows.
 */
export const glass = css`
  :host {
    display: block;
    position: relative;
    isolation: isolate;
    border-radius: var(--radius);
    background: var(--glass-fill);
    border: 1px solid var(--glass-border-soft);
    box-shadow:
      0 1px 0 var(--glass-highlight) inset,
      0 0 0 0.5px var(--glass-border) inset,
      0 10px 28px -8px var(--glass-shadow),
      0 2px 8px -2px var(--glass-shadow);
    overflow: hidden;
    color: var(--text);
    --_icon: var(--icon);
    transition:
      background var(--duration) var(--ease-out),
      border-color var(--duration) var(--ease-out),
      box-shadow var(--duration) var(--ease-out),
      color var(--duration) var(--ease-out),
      transform var(--duration-fast) var(--ease-out),
      filter var(--duration) var(--ease-out);
  }

  /* Specular sheen — top-left light catch, reads as glass thickness. */
  :host::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    border-radius: inherit;
    background:
      linear-gradient(
        155deg,
        var(--glass-specular) 0%,
        rgba(255, 255, 255, 0.08) 28%,
        rgba(255, 255, 255, 0) 52%
      ),
      linear-gradient(
        to bottom,
        rgba(255, 255, 255, 0.14) 0%,
        rgba(255, 255, 255, 0) 42%
      );
    opacity: 0.95;
    transition: opacity var(--duration) var(--ease-out);
  }

  /* Soft inner vignette so content sits in the glass, not on a flat fill. */
  :host::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    border-radius: inherit;
    background: radial-gradient(
      120% 90% at 50% 110%,
      rgba(0, 0, 0, 0.1) 0%,
      transparent 55%
    );
  }

  @supports ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) {
    :host {
      background: var(--glass-fill);
      -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
      backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
    }
  }

  /* Fallback when backdrop-filter is unavailable: denser fill, no fake blur. */
  @supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) {
    :host {
      background: var(--glass-fill-strong);
    }
  }

  @media (hover: hover) and (pointer: fine) {
    :host(:hover) {
      background: var(--glass-fill-strong);
      box-shadow:
        0 1px 0 var(--glass-highlight) inset,
        0 0 0 0.5px var(--glass-border) inset,
        0 14px 34px -8px var(--glass-shadow-lift),
        0 4px 12px -2px var(--glass-shadow);
      filter: brightness(1.04);
    }
  }

  :host(:active) {
    transform: scale(var(--press-scale));
    filter: brightness(0.98);
  }

  @media (prefers-reduced-motion: reduce) {
    :host {
      transition: none;
    }
    :host(:active) {
      transform: none;
    }
  }
`;
