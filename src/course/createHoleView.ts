import * as THREE from 'three';

import type { HoleDef, Volume } from './Hole';

const Y = {
  rough: 0,
  fairway: 0.02,
  stripe: 0.03,
  water: 0.045,
  fringe: 0.05,
  green: 0.06,
  bunker: 0.07,
  cup: 0.075,
};

/** Drop hole 1’s colored primitives into the scene. No glTF. */
export function createHoleView(scene: THREE.Scene, hole: HoleDef): void {
  addPlane(scene, 110, 110, 0x1e4d28, 0, 0, Y.rough);

  for (const fairway of hole.fairways) {
    addVolume(scene, fairway, 0x3e9b4a, Y.fairway);
  }
  addAimStripe(scene, hole);

  addVolume(scene, inflate(hole.green, 0.85), 0x1f6b34, Y.fringe);
  addVolume(scene, hole.green, 0x6fce63, Y.green);

  for (const bunker of hole.bunkers) {
    addVolume(scene, bunker, 0xe3c56a, Y.bunker);
  }
  for (const pond of hole.water) {
    addVolume(scene, pond, 0x17629e, Y.water);
    addVolume(scene, inflate(pond, -0.75), 0x3d94d4, Y.water + 0.008);
  }

  addTeeMarker(scene, hole);
  addPin(scene, hole);
}

function addAimStripe(scene: THREE.Scene, hole: HoleDef): void {
  const dx = hole.pin.x - hole.tee.x;
  const dz = hole.pin.z - hole.tee.z;
  const length = Math.hypot(dx, dz);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, length), mat(0x4caf50));
  mesh.rotation.x = -Math.PI / 2;
  const group = new THREE.Group();
  group.rotation.y = Math.atan2(dx, -dz);
  group.position.set(
    (hole.tee.x + hole.pin.x) / 2,
    Y.stripe,
    (hole.tee.z + hole.pin.z) / 2,
  );
  group.add(mesh);
  scene.add(group);
}

function addTeeMarker(scene: THREE.Scene, hole: HoleDef): void {
  const tee = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.04, 0.7),
    new THREE.MeshStandardMaterial({ color: 0xd4a017, roughness: 0.8 }),
  );
  tee.position.set(hole.tee.x, 0.03, hole.tee.z + 0.4);
  tee.receiveShadow = true;
  scene.add(tee);
}

function addPin(scene: THREE.Scene, hole: HoleDef): void {
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 2.1, 8),
    new THREE.MeshStandardMaterial({ color: 0xf7f7f7, roughness: 0.45 }),
  );
  pole.position.set(hole.pin.x, 1.05, hole.pin.z);
  pole.castShadow = true;

  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.72, 0.42),
    new THREE.MeshStandardMaterial({
      color: 0xe74c3c,
      roughness: 0.55,
      side: THREE.DoubleSide,
    }),
  );
  flag.position.set(hole.pin.x + 0.38, 1.88, hole.pin.z);
  flag.castShadow = true;

  const cup = new THREE.Mesh(
    new THREE.CircleGeometry(hole.cupRadius, 20),
    new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 1 }),
  );
  cup.rotation.x = -Math.PI / 2;
  cup.position.set(hole.pin.x, Y.cup, hole.pin.z);

  scene.add(pole, flag, cup);
}

function addPlane(
  scene: THREE.Scene,
  width: number,
  depth: number,
  color: number,
  x: number,
  z: number,
  y: number,
): void {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), mat(color));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  scene.add(mesh);
}

function addVolume(scene: THREE.Scene, volume: Volume, color: number, y: number): void {
  const mesh =
    volume.shape === 'box'
      ? new THREE.Mesh(new THREE.PlaneGeometry(volume.hx * 2, volume.hz * 2), mat(color))
      : new THREE.Mesh(new THREE.CircleGeometry(1, 48), mat(color));
  mesh.rotation.x = -Math.PI / 2;
  if (volume.shape === 'ellipse') mesh.scale.set(volume.rx, volume.rz, 1);
  mesh.receiveShadow = true;

  const group = new THREE.Group();
  group.rotation.y = volume.rotation ?? 0;
  group.position.set(volume.x, y, volume.z);
  group.add(mesh);
  scene.add(group);
}

function inflate(volume: Volume, margin: number): Volume {
  if (volume.shape === 'box') {
    return {
      ...volume,
      hx: Math.max(0.2, volume.hx + margin),
      hz: Math.max(0.2, volume.hz + margin),
    };
  }
  return {
    ...volume,
    rx: Math.max(0.2, volume.rx + margin),
    rz: Math.max(0.2, volume.rz + margin),
  };
}

function mat(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.92,
    metalness: 0.02,
  });
}
