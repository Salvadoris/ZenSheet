import { Rect } from '../Geometry';
import { EllipseShapeProperties } from '../ShapeProperties/EllipseShapeProperties';
import { ChangableSerializedShapeProperties } from '../ShapeProperties/ShapeProperties';
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
import { EllipseStyle } from '../ShapeStyles/EllipseStyle';
import { ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Shape } from './Shape';

export class EllipseShape extends Shape {
  declare protected _properties: Required<EllipseShapeProperties>;

  constructor(
    properties: EllipseShapeProperties,
    ctx: CanvasRenderingContext2D
  ) {
    super(properties, ctx);
  }

  override set properties(properties: Required<EllipseShapeProperties>) {
    this._properties = properties;
  }

  override get properties(): Required<EllipseShapeProperties> {
    return this._properties;
  }

  override get style(): EllipseStyle {
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

    if (this.style[StyleName.Color].length === 9) {
      this.ctx.strokeStyle = this.style[StyleName.Color];
    } else {
      this.ctx.strokeStyle = this.style[StyleName.Color] + opacity;
    }
    if (this.style[StyleName.BackgroundColor].length === 9) {
      this.ctx.fillStyle = this.style[StyleName.BackgroundColor];
    } else {
      this.ctx.fillStyle = this.style[StyleName.BackgroundColor] + opacity;
    }

    const centerX = this.originX + this.width / 2;
    const centerY = this.originY + this.height / 2;
    const radiusX = Math.abs(this.width) / 2;
    const radiusY = Math.abs(this.height) / 2;

    const fillpath = new Path2D();
    fillpath.ellipse(
      centerX,
      centerY,
      Math.abs(radiusX - lineWidth),
      Math.abs(radiusY - lineWidth),
      0,
      0,
      2 * Math.PI
    );
    this.ctx.fill(fillpath);

    const strokePath = new Path2D();
    strokePath.ellipse(
      centerX,
      centerY,
      Math.abs(radiusX - lineWidth / 2),
      Math.abs(radiusY - lineWidth / 2),
      0,
      0,
      2 * Math.PI
    );
    this.ctx.stroke(strokePath);

    this.ctx.restore();
  }

  override path(): Path2D {
    const path = new Path2D();
    path.ellipse(
      this.originX + this.width / 2,
      this.originY + this.height / 2,
      Math.abs(this.width) / 2,
      Math.abs(this.height) / 2,
      0,
      0,
      2 * Math.PI
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
