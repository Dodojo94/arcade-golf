import * as CANNON from 'cannon-es';

/** Fixed timestep for stable arcade feel. */
export const PHYSICS_DT = 1 / 60;

export interface PhysicsWorld {
  world: CANNON.World;
  ballMaterial: CANNON.Material;
  groundMaterial: CANNON.Material;
}

export function createPhysicsWorld(): PhysicsWorld {
  const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0),
  });
  world.broadphase = new CANNON.NaiveBroadphase();
  world.allowSleep = true;

  const groundMaterial = new CANNON.Material('ground');
  const ballMaterial = new CANNON.Material('ball');
  world.defaultContactMaterial.friction = 0.4;
  world.defaultContactMaterial.restitution = 0.25;
  world.addContactMaterial(
    new CANNON.ContactMaterial(groundMaterial, ballMaterial, {
      friction: 0.55,
      restitution: 0.28,
    }),
  );

  // Infinite ground plane (normal +Y)
  const ground = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
    material: groundMaterial,
  });
  // Plane default normal is +Z; rotate to face up
  ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(ground);

  return { world, ballMaterial, groundMaterial };
}
