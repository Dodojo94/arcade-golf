import './style.css';
import * as CANNON from 'cannon-es';
import * as THREE from 'three';

import { bindInput } from './core/Input';
import { createHoleView } from './course/createHoleView';
import { lieLabel, sampleLie, type LieKind } from './course/Hole';
import { HOLE_1 } from './course/holes/hole1';
import { applyLieDrag } from './course/surface';
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
 * Hole 1 blockout is loaded on boot. Swing meter is unchanged.
 *
 * TODO: holes 2–3, putting, scorecard, club switching, lie modifiers.
 */

const AIM_RATE = 1.05;
const MAX_AIM = Math.PI / 3;
const TEE = { x: HOLE_1.tee.x, y: BALL_RADIUS, z: HOLE_1.tee.z };

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app root missing');

app.innerHTML = `
  <canvas id="game-canvas"></canvas>
  <div id="hud">
    <div id="hud-top">
      <div id="hud-copy">
        <div id="hud-title">Arcade Golf V0 — Hole 1</div>
        <div id="hud-meta">Par 3 · 22m · Stroke 1 · Driver · Tee</div>
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

createHoleView(scene, HOLE_1);

const ballMesh = new THREE.Mesh(
  new THREE.SphereGeometry(BALL_RADIUS, 24, 24),
  new THREE.MeshStandardMaterial({
    color: 0xf8f8f8,
    roughness: 0.35,
    metalness: 0.05,
  }),
);
ballMesh.castShadow = true;
ballMesh.position.set(TEE.x, TEE.y, TEE.z);
scene.add(ballMesh);

const aimArrow = new THREE.ArrowHelper(
  new THREE.Vector3(0, 0, -1),
  new THREE.Vector3(TEE.x, 0.08, TEE.z),
  4.5,
  0xffe28a,
  1.05,
  0.42,
);
scene.add(aimArrow);

const { world, ballMaterial } = createPhysicsWorld();
const ballBody = createBallBody(world, ballMaterial, TEE);
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
/** Water and the cup end the hole until R. The green does not. */
let outcome: 'play' | 'hole' | 'water' = 'play';

const input = bindInput({
  onSwing: () => {
    if (outcome !== 'play') return;
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
  resetBallToTee(ballBody, TEE);
  syncBallMesh(ballMesh, ballBody);
  aimYaw = 0;
  strokes = 1;
  shotSpin = 0;
  atTee = true;
  flightTime = 0;
  stillTime = 0;
  outcome = 'play';
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
    applyLieDrag(ballBody, HOLE_1);
    world.step(PHYSICS_DT);
    accumulator -= PHYSICS_DT;
  }

  syncBallMesh(ballMesh, ballBody);
  if (atTee && swing.phase === 'idle') {
    ballMesh.position.y += Math.sin(clock.elapsedTime * 2.5) * 0.018;
  }

  const lie = readLie();

  if (swing.phase === 'flight') {
    flightTime += dt;
    const stopped = flightTime > 0.35 && isBallNearlyStopped(ballBody);
    const drowned = lie === 'water' && flightTime > 0.25;
    if (stopped || drowned) {
      stillTime += dt;
      if (stillTime > 0.2 || drowned) finishShot(lie);
    } else {
      stillTime = 0;
    }
  }

  if (outcome === 'hole') {
    ballBody.velocity.set(0, 0, 0);
    ballBody.angularVelocity.set(0, 0, 0);
    ballBody.position.x = HOLE_1.pin.x;
    ballBody.position.y = BALL_RADIUS;
    ballBody.position.z = HOLE_1.pin.z;
    ballMesh.position.set(HOLE_1.pin.x, 0.05, HOLE_1.pin.z);
  } else if (outcome === 'water') {
    ballBody.velocity.set(0, 0, 0);
    ballBody.angularVelocity.set(0, 0, 0);
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
    hint: hudHint(),
    aimText: formatAim(aimYaw),
    metaText: `Par ${HOLE_1.par} · ${HOLE_1.yardage}m · Stroke ${strokes} · ${ACTIVE_CLUB.label} · ${lieLabel(lie)}`,
    callout: calloutText,
    calloutQuality,
  });

  renderer.render(scene, camera);
}

animate();

function finishShot(lie: LieKind): void {
  if (swing.phase !== 'flight') return;
  settleShot();
  if (lie === 'hole') outcome = 'hole';
  else if (lie === 'water') outcome = 'water';
  calloutText = lie === 'hole' ? 'In the hole!' : lieLabel(lie);
  calloutQuality = lie;
  calloutUntil = clock.elapsedTime + 2.2;
}

function readLie(): LieKind {
  if (
    atTee &&
    (swing.phase === 'idle' || swing.phase === 'power' || swing.phase === 'accuracy')
  ) {
    return 'tee';
  }
  if (outcome === 'hole') return 'hole';
  if (outcome === 'water') return 'water';
  const speed = Math.hypot(ballBody.velocity.x, ballBody.velocity.z);
  return sampleLie(
    HOLE_1,
    ballBody.position.x,
    ballBody.position.y,
    ballBody.position.z,
    speed,
  );
}

function hudHint(): string {
  if (outcome === 'hole') return 'In the hole — press R to replay';
  if (outcome === 'water') return 'Water — press R to replay';
  return swing.hint();
}

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
