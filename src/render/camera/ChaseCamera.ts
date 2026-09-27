import * as THREE from 'three';

/**
 * Chase cam: sits behind the ball along travel (or fallback aim),
 * lerps toward the desired offset each frame.
 */
export class ChaseCamera {
  private readonly desired = new THREE.Vector3();
  private readonly lookAt = new THREE.Vector3();
  private readonly behind = new THREE.Vector3();
  private readonly travel = new THREE.Vector3();

  /** Height above ball. */
  height = 7;
  /** Distance behind ball along travel. */
  distance = 11;
  /** Look a bit ahead of the ball. */
  lookAhead = 4;
  /** Position lerp factor per frame (~60fps). */
  lerp = 0.08;

  update(
    camera: THREE.PerspectiveCamera,
    ballPos: THREE.Vector3,
    velocity: THREE.Vector3,
    fallbackAim: THREE.Vector3,
  ): void {
    this.travel.copy(velocity);
    this.travel.y = 0;
    if (this.travel.lengthSq() < 0.04) {
      this.travel.copy(fallbackAim);
      this.travel.y = 0;
    }
    if (this.travel.lengthSq() < 1e-6) {
      this.travel.set(0, 0, 1);
    } else {
      this.travel.normalize();
    }

    // Camera sits opposite travel (behind the ball)
    this.behind.copy(this.travel).multiplyScalar(-this.distance);
    this.behind.y = this.height;

    this.desired.copy(ballPos).add(this.behind);
    camera.position.lerp(this.desired, this.lerp);

    this.lookAt.copy(ballPos);
    this.lookAt.addScaledVector(this.travel, this.lookAhead);
    this.lookAt.y = Math.max(0.5, ballPos.y);
    camera.lookAt(this.lookAt);
  }
}
