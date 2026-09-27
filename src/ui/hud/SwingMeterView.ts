import type { SwingPhase } from '../../gameplay/swing/SwingMeter';

export interface HudState {
  phase: SwingPhase;
  power: number;
  accuracy: number;
  hint: string;
  aimText: string;
  metaText: string;
  callout: string;
  calloutQuality: string;
}

export class SwingMeterView {
  private readonly bottom: HTMLElement;
  private readonly label: HTMLElement;
  private readonly hint: HTMLElement;
  private readonly powerMeter: HTMLElement;
  private readonly powerFill: HTMLElement;
  private readonly powerNeedle: HTMLElement;
  private readonly strikeNeedle: HTMLElement;
  private readonly aim: HTMLElement;
  private readonly meta: HTMLElement;
  private readonly callout: HTMLElement;

  constructor(doc: ParentNode) {
    this.bottom = must(doc, '#hud-bottom');
    this.label = must(doc, '#swing-label');
    this.hint = must(doc, '#swing-hint');
    this.powerMeter = must(doc, '#power-meter');
    this.powerFill = must(doc, '#power-fill');
    this.powerNeedle = must(doc, '#power-needle');
    this.strikeNeedle = must(doc, '#strike-needle');
    this.aim = must(doc, '#hud-aim');
    this.meta = must(doc, '#hud-meta');
    this.callout = must(doc, '#shot-callout');
  }

  render(state: HudState): void {
    this.bottom.dataset.phase = state.phase;

    const powerPct = Math.round(clamp(state.power, 0, 1) * 100);
    this.powerFill.style.width = `${powerPct}%`;
    this.powerNeedle.style.left = `${powerPct}%`;
    this.powerMeter.setAttribute('aria-valuenow', String(powerPct));

    const accPct = ((clamp(state.accuracy, -1, 1) + 1) / 2) * 100;
    this.strikeNeedle.style.left = `${accPct}%`;

    this.label.textContent = phaseLabel(state.phase);
    this.hint.textContent = state.hint;
    this.aim.textContent = state.aimText;
    this.meta.textContent = state.metaText;

    if (state.callout) {
      this.callout.textContent = state.callout;
      this.callout.className = `show ${state.calloutQuality}`;
    } else {
      this.callout.textContent = '';
      this.callout.className = '';
    }
  }
}

function phaseLabel(phase: SwingPhase): string {
  switch (phase) {
    case 'power':
      return 'Power';
    case 'accuracy':
      return 'Strike';
    case 'flight':
      return 'In flight';
    case 'settled':
      return 'Next shot';
    case 'idle':
      return 'Driver swing';
  }
}

function must(doc: ParentNode, selector: string): HTMLElement {
  const el = doc.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`${selector} missing`);
  return el;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
