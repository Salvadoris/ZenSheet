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
    bufferCtx: CanvasRenderingContext2D
  ) {
    super(properties, bufferCtx);
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

  override renderShape(canvasRect: Rect, ctx: CanvasRenderingContext2D): void {
    this.bufferCtx.save();
    this.bufferCtx.lineWidth = this.style[StyleName.LineWidth];
    this.bufferCtx.strokeStyle = this.style[StyleName.Color];
    this.bufferCtx.fillStyle = this.style[StyleName.BackgroundColor];

    const centerX = this.originX + this.width / 2;
    const centerY = this.originY + this.height / 2;
    const radiusX = Math.abs(this.width) / 2;
    const radiusY = Math.abs(this.height) / 2;
    const path = this.borderPath(centerX, centerY, radiusX, radiusY);
    this.bufferCtx.fill(path);
    this.bufferCtx.stroke(path);
    this.bufferCtx.restore();

    ctx.save();
    ctx.globalAlpha = this.style[StyleName.Opacity];
    ctx.drawImage(this.bufferCtx.canvas, 0, 0);
    ctx.restore();

    this.bufferCtx.clearRect(
      canvasRect[0],
      canvasRect[1],
      canvasRect[2] - canvasRect[0],
      canvasRect[3] - canvasRect[1]
    );
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

  override pointInside(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ): boolean {
    ctx.lineWidth = this.style[StyleName.LineWidth];
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
        return ctx.isPointInStroke(
          this.borderPath(centerX, centerY, radiusX, radiusY),
          x,
          y
        );
      } else {
        return ctx.isPointInPath(
          this.backgroundPath(centerX, centerY, radiusX, radiusY),
          x,
          y
        );
      }
    } else {
      return ctx.isPointInPath(this.path(), x, y);
    }
  }

  override resizeContent(): ChangableSerializedShapeProperties {
    return {};
  }
}
