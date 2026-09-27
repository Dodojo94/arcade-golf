import * as CANNON from 'cannon-es';

/** Fixed step. The animate loop accumulates time and calls `World.step`. */
export const PHYSICS_DT = 1 / 60;

export interface PhysicsWorld {
  world: CANNON.World;
  ballMaterial: CANNON.Material;
}

/**
 * Flat arcade ground. A thick box (not an infinite plane) so contact
 * friction actually grabs the ball. Top face sits on y = 0.
 */
export function createPhysicsWorld(): PhysicsWorld {
  const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0),
  });
  world.broadphase = new CANNON.NaiveBroadphase();
  world.allowSleep = false;

  const groundMaterial = new CANNON.Material('ground');
  const ballMaterial = new CANNON.Material('ball');
  world.addContactMaterial(
    new CANNON.ContactMaterial(groundMaterial, ballMaterial, {
      friction: 0.62,
      restitution: 0.22,
    }),
  );

  const ground = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(200, 0.5, 200)),
    position: new CANNON.Vec3(0, -0.5, 0),
    material: groundMaterial,
  });
  world.addBody(ground);

  return { world, ballMaterial };
}
