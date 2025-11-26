import { Point } from '../Geometry';
import { Shape } from '../Shapes/Shape';
import { StrokedRectShape } from '../Shapes/StrokedRectShape';
import { StrokedRectStyle } from '../ShapeStyles/StrokedRectStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Drawing } from './Drawing';

export class StrokedRectDrawing implements Drawing {
  constructor(
    public p0: Point,
    public p1: Point,
    public style: StrokedRectStyle
  ) {}

  path(): Path2D {
    const horizontalInverted = this.p1[0] < this.p0[0];
    const verticallyInverted = this.p1[1] < this.p0[1];
    const path = new Path2D();
    const lineWidth = this.style[StyleName.LineWidth];
    path.rect(
      horizontalInverted
        ? this.p0[0] - lineWidth / 2
        : this.p0[0] + lineWidth / 2,
      verticallyInverted
        ? this.p0[1] - lineWidth / 2
        : this.p0[1] + lineWidth / 2,
      horizontalInverted
        ? this.p1[0] - this.p0[0] + lineWidth
        : this.p1[0] - this.p0[0] - lineWidth,
      verticallyInverted
        ? this.p1[1] - this.p0[1] + lineWidth
        : this.p1[1] - this.p0[1] - lineWidth
    );
    return path;
  }

  toShape(): Shape {
    return new StrokedRectShape(this.p0, this.p1, this.style);
  }

  update(p: Point): void {
    this.p1[0] = p[0];
    this.p1[1] = p[1];
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.lineWidth = this.style[StyleName.LineWidth];
    ctx.lineCap = this.style[StyleName.LineCap];
    ctx.strokeStyle =
      this.style[StyleName.Color] +
      this.style[StyleName.Opacity].toString(16).padStart(2, '0');
    ctx.stroke(this.path());
  }
}
