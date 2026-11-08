import { LitElement, html, css, nothing } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { glass } from "./glass.ts";
import type { Tile } from "../rooms.ts";

export class HvTile extends LitElement {
  static properties = { tile: { attribute: false }, iconPath: { attribute: false }, subtitle: {}, size: { reflect: true } };
  declare tile: Tile;
  declare iconPath?: string;
  /** "room" on the Home page, "state" inside a room. */
  declare subtitle: "room" | "state";
  declare size: "S" | "M" | "L";

  static styles = [
    glass,
    css`
      :host {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        padding: 10px;
        text-align: center;
        cursor: pointer;
        -webkit-user-drag: none;
        color: var(--text);
      }
      :host([readonly]) { cursor: default; }

      /* Active: tinted glass — still translucent, not a flat opaque chip. */
      :host([active]) {
        background: var(--tint);
        color: var(--tint-text);
        --_icon: var(--tint-text);
        border-color: var(--tint-edge);
        box-shadow:
          0 1px 0 rgba(255, 255, 255, 0.55) inset,
          0 0 0 0.5px var(--tint-edge) inset,
          0 12px 30px -8px var(--glass-shadow),
          0 2px 8px -2px var(--glass-shadow);
      }
      :host([active])::before {
        background:
          linear-gradient(
            155deg,
            rgba(255, 255, 255, 0.5) 0%,
            rgba(255, 255, 255, 0.12) 32%,
            rgba(255, 255, 255, 0) 55%
          ),
          linear-gradient(to bottom, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 45%);
      }
      :host([active])::after {
        background: radial-gradient(120% 90% at 50% 115%, rgba(80, 50, 160, 0.12) 0%, transparent 55%);
      }

      /* Scenes / scripts: warm glass */
      :host([active][group="actions"]) {
        background: var(--tint-warm);
        color: var(--tint-warm-text);
        --_icon: var(--tint-warm-text);
        border-color: var(--tint-warm-edge);
      }
      :host([active][group="actions"])::after {
        background: radial-gradient(120% 90% at 50% 115%, rgba(140, 80, 10, 0.12) 0%, transparent 55%);
      }

      /* Climate: cool glass accent */
      :host([active][group="climate"]) {
        background: var(--tint-cool);
        color: var(--tint-cool-text);
        --_icon: var(--tint-cool-text);
        border-color: var(--tint-cool-edge);
      }
      :host([active][group="climate"])::after {
        background: radial-gradient(120% 90% at 50% 115%, rgba(20, 80, 140, 0.12) 0%, transparent 55%);
      }

      /* Unlocked / security alert: soft peach, not alarm-red */
      :host([active][group="security"]) {
        background: var(--tint-alert);
        color: var(--tint-alert-text);
        --_icon: var(--tint-alert-text);
        border-color: var(--tint-alert-edge);
      }
      :host([active][group="security"])::after {
        background: radial-gradient(120% 90% at 50% 115%, rgba(120, 40, 20, 0.1) 0%, transparent 55%);
      }

      @media (hover: hover) and (pointer: fine) {
        :host([active]:hover) { filter: brightness(1.05); }
      }

      :host([image]) {
        padding: 0;
        justify-content: flex-end;
        align-items: flex-start;
        color: #fff;
        --_icon: #fff;
      }
      img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        z-index: 0;
      }
      :host([image]) .text {
        position: relative;
        z-index: 2;
        padding: 10px 12px;
        width: 100%;
        text-align: left;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.55));
      }
      :host([image])::before { opacity: 0.35; }
      :host([image])::after { display: none; }

      .icon {
        position: relative;
        z-index: 2;
        width: 38%;
        height: 38%;
        color: var(--_icon);
        margin-bottom: 4px;
        transition: color var(--duration) var(--ease-out);
      }
      .icon svg { width: 100%; height: 100%; }
      .text { position: relative; z-index: 2; width: 100%; min-width: 0; }
      .name {
        font-size: 13px;
        font-weight: 600;
        line-height: 1.2;
        letter-spacing: -0.15px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }
      .sub {
        font-size: 11px;
        opacity: 0.72;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }
      .sub:empty { display: none; }

      /* M = wide: icon left, text right. L = big: larger type. */
      :host([size="M"]) { flex-direction: row; gap: 14px; padding: 14px 20px; text-align: left; }
      :host([size="M"]) .icon { width: 22%; height: 46%; margin: 0; flex: none; }
      :host([size="M"]) .name, :host([size="L"]) .name { font-size: 16px; }
      :host([size="M"]) .sub, :host([size="L"]) .sub { font-size: 13px; }
      :host([size="L"]) .icon { width: 32%; height: 32%; margin-bottom: 10px; }

      /* Edit mode: wiggle, size badge, no browser scrolling on the tile. */
      :host([editing]) { touch-action: none; animation: wiggle 0.35s ease-in-out infinite; }
      :host([editing]:active) { transform: none; filter: none; }
      :host([dragging]) { opacity: 0.35; animation: none; filter: none; }
      .badge {
        display: none;
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 3;
        min-width: 22px;
        height: 22px;
        padding: 0 6px;
        border-radius: 11px;
        background: rgba(28, 28, 30, 0.78);
        color: #f2f2f7;
        font-size: 12px;
        font-weight: 700;
        align-items: center;
        justify-content: center;
        -webkit-backdrop-filter: blur(8px);
        backdrop-filter: blur(8px);
      }
      @media (prefers-color-scheme: dark) {
        .badge { background: rgba(245, 245, 247, 0.88); color: #1c1c1e; }
      }
      :host([editing]) .badge { display: flex; }

      @keyframes wiggle {
        0%, 100% { transform: rotate(-0.8deg); }
        50% { transform: rotate(0.8deg); }
      }
      @media (prefers-reduced-motion: reduce) {
        :host([editing]) { animation: none; }
      }
    `,
  ];

  willUpdate() {
    const t = this.tile;
    this.toggleAttribute("active", t.active);
    this.toggleAttribute("image", !!t.image);
    this.setAttribute("group", t.group);
  }

  render() {
    const t = this.tile;
    const sub = this.subtitle === "room" ? t.room ?? "" : t.stateText;
    return html`
      ${t.image ? html`<img src=${t.image} alt="" draggable="false" />` : html`<div class="icon">${this.iconPath ? unsafeSVG(this.iconPath) : nothing}</div>`}
      <div class="text">
        <div class="name">${t.name}</div>
        <div class="sub">${sub}</div>
      </div>
      <div class="badge">${this.size ?? "S"}</div>`;
  }
}
customElements.define("hv-tile", HvTile);
