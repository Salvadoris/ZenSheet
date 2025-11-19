import { Point, Rect } from '../Geometry';

import { Shape } from './Shape';

export class StrokedRectShape extends Shape {
  constructor(
    p0: Point,
    p1: Point,
    public lineWidth: number,
    public cap: CanvasLineCap,
    public color: string
  ) {
    super(p0, p1[0] - p0[0], p1[1] - p0[1]);
  }

  override renderShape(ctx: CanvasRenderingContext2D, canvasRect: Rect): void {
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = this.cap;
    ctx.strokeStyle = this.color;
    ctx.stroke(this.path());
  }

  override path(): Path2D {
    const horizontalInverted = this.width < 0;
    const verticallyInverted = this.height < 0;
    const path = new Path2D();
    path.rect(
      horizontalInverted ? -this.lineWidth / 2 : this.lineWidth / 2,
      verticallyInverted ? -this.lineWidth / 2 : this.lineWidth / 2,
      horizontalInverted
        ? this.originalWidth + this.lineWidth
        : this.originalWidth - this.lineWidth,
      verticallyInverted
        ? this.originalHeight + this.lineWidth
        : this.originalHeight - this.lineWidth
    );
    return path;
  }

  override pointInsideShape(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ): boolean {
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = this.cap;
    return ctx.isPointInStroke(this.path(), x, y);
  }
}
