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

    const path = this.path();
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

  override offsetPath(): Path2D {
    const path = new Path2D();
    const rect = this.offsetRect();
    path.ellipse(
      (rect[0] + rect[2]) / 2,
      (rect[1] + rect[3]) / 2,
      Math.abs(rect[0] - rect[2]) / 2,
      Math.abs(rect[1] - rect[3]) / 2,
      0,
      0,
      2 * Math.PI
    );
    return path;
  }

  override offset(): number {
    return this.style[StyleName.Color] === 'transparent'
      ? 0
      : this.style[StyleName.LineWidth] / 2;
  }

  override offsetRect(): Rect {
    const trueRect = this.trueRect();
    const offset = this.offset();
    return [
      trueRect[0] - offset,
      trueRect[1] - offset,
      trueRect[2] + offset,
      trueRect[3] + offset,
    ];
  }

  override pointInside(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ): boolean {
    ctx.lineWidth = this.style[StyleName.LineWidth];
    const backgroundTransparent =
      this.style[StyleName.BackgroundColor] === 'transparent';
    const borderTransparent = this.style[StyleName.Color] === 'transparent';
    if (backgroundTransparent && !borderTransparent) {
      return ctx.isPointInStroke(this.path(), x, y);
    } else if (borderTransparent && !backgroundTransparent) {
      return ctx.isPointInPath(this.path(), x, y);
    } else {
      return ctx.isPointInPath(this.offsetPath(), x, y);
    }
  }

  override resizeContent(): ChangableSerializedShapeProperties {
    return {};
  }
}
