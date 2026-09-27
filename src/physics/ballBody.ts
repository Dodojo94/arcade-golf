import * as CANNON from 'cannon-es';
import type * as THREE from 'three';

export const BALL_RADIUS = 0.18;

export const TEE_POSITION = { x: 0, y: BALL_RADIUS, z: 6 };

export function createBallBody(
  world: CANNON.World,
  ballMaterial: CANNON.Material,
  position = TEE_POSITION,
): CANNON.Body {
  const body = new CANNON.Body({
    mass: 0.046, // ~golf ball kg, arcade-scaled
    shape: new CANNON.Sphere(BALL_RADIUS),
    position: new CANNON.Vec3(position.x, position.y, position.z),
    linearDamping: 0.12,
    angularDamping: 0.3,
    sleepSpeedLimit: 0.15,
    sleepTimeLimit: 0.4,
    material: ballMaterial,
  });
  world.addBody(body);
  return body;
}

/** Copy cannon body transform onto the Three mesh. */
export function syncBallMesh(
  mesh: THREE.Object3D,
  body: CANNON.Body,
): void {
  mesh.position.set(body.position.x, body.position.y, body.position.z);
  mesh.quaternion.set(
    body.quaternion.x,
    body.quaternion.y,
    body.quaternion.z,
    body.quaternion.w,
  );
}

export function resetBallToTee(body: CANNON.Body): void {
  body.wakeUp();
  body.velocity.set(0, 0, 0);
  body.angularVelocity.set(0, 0, 0);
  body.position.set(TEE_POSITION.x, TEE_POSITION.y, TEE_POSITION.z);
  body.quaternion.set(0, 0, 0, 1);
}

/** True when the ball is nearly stopped on the ground. */
export function isBallSettled(body: CANNON.Body): boolean {
  const speed = body.velocity.length();
  const nearGround = body.position.y <= BALL_RADIUS + 0.05;
  return nearGround && speed < 0.2;
}

export function isBallAirborne(body: CANNON.Body): boolean {
  return body.position.y > BALL_RADIUS + 0.08;
}
