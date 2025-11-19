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
    const horizontalInverted = this.width < 0;
    const verticallyInverted = this.height < 0;
    const path = new Path2D();
    path.rect(
      horizontalInverted ? -this.style.lineWidth / 2 : this.style.lineWidth / 2,
      verticallyInverted ? -this.style.lineWidth / 2 : this.style.lineWidth / 2,
      horizontalInverted
        ? this.originalWidth + this.style.lineWidth
        : this.originalWidth - this.style.lineWidth,
      verticallyInverted
        ? this.originalHeight + this.style.lineWidth
        : this.originalHeight - this.style.lineWidth
    );
    return path;
  }

  override pointInsideShape(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ): boolean {
    ctx.lineWidth = this.style.lineWidth;
    ctx.lineCap = this.style.cap;
    return ctx.isPointInStroke(this.path(), x, y);
  }
}
