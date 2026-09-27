import type { ClubDef } from '../clubs/Club';

export type ShotQuality = 'nice' | 'hook' | 'slice' | 'duff';

/** |accuracy| inside this window is a meet (Nice Shot). */
export const NICE_WINDOW = 0.14;
/** |accuracy| past this is a duff. Between the two windows is hook / slice. */
export const DUFF_WINDOW = 0.58;

/**
 * Full-power driver speed in m/s, before club scale.
 * Tuned with cannon-es so a center strike carries ~19m and rolls out ~23m
 * from the tee. Hole 1's pin is 22m downrange; the crosswind drifts the
 * rest about 2m right of the cup.
 */
export const DRIVER_LAUNCH_SPEED = 15;

/** Side force in newtons at full hook/slice while the ball is airborne. */
export const CURVE_FORCE = 0.11;

export interface LaunchInput {
  /** 0..1 */
  power: number;
  /** -1 left .. +1 right. 0 is the meet zone. */
  accuracy: number;
  /** World yaw. 0 aims downrange (-Z). Positive aims right (+X). */
  aimYaw: number;
  club: ClubDef;
}

export interface LaunchVelocity {
  vx: number;
  vy: number;
  vz: number;
  /** -1 curves left (hook), +1 curves right (slice), 0 is straight. */
  spin: number;
  quality: ShotQuality;
  label: string;
}

export function classifyAccuracy(accuracy: number): ShotQuality {
  const mag = Math.abs(accuracy);
  if (mag <= NICE_WINDOW) return 'nice';
  if (mag >= DUFF_WINDOW) return 'duff';
  return accuracy < 0 ? 'hook' : 'slice';
}

export function qualityLabel(quality: ShotQuality): string {
  switch (quality) {
    case 'nice':
      return 'Nice Shot!';
    case 'hook':
      return 'Hook';
    case 'slice':
      return 'Slice';
    case 'duff':
      return 'Duff';
  }
}

export function computeLaunch(input: LaunchInput): LaunchVelocity {
  const quality = classifyAccuracy(input.accuracy);
  let power = clamp(input.power, 0, 1);
  let loft = input.club.loft;
  let yaw = input.aimYaw;
  let spin = 0;

  switch (quality) {
    case 'nice':
      break;
    case 'hook':
      yaw += input.accuracy * 0.28;
      spin = -clamp(Math.abs(input.accuracy) / DUFF_WINDOW, 0, 1);
      power *= 0.97;
      break;
    case 'slice':
      yaw += input.accuracy * 0.28;
      spin = clamp(Math.abs(input.accuracy) / DUFF_WINDOW, 0, 1);
      power *= 0.97;
      break;
    case 'duff':
      // Chunk: low, short, pushed at the miss. No curve.
      yaw += input.accuracy * 0.4;
      power *= 0.5;
      loft = 0.4;
      spin = 0;
      break;
  }

  power = Math.max(power, 0.05);

  const speed = DRIVER_LAUNCH_SPEED * input.club.powerScale * power;
  const horizontal = Math.cos(loft) * speed;
  return {
    vx: Math.sin(yaw) * horizontal,
    vy: Math.sin(loft) * speed,
    vz: -Math.cos(yaw) * horizontal,
    spin,
    quality,
    label: qualityLabel(quality),
  };
}

/**
 * Airborne side force. Positive spin slices right of the velocity,
 * negative spin hooks left. Returns null when there is nothing to apply.
 */
export function curveForce(
  vx: number,
  vz: number,
  spin: number,
): { x: number; z: number } | null {
  if (Math.abs(spin) < 0.05) return null;
  const speed = Math.hypot(vx, vz);
  if (speed < 2) return null;
  const mag = CURVE_FORCE * spin;
  return {
    x: (-vz / speed) * mag,
    z: (vx / speed) * mag,
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
