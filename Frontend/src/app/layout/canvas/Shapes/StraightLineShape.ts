import { Rect } from '../Geometry';
import { ChangableSerializedShapeProperties } from '../ShapeProperties/ShapeProperties';
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
import { StraightLineShapeProperties } from '../ShapeProperties/StraightLineShapeProperties';
import { ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';
import { StraightLineStyle } from '../ShapeStyles/StraightLineStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Shape } from './Shape';

export class StraightLineShape extends Shape {
  declare protected _properties: Required<StraightLineShapeProperties>;

  constructor(
    properties: StraightLineShapeProperties,
    ctx: CanvasRenderingContext2D
  ) {
    super(properties, ctx);
  }

  override set properties(properties: Required<StraightLineShapeProperties>) {
    this._properties = properties;
  }

  override get properties(): Required<StraightLineShapeProperties> {
    return this._properties;
  }

  override get style(): StraightLineStyle {
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

  override renderShape(_canvasRect: Rect): void {
    this.ctx.lineWidth = this.style[StyleName.LineWidth];
    this.ctx.lineCap = this.style[StyleName.LineCap];
    if (this.style[StyleName.Color].length === 9) {
      this.ctx.strokeStyle = this.style[StyleName.Color];
    } else {
      this.ctx.strokeStyle =
        this.style[StyleName.Color] +
        this.style[StyleName.Opacity].toString(16).padStart(2, '0');
    }
    this.ctx.stroke(this.path());
  }

  override path(): Path2D {
    const path = new Path2D();
    const lineWidth = this.style[StyleName.LineWidth];
    const x = this.horizontalInverted
      ? this.originX - lineWidth / 2
      : this.originX + lineWidth / 2;
    const y = this.verticallyInverted
      ? this.originY - lineWidth / 2
      : this.originY + lineWidth / 2;
    const width = this.horizontalInverted
      ? this.width + lineWidth
      : this.width - lineWidth;
    const height = this.verticallyInverted
      ? this.height + lineWidth
      : this.height - lineWidth;
    path.moveTo(x, y);
    path.lineTo(x + width, y + height);
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
