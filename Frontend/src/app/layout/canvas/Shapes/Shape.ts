import { Point, Rect } from '../Geometry';

export abstract class Shape {
  scaleX = 1;
  scaleY = 1;
  originX: number;
  originY: number;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
  minWidth = 1;
  minHeight = 1;
  horizontalInverted: boolean;
  verticallyInverted: boolean;

  constructor(origin: Point, width: number, height: number) {
    if (width == 0) {
      throw new Error('Shape width cannot be zero');
    }
    if (height == 0) {
      throw new Error('Shape height cannot be zero');
    }
    this.originX = origin[0];
    this.originY = origin[1];
    this.originalWidth = width;
    this.originalHeight = height;
    this.width = width;
    this.height = height;
    this.horizontalInverted = this.width < 0;
    this.verticallyInverted = this.height < 0;
  }

  render(ctx: CanvasRenderingContext2D, canvasRect: Rect): void {
    this.horizontalInverted = this.width < 0;
    this.verticallyInverted = this.height < 0;
    this.renderShape(ctx, canvasRect);
  }

  abstract renderShape(ctx: CanvasRenderingContext2D, canvasRect: Rect): void;

  move(dx: number, dy: number): void {
    this.originX += dx;
    this.originY += dy;
  }

  abstract path(): Path2D;

  abstract pointInside(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ): boolean;

  resizeTop(y: number) {
    const newHeight = this.originY + this.height - y;
    if (Math.abs(newHeight) >= this.minHeight) {
      this.height = newHeight;
      this.originY = y;
      this.scaleY = this.height / this.originalHeight;
    }
  }

  resizeBottom(y: number) {
    const newHeight = y - this.originY;
    if (Math.abs(newHeight) >= this.minHeight) {
      this.height = newHeight;
      this.scaleY = this.height / this.originalHeight;
    }
  }

  resizeLeft(x: number) {
    const newWidth = this.originX + this.width - x;
    if (Math.abs(newWidth) >= this.minWidth) {
      this.width = newWidth;
      this.originX = x;
      this.scaleX = this.width / this.originalWidth;
    }
  }

  resizeRight(x: number) {
    const newWidth = x - this.originX;
    if (Math.abs(newWidth) >= this.minWidth) {
      this.width = newWidth;
      this.scaleX = this.width / this.originalWidth;
    }
  }

  trueRect(): Rect {
    let minX = 0;
    let maxX = 0;
    if (this.horizontalInverted) {
      minX = this.originX + this.width;
      maxX = this.originX;
    } else {
      minX = this.originX;
      maxX = this.originX + this.width;
    }
    let minY = 0;
    let maxY = 0;
    if (this.verticallyInverted) {
      minY = this.originY + this.height;
      maxY = this.originY;
    } else {
      minY = this.originY;
      maxY = this.originY + this.height;
    }
    return [minX, minY, maxX, maxY];
  }
}
