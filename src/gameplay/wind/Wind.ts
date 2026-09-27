import * as CANNON from 'cannon-es';

const scratch = new CANNON.Vec3();

/**
 * Constant horizontal wind. +X is right of the downrange (-Z) line.
 * ~0.05 N on the 0.045 kg ball drifts a full driver about 2 m.
 */
export class Wind {
  readonly vector = new CANNON.Vec3(1, 0, 0.15);
  readonly newtons = 0.05;
  readonly mph = 8;

  private readonly dirX: number;
  private readonly dirZ: number;

  constructor() {
    const len = Math.hypot(this.vector.x, this.vector.z) || 1;
    this.dirX = this.vector.x / len;
    this.dirZ = this.vector.z / len;
  }

  /** Clockwise degrees from downrange, for the HUD arrow (0 = toward the pin). */
  headingDeg(): number {
    return (Math.atan2(this.dirX, -this.dirZ) * 180) / Math.PI;
  }

  label(): string {
    return `${this.mph} mph`;
  }

  applyTo(body: CANNON.Body): void {
    scratch.set(this.dirX * this.newtons, 0, this.dirZ * this.newtons);
    body.applyForce(scratch);
  }
}
