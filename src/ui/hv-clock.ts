import { LitElement, html, css, svg } from "lit";
import { glass } from "./glass.ts";

export class HvClock extends LitElement {
  static properties = { _now: { state: true } };
  declare _now: Date;
  private _timer?: ReturnType<typeof setInterval>;

  constructor() {
    super();
    this._now = new Date();
  }
  connectedCallback() {
    super.connectedCallback();
    this._start();
    document.addEventListener("visibilitychange", this._onVisibility);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._stop();
    document.removeEventListener("visibilitychange", this._onVisibility);
  }
  private _onVisibility = () => (document.hidden ? this._stop() : this._start());
  private _start() {
    this._stop();
    this._now = new Date();
    this._timer = setInterval(() => (this._now = new Date()), 1000);
  }
  private _stop() {
    clearInterval(this._timer);
    this._timer = undefined;
  }

  static styles = [
    glass,
    css`
      :host {
        display: flex;
        align-items: center;
        justify-content: center;
        aspect-ratio: 1;
        cursor: default;
      }
      /* Clock is chrome, not a control — kill press/hover lift from glass. */
      :host(:active) { transform: none; filter: none; }
      @media (hover: hover) and (pointer: fine) {
        :host(:hover) { filter: none; background: var(--glass-fill); }
      }
      svg {
        position: relative;
        z-index: 2;
        width: 78%;
        height: 78%;
      }
      .face { fill: rgba(255, 255, 255, 0.78); }
      .tick {
        stroke: var(--text);
        stroke-width: 2;
        stroke-linecap: round;
        opacity: 0.35;
      }
      .num {
        fill: var(--text);
        font-size: 9px;
        font-weight: 600;
        text-anchor: middle;
        opacity: 0.9;
      }
      .hand {
        stroke: var(--text);
        stroke-linecap: round;
      }
      .sec {
        stroke: #ff9f0a;
        stroke-width: 1;
      }
      .hub { fill: #ff9f0a; }
      @media (prefers-color-scheme: dark) {
        .face { fill: rgba(28, 28, 34, 0.78); }
      }
    `,
  ];

  render() {
    const d = this._now;
    const s = d.getSeconds();
    const m = d.getMinutes() + s / 60;
    const h = (d.getHours() % 12) + m / 60;
    const hand = (deg: number, len: number, cls: string, w: number) =>
      svg`<line class="hand ${cls}" x1="50" y1="50" x2="50" y2="${50 - len}" stroke-width="${w}" transform="rotate(${deg} 50 50)"/>`;
    return html`<svg viewBox="0 0 100 100">
      <circle class="face" cx="50" cy="50" r="48" />
      ${[...Array(12)].map((_, i) => {
        const a = (i * Math.PI) / 6;
        const num = i === 0 ? 12 : i;
        return svg`<text class="num" x="${50 + 39 * Math.sin(a)}" y="${50 - 39 * Math.cos(a) + 3}">${num}</text>`;
      })}
      ${hand(h * 30, 22, "", 4)}
      ${hand(m * 6, 32, "", 3)}
      ${hand(s * 6, 36, "sec", 1)}
      <circle class="hub" cx="50" cy="50" r="2.5" />
    </svg>`;
  }
}
customElements.define("hv-clock", HvClock);
