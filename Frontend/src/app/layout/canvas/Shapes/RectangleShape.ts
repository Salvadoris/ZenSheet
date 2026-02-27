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
    bufferCtx: CanvasRenderingContext2D
  ) {
    super(properties, bufferCtx);
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
    path.rect(this.originX, this.originY, this.width, this.height);
    return path;
  }

  override offsetPath(): Path2D {
    const path = new Path2D();
    const rect = this.offsetRect();
    path.rect(rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1]);
    return path;
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

  override offset(): number {
    return this.style[StyleName.Color] === 'transparent'
      ? 0
      : this.style[StyleName.LineWidth] / 2;
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
