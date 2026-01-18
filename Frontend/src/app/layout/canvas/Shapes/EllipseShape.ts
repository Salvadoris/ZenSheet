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

    this.ctx.fill(this.backgroundPath(centerX, centerY, radiusX, radiusY));
    this.ctx.stroke(this.borderPath(centerX, centerY, radiusX, radiusY));

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

  borderPath(
    centerX: number,
    centerY: number,
    radiusX: number,
    radiusY: number
  ) {
    const path = new Path2D();
    path.ellipse(
      centerX,
      centerY,
      Math.abs(radiusX - this.style[StyleName.LineWidth] / 2),
      Math.abs(radiusY - this.style[StyleName.LineWidth] / 2),
      0,
      0,
      2 * Math.PI
    );
    return path;
  }

  backgroundPath(
    centerX: number,
    centerY: number,
    radiusX: number,
    radiusY: number
  ) {
    const path = new Path2D();
    path.ellipse(
      centerX,
      centerY,
      Math.abs(radiusX - this.style[StyleName.LineWidth]),
      Math.abs(radiusY - this.style[StyleName.LineWidth]),
      0,
      0,
      2 * Math.PI
    );
    return path;
  }

  override pointInside(x: number, y: number): boolean {
    this.ctx.lineWidth = this.style[StyleName.LineWidth];
    const backgroundTransparent =
      this.style[StyleName.BackgroundColor].length === 9 &&
      this.style[StyleName.BackgroundColor][7] === '0' &&
      this.style[StyleName.BackgroundColor][8] === '0';
    const borderTransparent =
      this.style[StyleName.Color].length === 9 &&
      this.style[StyleName.Color][7] === '0' &&
      this.style[StyleName.Color][8] === '0';
    if (backgroundTransparent !== borderTransparent) {
      const centerX = this.originX + this.width / 2;
      const centerY = this.originY + this.height / 2;
      const radiusX = Math.abs(this.width) / 2;
      const radiusY = Math.abs(this.height) / 2;
      if (backgroundTransparent) {
        return this.ctx.isPointInStroke(
          this.borderPath(centerX, centerY, radiusX, radiusY),
          x,
          y
        );
      } else {
        return this.ctx.isPointInPath(
          this.backgroundPath(centerX, centerY, radiusX, radiusY),
          x,
          y
        );
      }
    } else {
      return this.ctx.isPointInPath(this.path(), x, y);
    }
  }

  override resizeContent(): ChangableSerializedShapeProperties {
    return {};
  }
}
