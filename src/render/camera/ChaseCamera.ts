import * as THREE from 'three';

/**
 * Sits behind the ball. Uses horizontal velocity in flight and the
 * aim vector while addressing, so A/D orbit the camera with the shot.
 */
export class ChaseCamera {
  private readonly desired = new THREE.Vector3();
  private readonly look = new THREE.Vector3();
  private readonly travel = new THREE.Vector3();

  height = 6.4;
  distance = 11.5;
  lookAhead = 6;

  update(
    camera: THREE.PerspectiveCamera,
    ball: THREE.Vector3,
    velocity: THREE.Vector3,
    aim: THREE.Vector3,
    dt: number,
  ): void {
    this.travel.set(velocity.x, 0, velocity.z);
    if (this.travel.lengthSq() < 1.2) {
      this.travel.copy(aim);
      this.travel.y = 0;
    }
    if (this.travel.lengthSq() < 1e-6) {
      this.travel.set(0, 0, -1);
    } else {
      this.travel.normalize();
    }

    this.desired.copy(ball);
    this.desired.addScaledVector(this.travel, -this.distance);
    this.desired.y = ball.y + this.height;

    const k = 1 - Math.exp(-6 * Math.max(0, dt));
    camera.position.lerp(this.desired, k);

    this.look.copy(ball);
    this.look.addScaledVector(this.travel, this.lookAhead);
    this.look.y = Math.max(0.4, ball.y * 0.35);
    camera.lookAt(this.look);
  }
}
