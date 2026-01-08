import { Point, Rect } from '../Geometry';
import { BaseShapeProperties } from '../ShapeProperties/ShapeProperties';
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
import {
  NullableShapeStyle,
  ShapeStyleProperty,
} from '../ShapeStyles/ShapeStyle';

export abstract class Shape {
  properties: Required<BaseShapeProperties>;
  constructor(
    properties: BaseShapeProperties,
    public ctx: CanvasRenderingContext2D
  ) {
    if (properties[ShapePropertyName.originalWidth] == 0) {
      throw new Error('Shape width cannot be zero');
    }
    if (properties[ShapePropertyName.originalWidth] == 0) {
      throw new Error('Shape height cannot be zero');
    }
    const width =
      properties[ShapePropertyName.width] !== undefined
        ? properties[ShapePropertyName.width]
        : properties[ShapePropertyName.originalWidth];
    const height =
      properties[ShapePropertyName.height] !== undefined
        ? properties[ShapePropertyName.height]
        : properties[ShapePropertyName.originalHeight];

    this.properties = {
      ...properties,
      [ShapePropertyName.width]: width,
      [ShapePropertyName.height]: height,
      [ShapePropertyName.scaleX]: properties[ShapePropertyName.scaleX]
        ? properties[ShapePropertyName.scaleX]
        : 1,
      [ShapePropertyName.scaleY]: properties[ShapePropertyName.scaleY]
        ? properties[ShapePropertyName.scaleY]
        : 1,
      [ShapePropertyName.minWidth]: properties[ShapePropertyName.minWidth]
        ? properties[ShapePropertyName.minWidth]
        : 1,
      [ShapePropertyName.minHeight]: properties[ShapePropertyName.minHeight]
        ? properties[ShapePropertyName.minHeight]
        : 1,
      [ShapePropertyName.invertable]: properties[ShapePropertyName.invertable]
        ? properties[ShapePropertyName.invertable]
        : true,
      [ShapePropertyName.horizontalInverted]: properties[
        ShapePropertyName.horizontalInverted
      ]
        ? properties[ShapePropertyName.horizontalInverted]
        : width < 0,
      [ShapePropertyName.verticallyInverted]: properties[
        ShapePropertyName.verticallyInverted
      ]
        ? properties[ShapePropertyName.verticallyInverted]
        : height < 0,
    };
  }

  get style(): NullableShapeStyle {
    return this.properties[ShapePropertyName.style];
  }

  get originX() {
    return this.properties[ShapePropertyName.originX];
  }
  set originX(originX: number) {
    this.properties[ShapePropertyName.originX] = originX;
  }

  get originY() {
    return this.properties[ShapePropertyName.originY];
  }
  set originY(originY: number) {
    this.properties[ShapePropertyName.originY] = originY;
  }

  get originalWidth() {
    return this.properties[ShapePropertyName.originalWidth];
  }

  get originalHeight() {
    return this.properties[ShapePropertyName.originalHeight];
  }

  get width() {
    return this.properties[ShapePropertyName.width];
  }
  set width(width: number) {
    this.properties[ShapePropertyName.width] = width;
  }

  get height() {
    return this.properties[ShapePropertyName.height];
  }
  set height(height: number) {
    this.properties[ShapePropertyName.height] = height;
  }

  get scaleX() {
    return this.properties[ShapePropertyName.scaleX];
  }
  set scaleX(scaleX: number) {
    this.properties[ShapePropertyName.scaleX] = scaleX;
  }

  get scaleY() {
    return this.properties[ShapePropertyName.scaleY];
  }
  set scaleY(scaleY: number) {
    this.properties[ShapePropertyName.scaleY] = scaleY;
  }

  get minWidth() {
    return this.properties[ShapePropertyName.minWidth];
  }

  get minHeight() {
    return this.properties[ShapePropertyName.minHeight];
  }

  get invertable() {
    return this.properties[ShapePropertyName.invertable];
  }

  get horizontalInverted() {
    return this.properties[ShapePropertyName.horizontalInverted];
  }

  get verticallyInverted() {
    return this.properties[ShapePropertyName.verticallyInverted];
  }

  render(canvasRect: Rect): void {
    this.properties[ShapePropertyName.horizontalInverted] = this.width < 0;
    this.properties[ShapePropertyName.verticallyInverted] = this.height < 0;
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
      (!this.invertable && newWidth > this.minWidth) ||
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
