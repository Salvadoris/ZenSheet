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
    bufferCtx: CanvasRenderingContext2D
  ) {
    super(properties, bufferCtx, true);
    this.properties[ShapePropertyName.minWidth] = 0;
    this.properties[ShapePropertyName.minHeight] = 0;
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

  override renderShape(canvasRect: Rect, ctx: CanvasRenderingContext2D): void {
    this.bufferCtx.save();
    this.bufferCtx.lineWidth = this.style[StyleName.LineWidth];
    this.bufferCtx.lineCap = this.style[StyleName.LineCap];
    this.bufferCtx.strokeStyle = this.style[StyleName.Color];
    this.bufferCtx.stroke(this.path());
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
    path.moveTo(this.originX, this.originY);
    path.lineTo(this.originX + this.width, this.originY + this.height);
    return path;
  }

  override offsetPath(): Path2D {
    return this.path();
  }

  override offset(): number {
    return this.style[StyleName.LineWidth] / 2;
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
    ctx.lineCap = this.style[StyleName.LineCap];
    return ctx.isPointInStroke(this.path(), x, y);
  }

  override resizeContent(): ChangableSerializedShapeProperties {
    return {};
  }
}
