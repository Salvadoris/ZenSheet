import { Point, Rect } from '../Geometry';
import {
  BaseShapeProperties,
  ChangableSerializedShapeProperties,
  ChangableShapeProperties,
} from '../ShapeProperties/ShapeProperties';
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
import {
  NullableShapeStyle,
  ShapeStyleProperty,
} from '../ShapeStyles/ShapeStyle';

export abstract class Shape {
  protected _properties!: Required<BaseShapeProperties>;
  #bufferCtx: CanvasRenderingContext2D;
  constructor(
    properties: BaseShapeProperties,
    bufferCtx: CanvasRenderingContext2D
  ) {
    if (properties[ShapePropertyName.originalWidth] == 0) {
      throw new Error('Shape width cannot be zero');
    }
    if (properties[ShapePropertyName.originalWidth] == 0) {
      throw new Error('Shape height cannot be zero');
    }
    this.#bufferCtx = bufferCtx;
    const width =
      properties[ShapePropertyName.width] !== undefined
        ? properties[ShapePropertyName.width]
        : properties[ShapePropertyName.originalWidth];
    const height =
      properties[ShapePropertyName.height] !== undefined
        ? properties[ShapePropertyName.height]
        : properties[ShapePropertyName.originalHeight];

    this._properties = {
      ...properties,
      [ShapePropertyName.width]: width,
      [ShapePropertyName.height]: height,
      [ShapePropertyName.scaleX]:
        properties[ShapePropertyName.scaleX] !== undefined
          ? properties[ShapePropertyName.scaleX]
          : 1,
      [ShapePropertyName.scaleY]:
        properties[ShapePropertyName.scaleY] !== undefined
          ? properties[ShapePropertyName.scaleY]
          : 1,
      [ShapePropertyName.minWidth]:
        properties[ShapePropertyName.minWidth] !== undefined
          ? properties[ShapePropertyName.minWidth]
          : 1,
      [ShapePropertyName.minHeight]:
        properties[ShapePropertyName.minHeight] !== undefined
          ? properties[ShapePropertyName.minHeight]
          : 1,
      [ShapePropertyName.horizontallyInvertable]:
        properties[ShapePropertyName.horizontallyInvertable] !== undefined
          ? properties[ShapePropertyName.horizontallyInvertable]
          : true,
      [ShapePropertyName.verticallyInvertable]:
        properties[ShapePropertyName.verticallyInvertable] !== undefined
          ? properties[ShapePropertyName.verticallyInvertable]
          : true,
      [ShapePropertyName.horizontalInverted]:
        properties[ShapePropertyName.horizontalInverted] !== undefined
          ? properties[ShapePropertyName.horizontalInverted]
          : width < 0,
      [ShapePropertyName.verticallyInverted]:
        properties[ShapePropertyName.verticallyInverted] !== undefined
          ? properties[ShapePropertyName.verticallyInverted]
          : height < 0,
    };
  }

  get bufferCtx() {
    return this.#bufferCtx;
  }

  get properties(): Required<BaseShapeProperties> {
    return this._properties;
  }

