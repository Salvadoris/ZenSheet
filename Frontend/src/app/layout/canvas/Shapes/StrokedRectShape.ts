import { Point, Rect } from '../Geometry';
import { ChangableSerializedShapeProperties } from '../ShapeProperties/ShapeProperties';
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
import { StrokedRectShapeProperties } from '../ShapeProperties/StrokedRectShapeProperties';
import { ShapeStyle, ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';
import { StrokedRectStyle } from '../ShapeStyles/StrokedRectStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Shape } from './Shape';

export class StrokedRectShape extends Shape {
  declare protected _properties: Required<StrokedRectShapeProperties>;

  constructor(
    properties: StrokedRectShapeProperties,
    ctx: CanvasRenderingContext2D
  ) {
    super(properties, ctx);
  }

  override set properties(properties: Required<StrokedRectShapeProperties>) {
    this._properties = properties;
  }

  override get properties(): Required<StrokedRectShapeProperties> {
    return this._properties;
  }

  override get style(): StrokedRectStyle {
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

  override resizeContent(): ChangableSerializedShapeProperties {
    return {};
  }
}
