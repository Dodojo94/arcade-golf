import * as CANNON from 'cannon-es';
import type { Object3D } from 'three';

export const BALL_RADIUS = 0.18;
export const BALL_MASS = 0.045;

export const TEE_POSITION = { x: 0, y: BALL_RADIUS, z: 6 };

/** Horizontal brake in newtons while the ball is rolling, so drives finish. */
export const ROLL_BRAKE = 0.35;

const brakeForce = new CANNON.Vec3();

export function createBallBody(
  world: CANNON.World,
  material: CANNON.Material,
): CANNON.Body {
  const body = new CANNON.Body({
    mass: BALL_MASS,
    shape: new CANNON.Sphere(BALL_RADIUS),
    position: new CANNON.Vec3(TEE_POSITION.x, TEE_POSITION.y, TEE_POSITION.z),
    linearDamping: 0.06,
    angularDamping: 0.4,
    allowSleep: false,
    material,
  });
  world.addBody(body);
  return body;
}

/** Copy the cannon body onto the Three mesh. */
export function syncBallMesh(mesh: Object3D, body: CANNON.Body): void {
  mesh.position.set(body.position.x, body.position.y, body.position.z);
  mesh.quaternion.set(
    body.quaternion.x,
    body.quaternion.y,
    body.quaternion.z,
    body.quaternion.w,
  );
}

export function resetBallToTee(body: CANNON.Body): void {
  body.velocity.set(0, 0, 0);
  body.angularVelocity.set(0, 0, 0);
  body.force.set(0, 0, 0);
  body.torque.set(0, 0, 0);
  body.position.set(TEE_POSITION.x, TEE_POSITION.y, TEE_POSITION.z);
  body.quaternion.set(0, 0, 0, 1);
}

export function isBallAirborne(body: CANNON.Body): boolean {
  return body.position.y > BALL_RADIUS + 0.12;
}

export function isBallNearlyStopped(body: CANNON.Body): boolean {
  const speed = Math.hypot(body.velocity.x, body.velocity.z);
  return speed < 0.4 && body.position.y < BALL_RADIUS + 0.16;
}

/** Opposes horizontal velocity on the ground. No-op in the air. */
export function applyRollBrake(body: CANNON.Body): void {
  if (isBallAirborne(body)) return;
  const speed = Math.hypot(body.velocity.x, body.velocity.z);
  if (speed < 0.05) return;
  brakeForce.set(
    (-body.velocity.x / speed) * ROLL_BRAKE,
    0,
    (-body.velocity.z / speed) * ROLL_BRAKE,
  );
  body.applyForce(brakeForce);
}
