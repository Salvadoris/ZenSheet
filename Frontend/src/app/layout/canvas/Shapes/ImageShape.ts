import { Point, Rect } from '../Geometry';
import { ImageStyle } from '../ShapeStyles/ImageStyle';
import { ShapeStyle, ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Shape } from './Shape';

export class ImageShape extends Shape {
  private img = new Image();
  private loaded = false;
  declare style: ImageStyle;

  constructor(src: string, p0: Point, p1: Point, style: ImageStyle) {
    super(p0, p1[0] - p0[0], p1[1] - p0[1], style);
    this.img.src = src;
  }

  override setStyleProperty(styleProperty: ShapeStyleProperty): void {
    this.style.updateProperty(styleProperty);
  }

  override renderShape(ctx: CanvasRenderingContext2D, canvasRect: Rect): void {
    if (this.loaded) {
      this.drawImage(ctx);
    } else {
      this.img.onload = () => {
        this.loaded = true;
        ctx.save();
        ctx.translate(this.originX, this.originY);
        ctx.scale(this.scaleX, this.scaleY);
        this.drawImage(ctx);
        ctx.restore();
      };
    }
  }

  private drawImage(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = this.style[StyleName.Opacity] / 255;
    ctx.drawImage(this.img, 0, 0, this.originalWidth, this.originalHeight);
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
}