  set properties(properties: BaseShapeProperties) {
    const width =
      properties[ShapePropertyName.width] !== undefined
        ? properties[ShapePropertyName.width]
        : properties[ShapePropertyName.originalWidth];
    const height =
      properties[ShapePropertyName.height] !== undefined
        ? properties[ShapePropertyName.height]
        : properties[ShapePropertyName.originalHeight];

    this._properties = {
      ...properties,
      [ShapePropertyName.width]: width,
      [ShapePropertyName.height]: height,
      [ShapePropertyName.scaleX]:
        properties[ShapePropertyName.scaleX] !== undefined
          ? properties[ShapePropertyName.scaleX]
          : 1,
      [ShapePropertyName.scaleY]:
        properties[ShapePropertyName.scaleY] !== undefined
          ? properties[ShapePropertyName.scaleY]
          : 1,
      [ShapePropertyName.minWidth]:
        properties[ShapePropertyName.minWidth] !== undefined
          ? properties[ShapePropertyName.minWidth]
          : 1,
      [ShapePropertyName.minHeight]:
        properties[ShapePropertyName.minHeight] !== undefined
          ? properties[ShapePropertyName.minHeight]
          : 1,
      [ShapePropertyName.horizontallyInvertable]:
        properties[ShapePropertyName.horizontallyInvertable] !== undefined
          ? properties[ShapePropertyName.horizontallyInvertable]
          : true,
      [ShapePropertyName.verticallyInvertable]:
        properties[ShapePropertyName.verticallyInvertable] !== undefined
          ? properties[ShapePropertyName.verticallyInvertable]
          : true,
      [ShapePropertyName.horizontalInverted]:
        properties[ShapePropertyName.horizontalInverted] !== undefined
          ? properties[ShapePropertyName.horizontalInverted]
          : width < 0,
      [ShapePropertyName.verticallyInverted]:
        properties[ShapePropertyName.verticallyInverted] !== undefined
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

  get horizontallyInvertable() {
    return this.properties[ShapePropertyName.horizontallyInvertable];
  }

  get verticallyInvertable() {
    return this.properties[ShapePropertyName.verticallyInvertable];
  }

  get horizontalInverted() {
    return this.properties[ShapePropertyName.horizontalInverted];
  }

  get verticallyInverted() {
    return this.properties[ShapePropertyName.verticallyInverted];
  }

  render(canvasRect: Rect, ctx: CanvasRenderingContext2D): void {
    this.properties[ShapePropertyName.horizontalInverted] = this.width < 0;
    this.properties[ShapePropertyName.verticallyInverted] = this.height < 0;
    this.renderShape(canvasRect, ctx);
  }

  abstract renderShape(canvasRect: Rect, ctx: CanvasRenderingContext2D): void;

  abstract path(): Path2D;

  abstract offsetPath(): Path2D;

  abstract offsetRect(): Rect;

  abstract offset(): number;

  abstract setStyleProperty(
    styleProperty: ShapeStyleProperty
  ): ChangableSerializedShapeProperties;

  updateProperties(properties: ChangableShapeProperties) {
    this.properties = {
      ...this.properties,
      ...properties,
      [ShapePropertyName.style]: {
        ...this.properties[ShapePropertyName.style],
        ...properties[ShapePropertyName.style],
      },
    };
    if (properties[ShapePropertyName.width] !== undefined) {
      this.properties[ShapePropertyName.scaleX] =
        this.width / this.originalWidth;
    }
    if (properties[ShapePropertyName.height] !== undefined) {
      this.properties[ShapePropertyName.scaleY] =
        this.height / this.originalHeight;
    }
    if (properties[ShapePropertyName.width] !== undefined) {
      this.properties[ShapePropertyName.horizontalInverted] = this.width < 0;
    }
    if (properties[ShapePropertyName.height] !== undefined) {
      this.properties[ShapePropertyName.verticallyInverted] = this.height < 0;
    }
  }

  abstract pointInside(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ): boolean;

  resizeTop(
    y: number,
    resizeContent = true
  ): ChangableSerializedShapeProperties {
    let newHeight = this.originY + this.height - y;
    if (
      !this.verticallyInvertable &&
      this.height > this.minHeight &&
      newHeight < this.minHeight
    ) {
      newHeight = this.minHeight;
      y = this.originY + this.height - newHeight;
    }
    const properties: ChangableSerializedShapeProperties = {};
    if (
      (!this.verticallyInvertable && newHeight >= this.minHeight) ||
      (this.verticallyInvertable && Math.abs(newHeight) >= this.minHeight)
    ) {
      this.height = newHeight;
      this.originY = y;
      this.scaleY = this.height / this.originalHeight;
      properties[ShapePropertyName.originY] = this.originY;
      properties[ShapePropertyName.height] = this.height;
      if (resizeContent) {
        return {
          ...properties,
          ...this.resizeContent(),
        };
      }
    }
    return properties;
  }

  resizeBottom(
    y: number,
    resizeContent = true
  ): ChangableSerializedShapeProperties {
    let newHeight = y - this.originY;
    if (
      !this.verticallyInvertable &&
      this.height > this.minHeight &&
      newHeight < this.minHeight
    ) {
      newHeight = this.minHeight;
    }
    const properties: ChangableSerializedShapeProperties = {};
    if (
      (!this.verticallyInvertable && newHeight >= this.minHeight) ||
      (this.verticallyInvertable && Math.abs(newHeight) >= this.minHeight)
    ) {
      this.height = newHeight;
      this.scaleY = this.height / this.originalHeight;
      properties[ShapePropertyName.height] = this.height;
      if (resizeContent) {
        return {
          ...properties,
          ...this.resizeContent(),
        };
      }
    }
    return properties;
  }

  resizeLeft(
    x: number,
    resizeContent = true
  ): ChangableSerializedShapeProperties {
    let newWidth = this.originX + this.width - x;
    if (
      !this.horizontallyInvertable &&
      this.width > this.minWidth &&
      newWidth < this.minWidth
    ) {
      newWidth = this.minWidth;
    }
    const properties: ChangableSerializedShapeProperties = {};
    if (
      (!this.horizontallyInvertable && newWidth > this.minWidth) ||
      (this.horizontallyInvertable && Math.abs(newWidth) >= this.minWidth)
    ) {
      this.width = newWidth;
      this.originX = x;
      this.scaleX = this.width / this.originalWidth;
      properties[ShapePropertyName.originX] = this.originX;
      properties[ShapePropertyName.width] = this.width;
      if (resizeContent) {
        return {
          ...properties,
          ...this.resizeContent(),
        };
      }
    }
    return properties;
  }

  resizeRight(
    x: number,
    resizeContent = true
  ): ChangableSerializedShapeProperties {
    let newWidth = x - this.originX;
    if (
      !this.horizontallyInvertable &&
      this.width > this.minWidth &&
      newWidth < this.minWidth
    ) {
      newWidth = this.minWidth;
    }
    const properties: ChangableSerializedShapeProperties = {};
    if (
      (!this.horizontallyInvertable && newWidth >= this.minWidth) ||
      (this.horizontallyInvertable && Math.abs(newWidth) >= this.minWidth)
    ) {
      this.width = newWidth;
      this.scaleX = this.width / this.originalWidth;
      properties[ShapePropertyName.width] = this.width;
      if (resizeContent) {
        return {
          ...properties,
          ...this.resizeContent(),
        };
      }
    }
    return properties;
  }

  abstract resizeContent(): ChangableSerializedShapeProperties;

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
