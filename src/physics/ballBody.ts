import * as CANNON from 'cannon-es';
import type { Object3D } from 'three';

export const BALL_RADIUS = 0.18;
export const BALL_MASS = 0.045;

/** Horizontal brake in newtons while the ball is rolling, so drives finish. */
export const ROLL_BRAKE = 0.35;

const brakeForce = new CANNON.Vec3();

export interface BallSpawn {
  x: number;
  y: number;
  z: number;
}

export function createBallBody(
  world: CANNON.World,
  material: CANNON.Material,
  spawn: BallSpawn,
): CANNON.Body {
  const body = new CANNON.Body({
    mass: BALL_MASS,
    shape: new CANNON.Sphere(BALL_RADIUS),
    position: new CANNON.Vec3(spawn.x, spawn.y, spawn.z),
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

export function resetBallToTee(body: CANNON.Body, spawn: BallSpawn): void {
  body.velocity.set(0, 0, 0);
  body.angularVelocity.set(0, 0, 0);
  body.force.set(0, 0, 0);
  body.torque.set(0, 0, 0);
  body.position.set(spawn.x, spawn.y, spawn.z);
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
export function applyHorizontalBrake(body: CANNON.Body, newtons: number): void {
  if (isBallAirborne(body) || newtons <= 0) return;
  const speed = Math.hypot(body.velocity.x, body.velocity.z);
  if (speed < 0.05) return;
  brakeForce.set(
    (-body.velocity.x / speed) * newtons,
    0,
    (-body.velocity.z / speed) * newtons,
  );
  body.applyForce(brakeForce);
}

export function applyRollBrake(body: CANNON.Body): void {
  applyHorizontalBrake(body, ROLL_BRAKE);
}
