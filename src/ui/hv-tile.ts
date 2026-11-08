import { LitElement, html, css, nothing } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { glass, glassLayers } from "./glass.ts";
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
      }
      :host([readonly]) { cursor: default; }

      :host([active]) {
        --surface-alpha: var(--glass-opacity-on);
        color: var(--glass-text-on);
        --_icon: var(--glass-text-on);
      }
      :host([active]) .sub { color: var(--glass-secondary-on); }
      .sub { color: var(--glass-secondary-off); }
      @media (prefers-color-scheme: dark) {
        :host(:not([active])) .icon,
        :host(:not([active])) .text {
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.55));
        }
      }

      :host([group="lights"]) { --fill-color: rgba(255, 196, 48, 0.88); }
      :host([group="covers"]) { --fill-color: rgba(96, 140, 176, 0.55); }
      :host([group="others"]) { --fill-color: rgba(170, 206, 255, 0.72); }
      :host([group="media"]) { --fill-color: rgba(255, 170, 210, 0.6); }
      :host([group="climate"]) { --fill-color: rgba(255, 150, 90, 0.55); }

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
      :host([image]) .lens,
      :host([image]) .fill { display: none; }
      :host([image]) .surface {
        inset: 0;
        border-radius: inherit;
        box-shadow: none;
        background: linear-gradient(transparent 46%, rgba(0, 0, 0, 0.5));
        -webkit-backdrop-filter: none;
        backdrop-filter: none;
        -webkit-mask-image: none;
        mask-image: none;
      }
      :host([image]) .text {
        position: relative;
        z-index: 5;
        padding: 10px 12px;
        width: 100%;
        text-align: left;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.55));
      }
      :host([image]) { --surface-alpha: 0.12; color: #fff; --_icon: #fff; }
      :host([image]) .fill { display: none; }
      :host([image]) .text { filter: none; }

      .icon {
        position: relative;
        z-index: 5;
        width: 38%;
        height: 38%;
        color: var(--_icon);
        margin-bottom: 4px;
        transition: color var(--duration) var(--ease-out);
      }
      .icon svg { width: 100%; height: 100%; }
      .text { position: relative; z-index: 5; width: 100%; min-width: 0; }
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
        z-index: 6;
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
      ${glassLayers(t.fill ?? 0)}
      ${t.image ? html`<img src=${t.image} alt="" draggable="false" />` : html`<div class="icon">${this.iconPath ? unsafeSVG(this.iconPath) : nothing}</div>`}
      <div class="text">
        <div class="name">${t.name}</div>
        <div class="sub">${sub}</div>
      </div>
      <div class="badge">${this.size ?? "S"}</div>`;
  }
}
customElements.define("hv-tile", HvTile);
