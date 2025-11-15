import { Drawing } from './Drawing';
import { Point } from './Point';
import { Shape } from './Shape';
import { StrokedRectShape } from './StrokedRectShape';

export class StrokedRectDrawing implements Drawing {
  constructor(
    public p0: Point,
    public p1: Point,
    public lineWidth: number,
    public cap: CanvasLineCap,
    public color: string
  ) {}

  path(): Path2D {
    let horizontalInverted = this.p1[0] < this.p0[0];
    let verticallyInverted = this.p1[1] < this.p0[1];
    let path = new Path2D();
    path.rect(
      horizontalInverted ? this.p0[0] - this.lineWidth / 2 : this.p0[0] + this.lineWidth / 2,
      verticallyInverted ? this.p0[1] - this.lineWidth / 2 : this.p0[1] + this.lineWidth / 2,
      horizontalInverted
        ? this.p1[0] - this.p0[0] + this.lineWidth
        : this.p1[0] - this.p0[0] - this.lineWidth,
      verticallyInverted
        ? this.p1[1] - this.p0[1] + this.lineWidth
        : this.p1[1] - this.p0[1] - this.lineWidth
    );
    return path;
  }

  toShape(): Shape {
    return new StrokedRectShape(this.p0, this.p1, this.lineWidth, this.cap, this.color);
  }

  update(p: Point): void {
    this.p1[0] = p[0];
    this.p1[1] = p[1];
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = this.cap;
    ctx.strokeStyle = this.color;
    ctx.stroke(this.path());
  }
}
