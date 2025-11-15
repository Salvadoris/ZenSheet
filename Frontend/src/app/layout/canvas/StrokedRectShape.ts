import { Point } from './Point';
import { Rect } from './Rect';
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

  override render(ctx: CanvasRenderingContext2D): void {
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = this.cap;
    ctx.strokeStyle = this.color;
    ctx.stroke(this.path());
  }

  override path(): Path2D {
    let horizontalInverted = this.width < 0;
    let verticallyInverted = this.height < 0;
    let path = new Path2D();
    path.rect(
      horizontalInverted ? this.originX - this.lineWidth / 2 : this.originX + this.lineWidth / 2,
      verticallyInverted ? this.originY - this.lineWidth / 2 : this.originY + this.lineWidth / 2,
      horizontalInverted ? this.width + this.lineWidth : this.width - this.lineWidth,
      verticallyInverted ? this.height + this.lineWidth : this.height - this.lineWidth
    );
    return path;
  }

  override pointInside(ctx: CanvasRenderingContext2D, x: number, y: number): boolean {
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = this.cap;
    return ctx.isPointInStroke(this.path(), x, y);
  }
}
