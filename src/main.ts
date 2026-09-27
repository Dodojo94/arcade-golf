import './style.css';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

import { createPhysicsWorld, PHYSICS_DT } from './physics/world';
import {
  BALL_RADIUS,
  createBallBody,
  isBallAirborne,
  isBallSettled,
  resetBallToTee,
  syncBallMesh,
  TEE_POSITION,
} from './physics/ballBody';
import { SwingMeter } from './gameplay/swing/SwingMeter';
import { Wind } from './gameplay/wind/Wind';
import { ChaseCamera } from './render/camera/ChaseCamera';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('#app root missing');
}

app.innerHTML = `
  <canvas id="game-canvas"></canvas>
  <div id="hud" aria-hidden="false">
    <div id="hud-top">
      <div id="hud-title">Arcade Golf V0 — Hole 1</div>
      <div id="hud-meta">Stroke play · Par 4 · Stroke 1 · Wind —</div>
    </div>
    <div id="hud-bottom">
      <div id="swing-label">Swing meter (3-click)</div>
      <div id="swing-meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <div id="swing-meter-fill"></div>
      </div>
      <div id="swing-hint">Click 1: start power sweep · Click 2: lock power · Click 3: lock accuracy &amp; launch</div>
    </div>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
if (!canvas) {
  throw new Error('#game-canvas missing');
}

const hudMetaEl = document.querySelector<HTMLElement>('#hud-meta');
const swingFill = document.querySelector<HTMLElement>('#swing-meter-fill');
const swingMeterEl = document.querySelector<HTMLElement>('#swing-meter');
const swingHint = document.querySelector<HTMLElement>('#swing-hint');
const swingLabel = document.querySelector<HTMLElement>('#swing-label');
if (!hudMetaEl || !swingFill || !swingMeterEl || !swingHint || !swingLabel) {
  throw new Error('HUD elements missing');
}
const hudMeta: HTMLElement = hudMetaEl;

// --- Three.js scene ---------------------------------------------------------

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 40, 120);

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  200,
);
camera.position.set(0, 8, 14);
camera.lookAt(0, 0, 0);

const hemi = new THREE.HemisphereLight(0xb1e1ff, 0x3d6b2f, 0.55);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff2cc, 1.15);
sun.position.set(12, 22, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 60;
sun.shadow.camera.left = -20;
sun.shadow.camera.right = 20;
sun.shadow.camera.top = 20;
sun.shadow.camera.bottom = -20;
scene.add(sun);

const fairway = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60),
  new THREE.MeshStandardMaterial({
    color: 0x3e9b4a,
    roughness: 0.9,
    metalness: 0.05,
  }),
);
fairway.rotation.x = -Math.PI / 2;
fairway.receiveShadow = true;
scene.add(fairway);

const stripe = new THREE.Mesh(
  new THREE.PlaneGeometry(8, 40),
  new THREE.MeshStandardMaterial({
    color: 0x4caf50,
    roughness: 0.95,
    metalness: 0,
  }),
);
stripe.rotation.x = -Math.PI / 2;
stripe.position.y = 0.01;
stripe.receiveShadow = true;
scene.add(stripe);

const ballMesh = new THREE.Mesh(
  new THREE.SphereGeometry(BALL_RADIUS, 24, 24),
  new THREE.MeshStandardMaterial({
    color: 0xf8f8f8,
    roughness: 0.35,
    metalness: 0.05,
  }),
);
ballMesh.position.set(TEE_POSITION.x, TEE_POSITION.y, TEE_POSITION.z);
ballMesh.castShadow = true;
scene.add(ballMesh);

const tee = new THREE.Mesh(
  new THREE.BoxGeometry(0.6, 0.05, 0.6),
  new THREE.MeshStandardMaterial({ color: 0xd4a017 }),
);
tee.position.set(0, 0.03, 6.4);
tee.receiveShadow = true;
scene.add(tee);

// --- Physics ----------------------------------------------------------------

const { world, ballMaterial } = createPhysicsWorld();
const ballBody = createBallBody(world, ballMaterial);
const wind = new Wind();
const chase = new ChaseCamera();
const swing = new SwingMeter({
  fill: swingFill,
  meter: swingMeterEl,
  hint: swingHint,
  label: swingLabel,
});

/** Default aim: down -Z toward the stripe / pin direction. */
const AIM = new THREE.Vector3(0, 0, -1);
const MAX_LAUNCH_SPEED = 28;
const LOFT = 0.42; // upward mix for arcade arc

let stroke = 1;
let physicsOwnsBall = false; // stop idle bob once we launch once
let awaitingSettle = false;

function updateHudMeta(): void {
  hudMeta.textContent = `Stroke play · Par 4 · Stroke ${stroke} · ${wind.describe()}`;
}
updateHudMeta();

function launchBall(power: number, accuracy: number): void {
  physicsOwnsBall = true;
  awaitingSettle = true;

  // Accuracy nudges aim left/right in X (± ~18°)
  const yaw = accuracy * 0.32;
  const dir = new CANNON.Vec3(
    Math.sin(yaw),
    LOFT,
    -Math.cos(yaw),
  );
  dir.normalize();

  const speed = 4 + power * MAX_LAUNCH_SPEED;
  ballBody.wakeUp();
  ballBody.velocity.set(dir.x * speed, dir.y * speed, dir.z * speed);
  // Tiny top-spin for roll feel
  ballBody.angularVelocity.set(dir.z * speed * 0.4, 0, -dir.x * speed * 0.4);

  stroke += 1;
  updateHudMeta();
}

function doTeeReset(): void {
  resetBallToTee(ballBody);
  syncBallMesh(ballMesh, ballBody);
  physicsOwnsBall = false;
  awaitingSettle = false;
  swing.armNextStroke();
  updateHudMeta();
}

// Pointer / keyboard
canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  // Settled is treated like idle inside SwingMeter — one click starts the next power sweep.
  const result = swing.handleClick();
  if (result) {
    launchBall(result.power, result.accuracy);
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'r' || e.key === 'R') {
    doTeeReset();
  }
});

function onResize(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', onResize);

// --- Loop -------------------------------------------------------------------

const clock = new THREE.Clock();
let accumulator = 0;
const ballPos = new THREE.Vector3();
const ballVel = new THREE.Vector3();

function animate(): void {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  swing.update(dt);

  // Physics step (fixed)
  accumulator += dt;
  while (accumulator >= PHYSICS_DT) {
    if (physicsOwnsBall && isBallAirborne(ballBody)) {
      wind.applyTo(ballBody);
    }
    world.step(PHYSICS_DT);
    accumulator -= PHYSICS_DT;
  }

  if (physicsOwnsBall) {
    syncBallMesh(ballMesh, ballBody);

    if (awaitingSettle && isBallSettled(ballBody)) {
      awaitingSettle = false;
      ballBody.velocity.set(0, 0, 0);
      ballBody.angularVelocity.set(0, 0, 0);
      swing.markSettled();
    }
  } else {
    // Gentle idle bob until physics owns the ball
    const t = clock.elapsedTime;
    ballMesh.position.y = TEE_POSITION.y + Math.sin(t * 2) * 0.02;
    ballBody.position.y = ballMesh.position.y;
  }

  ballPos.copy(ballMesh.position);
  ballVel.set(
    ballBody.velocity.x,
    ballBody.velocity.y,
    ballBody.velocity.z,
  );
  chase.update(camera, ballPos, ballVel, AIM);

  renderer.render(scene, camera);
}

animate();
