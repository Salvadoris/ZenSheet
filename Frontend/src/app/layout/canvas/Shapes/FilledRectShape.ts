import { Point, Rect } from '../Geometry';
import { FilledRectShapeProperties } from '../ShapeProperties/FilledRectShapeProperties';
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
import { FilledRectStyle } from '../ShapeStyles/FilledRectStyle';
import { ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Shape } from './Shape';

export class FilledRectShape extends Shape {
  declare properties: Required<FilledRectShapeProperties>;

  constructor(
    properties: FilledRectShapeProperties,
    ctx: CanvasRenderingContext2D
  ) {
    super(properties, ctx);
  }

  override get style(): FilledRectStyle {
    return this.properties[ShapePropertyName.style];
  }

  override setStyleProperty(styleProperty: ShapeStyleProperty): void {
    this.style.updateProperty(styleProperty);
  }

  override renderShape(canvasRect: Rect): void {
    this.ctx.save();
    this.ctx.translate(this.originX, this.originY);
    this.ctx.scale(this.scaleX, this.scaleY);
    this.ctx.fillStyle =
      this.style[StyleName.Color] +
      this.style[StyleName.Opacity].toString(16).padStart(2, '0');
    this.ctx.fill(this.path());
    this.ctx.restore();
  }

  override path(): Path2D {
    const path = new Path2D();
    path.rect(0, 0, this.originalWidth, this.originalHeight);
    return path;
  }

  override pointInside(x: number, y: number): boolean {
    this.ctx.save();
    this.ctx.translate(this.originX, this.originY);
    this.ctx.scale(this.scaleX, this.scaleY);
    const inside = this.ctx.isPointInPath(this.path(), x, y);
    this.ctx.restore();
    return inside;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override resizeContent(): void {}
}
