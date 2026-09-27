import type { Body } from 'cannon-es';

import { BALL_RADIUS, applyHorizontalBrake, isBallAirborne } from '../physics/ballBody';
import { sampleLie, type HoleDef } from './Hole';

/** Extra ground brake so a bunker plugs instead of running through. */
const BUNKER_BRAKE = 1.05;
/** Light extra brake. Small so a full driver still finishes on this green. */
const GREEN_BRAKE = 0.12;

/**
 * Lie drag on top of the normal roll brake.
 * Water kills speed once the ball is down in the pond. Not a penalty drop.
 */
export function applyLieDrag(body: Body, hole: HoleDef): void {
  const speed = Math.hypot(body.velocity.x, body.velocity.z);
  const lie = sampleLie(hole, body.position.x, body.position.y, body.position.z, speed);

  if (lie === 'water' && body.position.y < BALL_RADIUS + 0.45) {
    body.velocity.x *= 0.8;
    body.velocity.z *= 0.8;
    if (body.velocity.y > 0) body.velocity.y *= 0.45;
    return;
  }

  if (isBallAirborne(body)) return;
  if (lie === 'bunker') applyHorizontalBrake(body, BUNKER_BRAKE);
  else if (lie === 'green' || lie === 'hole') applyHorizontalBrake(body, GREEN_BRAKE);
}
