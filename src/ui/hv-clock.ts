import { LitElement, html, css, svg } from "lit";
import { glass, glassLayers } from "./glass.ts";

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
        --radius: 50%;
        --surface-alpha: 0.18;
        display: flex;
        align-items: center;
        justify-content: center;
        aspect-ratio: 1;
        overflow: hidden;
        cursor: default;
        color: #fff;
      }
      /* Clock is chrome, not a control — no press scale. */
      :host(:active) { transform: none; }
      @media (hover: hover) and (pointer: fine) {
        :host(:hover) { box-shadow: var(--glass-shadow-stack); }
      }
      .face-svg {
        position: relative;
        z-index: 5;
        width: 78%;
        height: 78%;
        filter: drop-shadow(0 1px 1.5px rgba(0, 0, 0, 0.7));
      }
      .ring { fill: none; stroke: #fff; stroke-width: 1.25; }
      .tick { stroke: #fff; stroke-linecap: round; }
      .hand { stroke: #fff; stroke-linecap: round; }
      .hub { fill: #fff; }
    `,
  ];

  render() {
    const d = this._now;
    const s = d.getSeconds();
    const m = d.getMinutes() + s / 60;
    const h = (d.getHours() % 12) + m / 60;
    const hand = (deg: number, len: number, w: number) =>
      svg`<line class="hand" x1="50" y1="54" x2="50" y2="${50 - len}" stroke-width="${w}" transform="rotate(${deg} 50 50)"/>`;
    const ticks = [...Array(12)].map((_, i) => {
      const a = (i * Math.PI) / 6;
      const major = i % 3 === 0;
      const inner = major ? 34 : 39;
      const outer = 45.2;
      return svg`<line class="tick" x1="${50 + inner * Math.sin(a)}" y1="${50 - inner * Math.cos(a)}" x2="${50 + outer * Math.sin(a)}" y2="${50 - outer * Math.cos(a)}" stroke-width="${major ? 2.6 : 1.35}"/>`;
    });
    return html`${glassLayers()}<svg class="face-svg" viewBox="0 0 100 100">
      <circle class="ring" cx="50" cy="50" r="46" />
      ${ticks}
      ${hand(h * 30, 18, 3.4)}
      ${hand(m * 6, 28, 2.2)}
      <circle class="hub" cx="50" cy="50" r="2.1" />
    </svg>`;
  }
}
customElements.define("hv-clock", HvClock);
