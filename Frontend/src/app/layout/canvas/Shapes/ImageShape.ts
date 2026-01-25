import { Point, Rect } from '../Geometry';
import { ImageShapeProperties } from '../ShapeProperties/ImageShapeProperties';
import { ChangableSerializedShapeProperties } from '../ShapeProperties/ShapeProperties';
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
import { ImageStyle } from '../ShapeStyles/ImageStyle';
import { ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Shape } from './Shape';

export class ImageShape extends Shape {
  declare protected _properties: Required<ImageShapeProperties>;
  private img = new Image();
  private loaded = false;

  constructor(
    properties: ImageShapeProperties,
    bufferCtx: CanvasRenderingContext2D
  ) {
    super(properties, bufferCtx);
  }

  override set properties(properties: Required<ImageShapeProperties>) {
    this._properties = properties;
  }

  override get properties(): Required<ImageShapeProperties> {
    return this._properties;
  }

  override get style(): ImageStyle {
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
    if (this.loaded) {
      this.renderImage(canvasRect, ctx);
    } else {
      this.img.onload = () => {
        this.loaded = true;
        this.renderImage(canvasRect, ctx);
      };
    }
  }

  private renderImage(canvasRect: Rect, ctx: CanvasRenderingContext2D) {
    this.bufferCtx.save();
    this.bufferCtx.translate(this.originX, this.originY);
    this.bufferCtx.scale(this.scaleX, this.scaleY);
    this.bufferCtx.drawImage(
      this.img,
      0,
      0,
      this.originalWidth,
      this.originalHeight
    );
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
    path.rect(0, 0, this.width, this.height);
    return path;
  }

  override pointInside(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ): boolean {
    ctx.save();
    ctx.translate(this.originX, this.originY);
    ctx.scale(this.scaleX, this.scaleY);
    const inside = ctx.isPointInPath(this.path(), x, y);
    ctx.restore();
    return inside;
  }

  override resizeContent(): ChangableSerializedShapeProperties {
    return {};
  }
}
