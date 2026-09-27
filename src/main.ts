import './style.css';
import * as CANNON from 'cannon-es';
import * as THREE from 'three';

import { bindInput } from './core/Input';
import { ACTIVE_CLUB } from './gameplay/clubs/Club';
import { computeLaunch, curveForce } from './gameplay/swing/launch';
import { SwingMeter, type SwingResult } from './gameplay/swing/SwingMeter';
import { Wind } from './gameplay/wind/Wind';
import {
  applyRollBrake,
  BALL_RADIUS,
  createBallBody,
  isBallAirborne,
  isBallNearlyStopped,
  resetBallToTee,
  syncBallMesh,
  TEE_POSITION,
} from './physics/ballBody';
import { createPhysicsWorld, PHYSICS_DT } from './physics/world';
import { ChaseCamera } from './render/camera/ChaseCamera';
import { SwingMeterView } from './ui/hud/SwingMeterView';

/**
 * Engine spike controls:
 *   A / D or Left / Right — aim (address only)
 *   Space or click — 3-click swing (start, power, strike)
 *   R — reset ball to the tee
 *
 * TODO: holes 2–3, lie, putting, scorecard, club switching.
 */

const PIN = new THREE.Vector3(0, 0, -14);
const AIM_RATE = 1.05;
const MAX_AIM = Math.PI / 3;

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app root missing');

