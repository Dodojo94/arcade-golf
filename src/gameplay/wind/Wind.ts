import * as CANNON from 'cannon-es';

/**
 * Constant wind stub — small force while the ball is airborne.
 * +X = right-to-left from tee aiming -Z; tweak freely for later holes.
 */
export class Wind {
  readonly vector = new CANNON.Vec3(0.35, 0, 0.1);
  /** Force scale applied to the ball body while airborne. */
  readonly forceScale = 0.018;

  /** Human-readable HUD string, e.g. "Wind E 8 mph". */
  describe(): string {
    const speed = this.vector.length();
    const mph = Math.round(speed * 18); // arcade convert
    // Dominant horizontal heading in XZ
    const angle = Math.atan2(this.vector.x, -this.vector.z); // 0 = toward pin (-Z)
    const deg = ((angle * 180) / Math.PI + 360) % 360;
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const idx = Math.round(deg / 45) % 8;
    return `Wind ${dirs[idx]} ${mph} mph`;
  }

  applyTo(body: CANNON.Body): void {
    body.applyForce(
      new CANNON.Vec3(
        this.vector.x * this.forceScale,
        this.vector.y * this.forceScale,
        this.vector.z * this.forceScale,
      ),
      body.position,
    );
  }
}
