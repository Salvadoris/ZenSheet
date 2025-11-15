import { Drawing } from './Drawing';
import { FilledRectShape } from './FilledRectShape';
import { Point } from './Point';
import { Shape } from './Shape';

export class FilledRectDrawing implements Drawing {
  constructor(public p0: Point, public p1: Point, public color: string) {}
  path(): Path2D {
    let path = new Path2D();
    path.rect(this.p0[0], this.p0[1], this.p1[0] - this.p0[0], this.p1[1] - this.p0[1]);
    return path;
  }

  toShape(): Shape {
    return new FilledRectShape(this.p0, this.p1, this.color);
  }

  update(p: Point): void {
    this.p1[0] = p[0];
    this.p1[1] = p[1];
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color;
    ctx.fill(this.path());
  }
}
