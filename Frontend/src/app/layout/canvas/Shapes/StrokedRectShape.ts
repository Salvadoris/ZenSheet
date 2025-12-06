import { Point, Rect } from '../Geometry';
import { ShapeStyle, ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';
import { StrokedRectStyle } from '../ShapeStyles/StrokedRectStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Shape } from './Shape';

export class StrokedRectShape extends Shape {
  declare style: StrokedRectStyle;

  constructor(
    p0: Point,
    p1: Point,
    style: StrokedRectStyle,
    ctx: CanvasRenderingContext2D
  ) {
    super(p0, p1[0] - p0[0], p1[1] - p0[1], style, ctx);
  }

  override setStyleProperty(styleProperty: ShapeStyleProperty): void {
    this.style.updateProperty(styleProperty);
  }

  override renderShape(canvasRect: Rect): void {
    this.ctx.lineWidth = this.style[StyleName.LineWidth];
    this.ctx.lineCap = this.style[StyleName.LineCap];
    this.ctx.strokeStyle =
      this.style[StyleName.Color] +
      this.style[StyleName.Opacity].toString(16).padStart(2, '0');
    this.ctx.stroke(this.path());
  }

  override path(): Path2D {
    const path = new Path2D();
    const lineWidth = this.style[StyleName.LineWidth];
    path.rect(
      this.horizontalInverted
        ? this.originX - lineWidth / 2
        : this.originX + lineWidth / 2,
      this.verticallyInverted
        ? this.originY - lineWidth / 2
        : this.originY + lineWidth / 2,
      this.horizontalInverted ? this.width + lineWidth : this.width - lineWidth,
      this.verticallyInverted
        ? this.height + lineWidth
        : this.height - lineWidth
    );
    return path;
  }

  override pointInside(x: number, y: number): boolean {
    this.ctx.lineWidth = this.style[StyleName.LineWidth];
    this.ctx.lineCap = this.style[StyleName.LineCap];
    return this.ctx.isPointInStroke(this.path(), x, y);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override resizeContent(): void {}
}
