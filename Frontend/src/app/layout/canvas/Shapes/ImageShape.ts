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

  constructor(properties: ImageShapeProperties, ctx: CanvasRenderingContext2D) {
    super(properties, ctx);
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

  override renderShape(canvasRect: Rect): void {
    if (this.loaded) {
      this.renderImage();
    } else {
      this.img.onload = () => {
        this.loaded = true;
        this.renderImage();
      };
    }
  }

  private renderImage() {
    this.ctx.save();
    this.ctx.translate(this.originX, this.originY);
    this.ctx.scale(this.scaleX, this.scaleY);
    this.ctx.globalAlpha = this.style[StyleName.Opacity] / 255;
    this.ctx.drawImage(this.img, 0, 0, this.originalWidth, this.originalHeight);
    this.ctx.restore();
  }

  override path(): Path2D {
    const path = new Path2D();
    path.rect(0, 0, this.width, this.height);
    return path;
  }

  override pointInside(x: number, y: number): boolean {
    this.ctx.save();
    this.ctx.translate(this.originX, this.originY);
    this.ctx.scale(this.scaleX, this.scaleY);
    const inside = this.ctx.isPointInPath(this.path(), x, y);
    this.ctx.restore();
    return inside;
  }

  override resizeContent(): ChangableSerializedShapeProperties {
    return {};
  }
}
