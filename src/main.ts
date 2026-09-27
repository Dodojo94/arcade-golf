import './style.css';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * Physics: cannon-es is a dependency for V0.
 * TODO: create a CANNON.World, add a ball Body + ground Plane,
 * step the world each frame, and sync mesh.position from body.position.
 * (Rapier via @dimforge/rapier3d-compat is an acceptable alternate.)
 */
void CANNON;

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('#app root missing');
}

app.innerHTML = `
  <canvas id="game-canvas"></canvas>
  <div id="hud" aria-hidden="false">
    <div id="hud-top">
      <div id="hud-title">Arcade Golf V0 — Hole 1</div>
      <div id="hud-meta">Stroke play · Par 4 · Stroke 1</div>
    </div>
    <div id="hud-bottom">
      <div id="swing-label">Swing meter (3-click stub)</div>
      <div id="swing-meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="28">
        <div id="swing-meter-fill"></div>
      </div>
      <div id="swing-hint">Click 1: start · Click 2: power · Click 3: accuracy — wiring TBD</div>
    </div>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
if (!canvas) {
  throw new Error('#game-canvas missing');
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 40, 120);

// Fixed chase-camera stub (orbit later if needed)
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

// Fairway ground plane
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

// Subtle fairway stripe for readable ground
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

// Golf ball
const ball = new THREE.Mesh(
  new THREE.SphereGeometry(0.18, 24, 24),
  new THREE.MeshStandardMaterial({
    color: 0xf8f8f8,
    roughness: 0.35,
    metalness: 0.05,
  }),
);
ball.position.set(0, 0.18, 6);
ball.castShadow = true;
scene.add(ball);

// Tee marker stub
const tee = new THREE.Mesh(
  new THREE.BoxGeometry(0.6, 0.05, 0.6),
  new THREE.MeshStandardMaterial({ color: 0xd4a017 }),
);
tee.position.set(0, 0.03, 6.4);
tee.receiveShadow = true;
scene.add(tee);

const chaseOffset = new THREE.Vector3(0, 8, 12);
const lookAhead = new THREE.Vector3();
const desiredCam = new THREE.Vector3();

function onResize(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', onResize);

const clock = new THREE.Clock();

function animate(): void {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // Gentle idle bob so the scene feels alive before physics lands
  ball.position.y = 0.18 + Math.sin(t * 2) * 0.02;

  // Chase-camera stub: hold a fixed offset behind the ball
  desiredCam.copy(ball.position).add(chaseOffset);
  camera.position.lerp(desiredCam, 0.05);
  lookAhead.set(ball.position.x, ball.position.y, ball.position.z - 4);
  camera.lookAt(lookAhead);

  renderer.render(scene, camera);
}

animate();
