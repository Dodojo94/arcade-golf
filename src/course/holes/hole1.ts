import type { HoleDef } from '../Hole';

/**
 * Hole 1 blockout — short par 3, colored primitives only.
 * A full driver rolls out ~23m and drifts ~2m right in the crosswind,
 * so the green is sized to catch that ball. The cup is a 0.5m stub.
 *
 * TODO: hole 2 and hole 3. Same HoleDef, separate files. Not authored here.
 */

const tee = { x: 0, z: 8 };
const pin = { x: 0, z: -14 };

export const HOLE_1: HoleDef = {
  id: 1,
  name: 'Hole 1',
  par: 3,
  yardage: Math.round(Math.hypot(pin.x - tee.x, pin.z - tee.z)),
  tee,
  pin,
  cupRadius: 0.5,
  fairways: [{ shape: 'box', x: 0, z: -3, hx: 7.5, hz: 13 }],
  green: { shape: 'ellipse', x: 0, z: -14, rx: 5.2, rz: 5.8 },
  bunkers: [{ shape: 'ellipse', x: -6.3, z: -13.4, rx: 2.2, rz: 1.65 }],
  water: [{ shape: 'ellipse', x: 10.2, z: -13, rx: 4.6, rz: 4.8 }],
};
