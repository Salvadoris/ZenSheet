import { Point, Rect } from '../Geometry';
import { FilledRectStyle } from '../ShapeStyles/FilledRectStyle';

import { Shape } from './Shape';

export class FilledRectShape extends Shape {
  constructor(
    p0: Point,
    p1: Point,
    public style: FilledRectStyle
  ) {
    super(p0, p1[0] - p0[0], p1[1] - p0[1]);
  }

  override renderShape(ctx: CanvasRenderingContext2D, canvasRect: Rect): void {
    ctx.save();
    ctx.translate(this.originX, this.originY);
    ctx.scale(this.scaleX, this.scaleY);
    ctx.fillStyle = this.style.color;
    ctx.fill(this.path());
    ctx.restore();
  }

  override path(): Path2D {
    const path = new Path2D();
    path.rect(0, 0, this.originalWidth, this.originalHeight);
    return path;
  }

  override pointInside(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ): boolean {
    ctx.save();
    ctx.translate(this.originX, this.originY);
    ctx.scale(this.scaleX, this.scaleY);
    const inside = ctx.isPointInPath(this.path(), x, y);
    ctx.restore();
    return inside;
  }
}
