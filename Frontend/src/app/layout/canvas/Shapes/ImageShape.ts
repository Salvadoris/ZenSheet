import { Point, Rect } from '../Geometry';

import { Shape } from './Shape';

export class ImageShape extends Shape {
  private img = new Image();
  private loaded = false;

  constructor(src: string, p0: Point, p1: Point) {
    super(p0, p1[0] - p0[0], p1[1] - p0[1]);
    this.img.src = src;
  }

  override renderShape(ctx: CanvasRenderingContext2D, canvasRect: Rect): void {
    if (this.loaded) {
      this.drawImage(ctx);
    } else {
      this.img.onload = () => {
        this.loaded = true;
        this.drawImage(ctx);
      };
    }
  }

  private drawImage(ctx: CanvasRenderingContext2D) {
    ctx.drawImage(this.img, 0, 0, this.width, this.height);
  }

  override path(): Path2D {
    const path = new Path2D();
    path.rect(0, 0, this.width, this.height);
    return path;
  }

  override pointInsideShape(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ): boolean {
    return ctx.isPointInPath(this.path(), x, y);
  }
}
