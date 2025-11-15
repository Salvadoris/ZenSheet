import { Point } from './Point';
import { Rect } from './Rect';

export abstract class Shape {
  scaleX: number = 1;
  scaleY: number = 1;
  originX: number;
  originY: number;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;

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
  }

  abstract render(ctx: CanvasRenderingContext2D, canvasRect: Rect): void;

  move(dx: number, dy: number): void {
    this.originX += dx;
    this.originY += dy;
  }

  abstract path(canvasRect: Rect): Path2D;

  abstract pointInside(ctx: CanvasRenderingContext2D, x: number, y: number): boolean;

  resizeTop(dy: number) {
    this.originY += dy;
    this.height -= dy;
    this.scaleY = this.height / this.originalHeight;
  }

  resizeBottom(dy: number) {
    this.height += dy;
    this.scaleY = this.height / this.originalHeight;
  }

  resizeLeft(dx: number) {
    this.originX += dx;
    this.width -= dx;
    this.scaleX = this.width / this.originalWidth;
  }

  resizeRight(dx: number) {
    this.width += dx;
    this.scaleX = this.width / this.originalWidth;
  }
}