app.innerHTML = `
  <canvas id="game-canvas"></canvas>
  <div id="hud">
    <div id="hud-top">
      <div id="hud-copy">
        <div id="hud-title">Arcade Golf V0 — Hole 1</div>
        <div id="hud-meta">Par 4 · 20m · Stroke 1 · Driver</div>
        <div id="hud-aim">Aim straight</div>
      </div>
      <div id="wind-indicator" aria-label="Wind">
        <div id="wind-arrow"></div>
        <div id="wind-label">Wind</div>
      </div>
    </div>
    <div id="shot-callout"></div>
    <div id="hud-bottom" data-phase="idle">
      <div id="swing-label">Driver swing</div>
      <div id="power-meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Power">
        <div id="power-fill"></div>
        <div id="power-needle"></div>
      </div>
      <div id="strike-zone" aria-label="Strike zone">
        <div class="zone duff"></div>
        <div class="zone miss"></div>
        <div class="zone nice"></div>
        <div class="zone miss"></div>
        <div class="zone duff"></div>
        <div id="strike-needle"></div>
      </div>
      <div id="zone-caption">
        <span>Duff</span><span>Hook</span><span>Nice</span><span>Slice</span><span>Duff</span>
      </div>
      <div id="swing-hint">Aim, then start the swing</div>
      <div id="controls-hint">A/D or ←/→ aim · Space or click ×3 · R reset tee</div>
    </div>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
if (!canvas) throw new Error('#game-canvas missing');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 48, 130);

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  250,
);
camera.position.set(0, 6.6, 17.5);
camera.lookAt(0, 0.4, 0);

scene.add(new THREE.HemisphereLight(0xb1e1ff, 0x3d6b2f, 0.55));

const sun = new THREE.DirectionalLight(0xfff2cc, 1.15);
sun.position.set(18, 28, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 80;
sun.shadow.camera.left = -30;
sun.shadow.camera.right = 30;
sun.shadow.camera.top = 30;
sun.shadow.camera.bottom = -30;
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
  new THREE.PlaneGeometry(7, 36),
  new THREE.MeshStandardMaterial({
    color: 0x4caf50,
    roughness: 0.95,
    metalness: 0,
  }),
);
stripe.rotation.x = -Math.PI / 2;
stripe.position.set(0, 0.01, -4);
stripe.receiveShadow = true;
scene.add(stripe);

addPin(scene, PIN);

const tee = new THREE.Mesh(
  new THREE.BoxGeometry(0.7, 0.04, 0.7),
  new THREE.MeshStandardMaterial({ color: 0xd4a017, roughness: 0.8 }),
);
tee.position.set(0, 0.02, TEE_POSITION.z + 0.35);
tee.receiveShadow = true;
scene.add(tee);

const ballMesh = new THREE.Mesh(
  new THREE.SphereGeometry(BALL_RADIUS, 24, 24),
  new THREE.MeshStandardMaterial({
    color: 0xf8f8f8,
    roughness: 0.35,
    metalness: 0.05,
  }),
);
ballMesh.castShadow = true;
ballMesh.position.set(TEE_POSITION.x, TEE_POSITION.y, TEE_POSITION.z);
scene.add(ballMesh);

const aimArrow = new THREE.ArrowHelper(
  new THREE.Vector3(0, 0, -1),
  new THREE.Vector3(TEE_POSITION.x, 0.08, TEE_POSITION.z),
  4.5,
  0xffe28a,
  1.05,
  0.42,
);
scene.add(aimArrow);

const { world, ballMaterial } = createPhysicsWorld();
const ballBody = createBallBody(world, ballMaterial);
const wind = new Wind();
const swing = new SwingMeter();
const hud = new SwingMeterView(document);
const chase = new ChaseCamera();

mountWind(wind);

const impulse = new CANNON.Vec3();
const curveVec = new CANNON.Vec3();
const aimDir = new THREE.Vector3(0, 0, -1);
const ballPos = new THREE.Vector3();
const ballVel = new THREE.Vector3();

let aimYaw = 0;
let strokes = 1;
let shotSpin = 0;
let atTee = true;
let flightTime = 0;
let stillTime = 0;
let calloutText = '';
let calloutQuality = '';
let calloutUntil = 0;
let accumulator = 0;

const input = bindInput({
  onSwing: () => {
    const result = swing.press();
    if (result) launchShot(result);
  },
  onReset: () => resetTee(),
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function launchShot(result: SwingResult): void {
  const launch = computeLaunch({
    power: result.power,
    accuracy: result.accuracy,
    aimYaw,
    club: ACTIVE_CLUB,
  });

  ballBody.velocity.set(0, 0, 0);
  ballBody.angularVelocity.set(0, 0, 0);
  ballBody.wakeUp();
  impulse.set(
    launch.vx * ballBody.mass,
    launch.vy * ballBody.mass,
    launch.vz * ballBody.mass,
  );
  ballBody.applyImpulse(impulse);
  ballBody.angularVelocity.set(
    launch.vz * 0.45,
    launch.spin * 8,
    -launch.vx * 0.45,
  );

  shotSpin = launch.spin;
  atTee = false;
  flightTime = 0;
  stillTime = 0;
  calloutText = launch.label;
  calloutQuality = launch.quality;
  calloutUntil = clock.elapsedTime + 1.7;
}

function resetTee(): void {
  resetBallToTee(ballBody);
  syncBallMesh(ballMesh, ballBody);
  aimYaw = 0;
  strokes = 1;
  shotSpin = 0;
  atTee = true;
  flightTime = 0;
  stillTime = 0;
  calloutText = '';
  calloutQuality = '';
  swing.reset();
}

function settleShot(): void {
  ballBody.velocity.set(0, 0, 0);
  ballBody.angularVelocity.set(0, 0, 0);
  shotSpin = 0;
  swing.markSettled();
  strokes += 1;
}

function animate(): void {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (swing.phase === 'idle' || swing.phase === 'settled') {
    aimYaw += input.aim() * AIM_RATE * dt;
    aimYaw = Math.min(MAX_AIM, Math.max(-MAX_AIM, aimYaw));
  }
  aimDir.set(Math.sin(aimYaw), 0, -Math.cos(aimYaw));

  swing.update(dt);

  accumulator = Math.min(accumulator + dt, 0.1);
  while (accumulator >= PHYSICS_DT) {
    if (isBallAirborne(ballBody)) {
      wind.applyTo(ballBody);
      const side = curveForce(ballBody.velocity.x, ballBody.velocity.z, shotSpin);
      if (side) {
        curveVec.set(side.x, 0, side.z);
        ballBody.applyForce(curveVec);
      }
    } else if (swing.phase === 'flight') {
      applyRollBrake(ballBody);
    }
    world.step(PHYSICS_DT);
    accumulator -= PHYSICS_DT;
  }

  syncBallMesh(ballMesh, ballBody);
  if (atTee && swing.phase === 'idle') {
    ballMesh.position.y += Math.sin(clock.elapsedTime * 2.5) * 0.018;
  }

  if (swing.phase === 'flight') {
    flightTime += dt;
    if (flightTime > 0.35 && isBallNearlyStopped(ballBody)) {
      stillTime += dt;
      if (stillTime > 0.2) settleShot();
    } else {
      stillTime = 0;
    }
  }

  if (calloutText && clock.elapsedTime > calloutUntil) {
    calloutText = '';
    calloutQuality = '';
  }

  ballPos.copy(ballMesh.position);
  ballVel.set(ballBody.velocity.x, ballBody.velocity.y, ballBody.velocity.z);
  chase.update(camera, ballPos, ballVel, aimDir, dt);

  const addressing = swing.phase !== 'flight';
  aimArrow.visible = addressing;
  if (addressing) {
    aimArrow.position.set(ballMesh.position.x, 0.08, ballMesh.position.z);
    aimArrow.setDirection(aimDir);
  }

  hud.render({
    phase: swing.phase,
    power: swing.shownPower(),
    accuracy: swing.shownAccuracy(),
    hint: swing.hint(),
    aimText: formatAim(aimYaw),
    metaText: `Par 4 · 20m · Stroke ${strokes} · ${ACTIVE_CLUB.label}`,
    callout: calloutText,
    calloutQuality,
  });

  renderer.render(scene, camera);
}

animate();

function formatAim(yaw: number): string {
  const deg = Math.round((yaw * 180) / Math.PI);
  if (Math.abs(deg) < 1) return 'Aim straight';
  return deg < 0 ? `Aim L ${-deg}°` : `Aim R ${deg}°`;
}

function mountWind(next: Wind): void {
  const arrow = document.querySelector<HTMLElement>('#wind-arrow');
  const label = document.querySelector<HTMLElement>('#wind-label');
  const wrap = document.querySelector<HTMLElement>('#wind-indicator');
  if (!arrow || !label || !wrap) throw new Error('wind hud missing');
  arrow.style.transform = `rotate(${next.headingDeg().toFixed(1)}deg)`;
  label.textContent = next.label();
  wrap.setAttribute('aria-label', `Wind ${next.label()}, cross from the left`);
}

/** Visual pin only — no cup collision or putting. */
function addPin(target: THREE.Scene, position: THREE.Vector3): void {
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 2.1, 8),
    new THREE.MeshStandardMaterial({ color: 0xf7f7f7, roughness: 0.45 }),
  );
  pole.position.set(position.x, 1.05, position.z);
  pole.castShadow = true;

  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.72, 0.42),
    new THREE.MeshStandardMaterial({
      color: 0xe74c3c,
      roughness: 0.55,
      side: THREE.DoubleSide,
    }),
  );
  flag.position.set(position.x + 0.38, 1.88, position.z);
  flag.castShadow = true;

  const cup = new THREE.Mesh(
    new THREE.CircleGeometry(0.32, 20),
    new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 1 }),
  );
  cup.rotation.x = -Math.PI / 2;
  cup.position.set(position.x, 0.025, position.z);

  target.add(pole, flag, cup);
}
