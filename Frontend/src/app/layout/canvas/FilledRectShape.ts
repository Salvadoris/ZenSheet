import { Point } from './Point';
import { Shape } from './Shape';

export class FilledRectShape extends Shape {
  constructor(p0: Point, p1: Point, public color: string) {
    super(p0, p1[0] - p0[0], p1[1] - p0[1]);
  }

  override render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color;
    ctx.fill(this.path());
  }

  override path(): Path2D {
    let path = new Path2D();
    path.rect(this.originX, this.originY, this.width, this.height);
    return path;
  }

  override pointInside(ctx: CanvasRenderingContext2D, x: number, y: number): boolean {
    return ctx.isPointInPath(this.path(), x, y);
  }
}
