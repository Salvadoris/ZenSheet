import { Point, Rect } from '../Geometry';
import { FilledRectShapeProperties } from '../ShapeProperties/FilledRectShapeProperties';
import { ChangableSerializedShapeProperties } from '../ShapeProperties/ShapeProperties';
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
import { FilledRectStyle } from '../ShapeStyles/FilledRectStyle';
import { ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Shape } from './Shape';

export class FilledRectShape extends Shape {
  declare protected _properties: Required<FilledRectShapeProperties>;

  constructor(
    properties: FilledRectShapeProperties,
    ctx: CanvasRenderingContext2D
  ) {
    super(properties, ctx);
  }

  override set properties(properties: Required<FilledRectShapeProperties>) {
    this._properties = properties;
  }

  override get properties(): Required<FilledRectShapeProperties> {
    return this._properties;
  }

  override get style(): FilledRectStyle {
    return this.properties[ShapePropertyName.style];
  }

  override setStyleProperty(
    styleProperty: ShapeStyleProperty
  ): ChangableSerializedShapeProperties {
    const updated = this.style.updateProperty(styleProperty);
    if (updated) {
      return {
        [ShapePropertyName.style]: {
          [styleProperty.name]: styleProperty.value,
        },
      };
    }
    return {};
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

  override resizeContent(): ChangableSerializedShapeProperties {
    return {};
  }
}
