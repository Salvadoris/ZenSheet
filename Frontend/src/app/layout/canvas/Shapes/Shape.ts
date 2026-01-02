import { Point, Rect } from '../Geometry';
import {
  NullableShapeStyle,
  ShapeStyleProperty,
} from '../ShapeStyles/ShapeStyle';

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
  invertable = true;
  horizontalInverted: boolean;
  verticallyInverted: boolean;
  style: NullableShapeStyle;
  ctx: CanvasRenderingContext2D;

  constructor(
    origin: Point,
    width: number,
    height: number,
    style: NullableShapeStyle,
    ctx: CanvasRenderingContext2D
  ) {
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
    this.style = style;
    this.ctx = ctx;
  }

  render(canvasRect: Rect): void {
    this.horizontalInverted = this.width < 0;
    this.verticallyInverted = this.height < 0;
    this.renderShape(canvasRect);
  }

  abstract renderShape(canvasRect: Rect): void;

  abstract path(): Path2D;

  abstract setStyleProperty(styleProperty: ShapeStyleProperty): void;

  abstract pointInside(x: number, y: number): boolean;

  resizeTop(y: number, resizeContent = true) {
    let newHeight = this.originY + this.height - y;
    if (
      !this.invertable &&
      this.height > this.minHeight &&
      newHeight < this.minHeight
    ) {
      newHeight = this.minHeight;
      y = this.originY + this.height - newHeight;
    }
    if (
      (!this.invertable && newHeight >= this.minHeight) ||
      (this.invertable && Math.abs(newHeight) >= this.minHeight)
    ) {
      this.height = newHeight;
      this.originY = y;
      this.scaleY = this.height / this.originalHeight;
      if (resizeContent) {
        this.resizeContent();
      }
    }
  }

  resizeBottom(y: number, resizeContent = true) {
    let newHeight = y - this.originY;
    if (
      !this.invertable &&
      this.height > this.minHeight &&
      newHeight < this.minHeight
    ) {
      newHeight = this.minHeight;
    }
    if (
      (!this.invertable && newHeight >= this.minHeight) ||
      (this.invertable && Math.abs(newHeight) >= this.minHeight)
    ) {
      this.height = newHeight;
      this.scaleY = this.height / this.originalHeight;
      if (resizeContent) {
        this.resizeContent();
      }
    }
  }

  resizeLeft(x: number, resizeContent = true) {
    let newWidth = this.originX + this.width - x;
    if (
      !this.invertable &&
      this.width > this.minWidth &&
      newWidth < this.minWidth
    ) {
      newWidth = this.minWidth;
    }
    if (
      (!this.invertable && newWidth >= this.minWidth) ||
      (this.invertable && Math.abs(newWidth) >= this.minWidth)
    ) {
      this.width = newWidth;
      this.originX = x;
      this.scaleX = this.width / this.originalWidth;
      if (resizeContent) {
        this.resizeContent();
      }
    }
  }

  resizeRight(x: number, resizeContent = true) {
    let newWidth = x - this.originX;
    if (
      !this.invertable &&
      this.width > this.minWidth &&
      newWidth < this.minWidth
    ) {
      newWidth = this.minWidth;
    }
    if (
      (!this.invertable && newWidth >= this.minWidth) ||
      (this.invertable && Math.abs(newWidth) >= this.minWidth)
    ) {
      this.width = newWidth;
      this.scaleX = this.width / this.originalWidth;
      if (resizeContent) {
        this.resizeContent();
      }
    }
  }

  abstract resizeContent(): void;

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
