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

    const path = this.borderPath();
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

  private borderPath() {
    const offsetX = this.horizontalInverted
      ? -this.style[StyleName.LineWidth] / 2
      : this.style[StyleName.LineWidth] / 2;
    const offsetY = this.verticallyInverted
      ? -this.style[StyleName.LineWidth] / 2
      : this.style[StyleName.LineWidth] / 2;

    const path = new Path2D();
    path.rect(
      this.originX + offsetX,
      this.originY + offsetY,
      this.width - offsetX * 2,
      this.height - offsetY * 2
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
    if (backgroundTransparent && !borderTransparent) {
      return ctx.isPointInStroke(this.borderPath(), x, y);
    } else if (borderTransparent && !backgroundTransparent) {
      return ctx.isPointInPath(this.borderPath(), x, y);
    } else {
      return ctx.isPointInPath(this.path(), x, y);
    }
  }

  override resizeContent(): ChangableSerializedShapeProperties {
    return {};
  }
}
