import { Point, Rect } from '../Geometry';
import { ImageStyle } from '../ShapeStyles/ImageStyle';
import { ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Shape } from './Shape';

export class ImageShape extends Shape {
  private img = new Image();
  private loaded = false;
  declare style: ImageStyle;

  constructor(
    src: string,
    p0: Point,
    p1: Point,
    style: ImageStyle,
    ctx: CanvasRenderingContext2D
  ) {
    super(p0, p1[0] - p0[0], p1[1] - p0[1], style, ctx);
    this.img.src = src;
  }

  override setStyleProperty(styleProperty: ShapeStyleProperty): void {
    this.style.updateProperty(styleProperty);
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
}
