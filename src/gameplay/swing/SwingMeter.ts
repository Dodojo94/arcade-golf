import { classifyAccuracy, qualityLabel, type ShotQuality } from './launch';

export type SwingPhase = 'idle' | 'power' | 'accuracy' | 'flight' | 'settled';

export interface SwingResult {
  /** 0..1 */
  power: number;
  /** -1..1, 0 = meet zone */
  accuracy: number;
  quality: ShotQuality;
}

/** Seconds for a full 0→1 power sweep (then it rebounds). */
const POWER_SPEED = 0.95;
/** Units per second across the -1..1 strike bar. */
const ACCURACY_SPEED = 1.35;

/**
 * 3-click meter:
 *  1. start — power needle runs toward max, then back
 *  2. lock power
 *  3. lock accuracy (center = Nice Shot, miss = hook / slice / duff)
 */
export class SwingMeter {
  phase: SwingPhase = 'idle';
  power = 0;
  accuracy = 0;

  private powerDir = 1;
  private accuracyDir = 1;
  private lockedPower = 0;
  private lockedAccuracy = 0;

  /** Advance one click. Returns a result only on the strike click. */
  press(): SwingResult | null {
    switch (this.phase) {
      case 'idle':
      case 'settled':
        this.phase = 'power';
        this.power = 0;
        this.powerDir = 1;
        this.accuracy = 0;
        return null;
      case 'power':
        this.lockedPower = this.power;
        this.phase = 'accuracy';
        this.accuracy = -1;
        this.accuracyDir = 1;
        return null;
      case 'accuracy': {
        this.lockedAccuracy = this.accuracy;
        this.phase = 'flight';
        return {
          power: this.lockedPower,
          accuracy: this.lockedAccuracy,
          quality: classifyAccuracy(this.lockedAccuracy),
        };
      }
      case 'flight':
        return null;
    }
  }

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
    } else if (this.phase === 'accuracy') {
      this.accuracy += this.accuracyDir * ACCURACY_SPEED * dt;
      if (this.accuracy >= 1) {
        this.accuracy = 1;
        this.accuracyDir = -1;
      } else if (this.accuracy <= -1) {
        this.accuracy = -1;
        this.accuracyDir = 1;
      }
    }
  }

  markSettled(): void {
    if (this.phase === 'flight') this.phase = 'settled';
  }

  reset(): void {
    this.phase = 'idle';
    this.power = 0;
    this.accuracy = 0;
    this.lockedPower = 0;
    this.lockedAccuracy = 0;
    this.powerDir = 1;
    this.accuracyDir = 1;
  }

  shownPower(): number {
    if (this.phase === 'power' || this.phase === 'idle') return this.power;
    return this.lockedPower;
  }

  shownAccuracy(): number {
    if (this.phase === 'accuracy') return this.accuracy;
    if (this.phase === 'flight' || this.phase === 'settled') {
      return this.lockedAccuracy;
    }
    return 0;
  }

  hint(): string {
    switch (this.phase) {
      case 'idle':
        return 'Aim, then start the swing';
      case 'power':
        return `Set power · ${Math.round(this.power * 100)}%`;
      case 'accuracy':
        return `${qualityLabel(classifyAccuracy(this.accuracy))} — strike now`;
      case 'flight':
        return 'Ball in flight…';
      case 'settled':
        return 'Aim the next shot, or press R for the tee';
    }
  }
}
