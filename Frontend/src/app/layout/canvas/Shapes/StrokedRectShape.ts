import { Point, Rect } from '../Geometry';
import { ShapeStyle, ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';
import { StrokedRectStyle } from '../ShapeStyles/StrokedRectStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Shape } from './Shape';

export class StrokedRectShape extends Shape {
  declare style: StrokedRectStyle;

  constructor(p0: Point, p1: Point, style: StrokedRectStyle) {
    super(p0, p1[0] - p0[0], p1[1] - p0[1], style);
  }

  override setStyleProperty(styleProperty: ShapeStyleProperty): void {
    this.style.updateProperty(styleProperty);
  }

  override renderShape(ctx: CanvasRenderingContext2D, canvasRect: Rect): void {
    ctx.lineWidth = this.style[StyleName.LineWidth];
    ctx.lineCap = this.style[StyleName.LineCap];
    ctx.strokeStyle =
      this.style[StyleName.Color] +
      this.style[StyleName.Opacity].toString(16).padStart(2, '0');
    ctx.stroke(this.path());
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

  override pointInside(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ): boolean {
    ctx.lineWidth = this.style[StyleName.LineWidth];
    ctx.lineCap = this.style[StyleName.LineCap];
    return ctx.isPointInStroke(this.path(), x, y);
  }
}
