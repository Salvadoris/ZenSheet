import { Point, Rect } from '../Geometry';
import { StrokedRectStyle } from '../ShapeStyles/StrokedRectStyle';

import { Shape } from './Shape';

export class StrokedRectShape extends Shape {
  constructor(
    p0: Point,
    p1: Point,
    public style: StrokedRectStyle
  ) {
    super(p0, p1[0] - p0[0], p1[1] - p0[1]);
  }

  override renderShape(ctx: CanvasRenderingContext2D, canvasRect: Rect): void {
    ctx.lineWidth = this.style.lineWidth;
    ctx.lineCap = this.style.cap;
    ctx.strokeStyle = this.style.color;
    ctx.stroke(this.path());
  }

  override path(): Path2D {
    const path = new Path2D();
    path.rect(
      this.horizontalInverted
        ? this.originX - this.style.lineWidth / 2
        : this.originX + this.style.lineWidth / 2,
      this.verticallyInverted
        ? this.originY - this.style.lineWidth / 2
        : this.originY + this.style.lineWidth / 2,
      this.horizontalInverted
        ? this.width + this.style.lineWidth
        : this.width - this.style.lineWidth,
      this.verticallyInverted
        ? this.height + this.style.lineWidth
        : this.height - this.style.lineWidth
    );
    return path;
  }

  override pointInside(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ): boolean {
    ctx.lineWidth = this.style.lineWidth;
    ctx.lineCap = this.style.cap;
    return ctx.isPointInStroke(this.path(), x, y);
  }
}
