import { BALL_RADIUS } from '../physics/ballBody';

/** Ground volumes. `rotation` is yaw in radians, matching a THREE.Group rotation.y. Unused on hole 1. */
export type Volume =
  | {
      shape: 'box';
      x: number;
      z: number;
      /** Half-width along local X. */
      hx: number;
      /** Half-depth along local Z. */
      hz: number;
      rotation?: number;
    }
  | {
      shape: 'ellipse';
      x: number;
      z: number;
      rx: number;
      rz: number;
      rotation?: number;
    };

export type LieKind =
  | 'air'
  | 'tee'
  | 'fairway'
  | 'rough'
  | 'green'
  | 'bunker'
  | 'water'
  | 'hole';

/**
 * One hole of blockout data. World units are meters.
 * Downrange is -Z. +X is right of the tee, looking at the pin.
 */
export interface HoleDef {
  id: number;
  name: string;
  par: number;
  /** Straight-line tee-to-pin distance in meters. */
  yardage: number;
  tee: { x: number; z: number };
  pin: { x: number; z: number };
  /** Horizontal radius for the “in the hole” stub. Not a physics cup. */
  cupRadius: number;
  fairways: Volume[];
  green: Volume;
  bunkers: Volume[];
  water: Volume[];
}

const GROUND_Y = BALL_RADIUS + 0.35;
/** Moving across the cup still reads as green until the ball is nearly stopped. */
const HOLE_SPEED = 0.8;

export function volumeContains(volume: Volume, x: number, z: number): boolean {
  const dx = x - volume.x;
  const dz = z - volume.z;
  const rot = volume.rotation ?? 0;
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const lx = dx * c + dz * s;
  const lz = -dx * s + dz * c;
  if (volume.shape === 'box') {
    return Math.abs(lx) <= volume.hx && Math.abs(lz) <= volume.hz;
  }
  const rx = volume.rx || 1;
  const rz = volume.rz || 1;
  return (lx / rx) * (lx / rx) + (lz / rz) * (lz / rz) <= 1;
}

/**
 * Lie from XZ volumes. Airborne balls report `air`.
 * `hole` only when grounded, inside the cup, and slow — a flying ball over the pin is not holed.
 */
export function sampleLie(
  hole: HoleDef,
  x: number,
  y: number,
  z: number,
  speed: number,
): LieKind {
  if (y > GROUND_Y) return 'air';

  const toCup = Math.hypot(x - hole.pin.x, z - hole.pin.z);
  if (toCup <= hole.cupRadius && speed < HOLE_SPEED) return 'hole';

  if (hole.water.some((volume) => volumeContains(volume, x, z))) return 'water';
  if (hole.bunkers.some((volume) => volumeContains(volume, x, z))) return 'bunker';
  if (volumeContains(hole.green, x, z)) return 'green';
  if (hole.fairways.some((volume) => volumeContains(volume, x, z))) return 'fairway';
  return 'rough';
}

export function lieLabel(lie: LieKind): string {
  switch (lie) {
    case 'hole':
      return 'In the hole';
    case 'green':
      return 'On the green';
    case 'water':
      return 'Water';
    case 'bunker':
      return 'Bunker';
    case 'fairway':
      return 'Fairway';
    case 'rough':
      return 'Rough';
    case 'tee':
      return 'Tee';
    case 'air':
      return 'In flight';
  }
}
