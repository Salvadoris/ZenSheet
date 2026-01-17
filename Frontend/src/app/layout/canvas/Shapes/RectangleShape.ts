import { Rect } from '../Geometry';
import { RectangleShapeProperties } from '../ShapeProperties/RectangleShapeProperties';
import { ChangableSerializedShapeProperties } from '../ShapeProperties/ShapeProperties';
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
import { RectangleStyle } from '../ShapeStyles/RectangleStyle';
import { ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Shape } from './Shape';

export class RectangleShape extends Shape {
  declare protected _properties: Required<RectangleShapeProperties>;

  constructor(
    properties: RectangleShapeProperties,
    ctx: CanvasRenderingContext2D
  ) {
    super(properties, ctx);
  }

  override set properties(properties: Required<RectangleShapeProperties>) {
    this._properties = properties;
  }

  override get properties(): Required<RectangleShapeProperties> {
    return this._properties;
  }

  override get style(): RectangleStyle {
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
    this.ctx.save();
    const lineWidth = this.style[StyleName.LineWidth];
    const opacity = this.style[StyleName.Opacity].toString(16).padStart(2, '0');
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeStyle = this.style[StyleName.Color] + opacity;
    this.ctx.fillStyle = this.style[StyleName.BackgroundColor] + opacity;

    const outerOffsetX = this.horizontalInverted
      ? -lineWidth / 2
      : lineWidth / 2;
    const outerOffsetY = this.verticallyInverted
      ? -lineWidth / 2
      : lineWidth / 2;
    const innerOffsetX = this.horizontalInverted ? -lineWidth : lineWidth;
    const innerOffsetY = this.verticallyInverted ? -lineWidth : lineWidth;

    this.ctx.fillRect(
      this.originX + innerOffsetX,
      this.originY + innerOffsetY,
      this.width - innerOffsetX * 2,
      this.height - innerOffsetY * 2
    );

    const path = new Path2D();
    path.moveTo(this.originX + outerOffsetX, this.originY + outerOffsetY);
    path.lineTo(
      this.originX + this.width - outerOffsetX,
      this.originY + outerOffsetY
    );
    path.lineTo(
      this.originX + this.width - outerOffsetX,
      this.originY + this.height - outerOffsetY
    );
    path.lineTo(
      this.originX + outerOffsetX,
      this.originY + this.height - outerOffsetY
    );
    path.closePath();
    this.ctx.stroke(path);

    this.ctx.restore();
  }

  override path(): Path2D {
    const path = new Path2D();
    path.rect(this.originX, this.originY, this.width, this.height);
    return path;
  }

  filledPath() {
    const path = new Path2D();
    const lineWidth = this.style[StyleName.LineWidth];
    path.rect(
      this.horizontalInverted
        ? this.originX - lineWidth
        : this.originX + lineWidth,
      this.verticallyInverted
        ? this.originY - lineWidth
        : this.originY + lineWidth,
      this.horizontalInverted
        ? this.width + lineWidth * 2
        : this.width - lineWidth * 2,
      this.verticallyInverted
        ? this.height + lineWidth * 2
        : this.height - lineWidth * 2
    );
    return path;
  }

  override pointInside(x: number, y: number): boolean {
    this.ctx.lineWidth = this.style[StyleName.LineWidth];
    return this.ctx.isPointInPath(this.path(), x, y);
  }

  override resizeContent(): ChangableSerializedShapeProperties {
    return {};
  }
}
