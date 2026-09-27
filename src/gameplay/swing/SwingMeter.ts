/**
 * Classic 3-click arcade swing:
 *  Click 1 — start power sweep
 *  Click 2 — lock power
 *  Click 3 — lock accuracy (timing) and fire
 */

export type SwingPhase =
  | 'idle'
  | 'power'
  | 'accuracy'
  | 'launched'
  | 'settled';

export interface SwingResult {
  /** 0..1 power fraction. */
  power: number;
  /** -1..1 accuracy offset (negative = left, positive = right). */
  accuracy: number;
}

export interface SwingMeterHud {
  fill: HTMLElement;
  meter: HTMLElement;
  hint: HTMLElement;
  label: HTMLElement;
}

const POWER_SPEED = 1.35; // full 0→1 cycle half-period ~0.74s
const ACCURACY_SPEED = 2.4;

export class SwingMeter {
  phase: SwingPhase = 'idle';
  /** Current power needle 0..1 while sweeping / locked. */
  power = 0;
  /** Current accuracy needle -1..1 while sweeping / locked. */
  accuracy = 0;

  private powerDir = 1;
  private accuracyDir = 1;
  private lockedPower = 0;
  private lockedAccuracy = 0;

  constructor(private readonly hud: SwingMeterHud) {
    this.refreshHud();
  }

  /** Handle a click. Returns a SwingResult when click 3 launches. */
  handleClick(): SwingResult | null {
    switch (this.phase) {
      case 'idle':
      case 'settled':
        this.phase = 'power';
        this.power = 0;
        this.powerDir = 1;
        this.accuracy = 0;
        this.refreshHud();
        return null;

      case 'power':
        this.lockedPower = this.power;
        this.phase = 'accuracy';
        this.accuracy = 0;
        this.accuracyDir = 1;
        this.refreshHud();
        return null;

      case 'accuracy': {
        this.lockedAccuracy = this.accuracy;
        this.phase = 'launched';
        this.refreshHud();
        return {
          power: this.lockedPower,
          accuracy: this.lockedAccuracy,
        };
      }

      case 'launched':
        // Ignore clicks while ball is in flight
        return null;

      default:
        return null;
    }
  }

  /** Advance sweeping needles. Call each frame with dt seconds. */
  update(dt: number): void {
    if (this.phase === 'power') {
      this.power += this.powerDir * POWER_SPEED * dt;
      if (this.power >= 1) {
        this.power = 1;
        this.powerDir = -1;
      } else if (this.power <= 0) {
        this.power = 0;
        this.powerDir = 1;
      }
      this.refreshHud();
    } else if (this.phase === 'accuracy') {
      this.accuracy += this.accuracyDir * ACCURACY_SPEED * dt;
      if (this.accuracy >= 1) {
        this.accuracy = 1;
        this.accuracyDir = -1;
      } else if (this.accuracy <= -1) {
        this.accuracy = -1;
        this.accuracyDir = 1;
      }
      this.refreshHud();
    }
  }

  /** Call when the ball has nearly stopped after a stroke. */
  markSettled(): void {
    if (this.phase === 'launched') {
      this.phase = 'settled';
      this.refreshHud();
    }
  }

  /** Arm for another stroke from current lie (or after tee reset). */
  armNextStroke(): void {
    this.phase = 'idle';
    this.power = 0;
    this.accuracy = 0;
    this.refreshHud();
  }

  private refreshHud(): void {
    const { fill, meter, hint, label } = this.hud;

    let display = 0;
    if (this.phase === 'power') {
      display = this.power;
    } else if (this.phase === 'accuracy' || this.phase === 'launched') {
      // Show locked power; accuracy shown via fill offset tint later if needed
      display = this.lockedPower || this.power;
    } else if (this.phase === 'settled') {
      display = this.lockedPower;
    }

    const pct = Math.round(display * 100);
    fill.style.width = `${pct}%`;
    meter.setAttribute('aria-valuenow', String(pct));

    // Accuracy phase: shift fill border color feel via a CSS custom property
    if (this.phase === 'accuracy') {
      // Map -1..1 → 0..100 for a secondary visual: left edge of a marker
      const accPct = ((this.accuracy + 1) / 2) * 100;
      fill.style.boxShadow = `inset ${accPct - 50}% 0 0 0 rgba(0,0,0,0.15)`;
      meter.setAttribute('data-accuracy', this.accuracy.toFixed(2));
    } else {
      fill.style.boxShadow = '';
      meter.removeAttribute('data-accuracy');
    }

    label.textContent = 'Swing meter (3-click)';

    switch (this.phase) {
      case 'idle':
        hint.textContent =
          'Click 1: start power sweep · Click 2: lock power · Click 3: lock accuracy & launch';
        break;
      case 'power':
        hint.textContent = `Power sweeping… click to lock (${pct}%)`;
        break;
      case 'accuracy': {
        const side =
          Math.abs(this.accuracy) < 0.08
            ? 'sweet spot'
            : this.accuracy < 0
              ? 'left'
              : 'right';
        hint.textContent = `Accuracy sweeping… click to launch (${side})`;
        break;
      }
      case 'launched':
        hint.textContent = 'Ball in flight…';
        break;
      case 'settled':
        hint.textContent =
          'Ball settled — click for next stroke · press R to reset to tee';
        break;
    }
  }
}
