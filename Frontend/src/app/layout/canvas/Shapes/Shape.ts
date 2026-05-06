import { ChunkIndex } from '../Chunks/ChunkIndex';
import { Form } from '../Chunks/Form';
import { FormPropertyName } from '../FormProperties/FormPropertyName';
import {
  BaseShapeProperties,
  ChangableSerializedShapeProperties,
} from '../ShapeProperties/ShapeProperties';
import {
  NullableShapeStyle,
  ShapeStyleProperty,
} from '../ShapeStyles/ShapeStyle';

export abstract class Shape extends Form {
  declare protected _properties: Required<BaseShapeProperties>;
  constructor(
    properties: BaseShapeProperties,
    bufferCtx: CanvasRenderingContext2D,
    zeroSize = false
  ) {
    if (!zeroSize) {
      if (properties[FormPropertyName.originalWidth] == 0) {
        throw new Error('Shape width cannot be zero');
      }
      if (properties[FormPropertyName.originalWidth] == 0) {
        throw new Error('Shape height cannot be zero');
      }
    }

    const width =
      properties[FormPropertyName.width] !== undefined
        ? properties[FormPropertyName.width]
        : properties[FormPropertyName.originalWidth];
    const height =
      properties[FormPropertyName.height] !== undefined
        ? properties[FormPropertyName.height]
        : properties[FormPropertyName.originalHeight];

    const newProperties: Required<BaseShapeProperties> = {
      ...properties,
      [FormPropertyName.width]: width,
      [FormPropertyName.height]: height,
      [FormPropertyName.scaleX]:
        properties[FormPropertyName.scaleX] !== undefined
          ? properties[FormPropertyName.scaleX]
          : 1,
      [FormPropertyName.scaleY]:
        properties[FormPropertyName.scaleY] !== undefined
          ? properties[FormPropertyName.scaleY]
          : 1,
      [FormPropertyName.minWidth]:
        properties[FormPropertyName.minWidth] !== undefined
          ? properties[FormPropertyName.minWidth]
          : 1,
      [FormPropertyName.minHeight]:
        properties[FormPropertyName.minHeight] !== undefined
          ? properties[FormPropertyName.minHeight]
          : 1,
      [FormPropertyName.horizontallyInvertable]:
        properties[FormPropertyName.horizontallyInvertable] !== undefined
          ? properties[FormPropertyName.horizontallyInvertable]
          : true,
      [FormPropertyName.verticallyInvertable]:
        properties[FormPropertyName.verticallyInvertable] !== undefined
          ? properties[FormPropertyName.verticallyInvertable]
          : true,
      [FormPropertyName.horizontalInverted]:
        properties[FormPropertyName.horizontalInverted] !== undefined
          ? properties[FormPropertyName.horizontalInverted]
          : width < 0,
      [FormPropertyName.verticallyInverted]:
        properties[FormPropertyName.verticallyInverted] !== undefined
          ? properties[FormPropertyName.verticallyInverted]
          : height < 0,
    };
    super(newProperties, bufferCtx);
  }

  override get properties(): Required<BaseShapeProperties> {
    return this._properties;
  }

  override set properties(properties: BaseShapeProperties) {
    const width =
      properties[FormPropertyName.width] !== undefined
        ? properties[FormPropertyName.width]
        : properties[FormPropertyName.originalWidth];
    const height =
      properties[FormPropertyName.height] !== undefined
        ? properties[FormPropertyName.height]
        : properties[FormPropertyName.originalHeight];

    this._properties = {
      ...properties,
      [FormPropertyName.width]: width,
      [FormPropertyName.height]: height,
      [FormPropertyName.scaleX]:
        properties[FormPropertyName.scaleX] !== undefined
          ? properties[FormPropertyName.scaleX]
          : 1,
      [FormPropertyName.scaleY]:
        properties[FormPropertyName.scaleY] !== undefined
          ? properties[FormPropertyName.scaleY]
          : 1,
      [FormPropertyName.minWidth]:
        properties[FormPropertyName.minWidth] !== undefined
          ? properties[FormPropertyName.minWidth]
          : 1,
      [FormPropertyName.minHeight]:
        properties[FormPropertyName.minHeight] !== undefined
          ? properties[FormPropertyName.minHeight]
          : 1,
      [FormPropertyName.horizontallyInvertable]:
        properties[FormPropertyName.horizontallyInvertable] !== undefined
          ? properties[FormPropertyName.horizontallyInvertable]
          : true,
      [FormPropertyName.verticallyInvertable]:
        properties[FormPropertyName.verticallyInvertable] !== undefined
          ? properties[FormPropertyName.verticallyInvertable]
          : true,
      [FormPropertyName.horizontalInverted]:
        properties[FormPropertyName.horizontalInverted] !== undefined
          ? properties[FormPropertyName.horizontalInverted]
          : width < 0,
      [FormPropertyName.verticallyInverted]:
        properties[FormPropertyName.verticallyInverted] !== undefined
          ? properties[FormPropertyName.verticallyInverted]
          : height < 0,
    };
  }

  override get style(): NullableShapeStyle {
    return this.properties[FormPropertyName.style];
  }

  get originalWidth() {
    return this.properties[FormPropertyName.originalWidth];
  }

  get originalHeight() {
    return this.properties[FormPropertyName.originalHeight];
  }

  get scaleX() {
    return this.properties[FormPropertyName.scaleX];
  }
  set scaleX(scaleX: number) {
    this.properties[FormPropertyName.scaleX] = scaleX;
  }

  get scaleY() {
    return this.properties[FormPropertyName.scaleY];
  }
  set scaleY(scaleY: number) {
    this.properties[FormPropertyName.scaleY] = scaleY;
  }

  get minWidth() {
    return this.properties[FormPropertyName.minWidth];
  }

  get minHeight() {
    return this.properties[FormPropertyName.minHeight];
  }

  get horizontallyInvertable() {
    return this.properties[FormPropertyName.horizontallyInvertable];
  }

  get verticallyInvertable() {
    return this.properties[FormPropertyName.verticallyInvertable];
  }

  get horizontalInverted() {
    return this.properties[FormPropertyName.horizontalInverted];
  }

  get verticallyInverted() {
    return this.properties[FormPropertyName.verticallyInverted];
  }

  abstract offsetPath(): Path2D;

  abstract override offset(): number;

  abstract setStyleProperty(
    styleProperty: ShapeStyleProperty
  ): ChangableSerializedShapeProperties;

  // updateProperties(properties: ChangableShapeProperties) {
  //   this.properties = {
  //     ...this.properties,
  //     ...properties,
  //     [FormPropertyName.style]: {
  //       ...this.properties[FormPropertyName.style],
  //       ...properties[FormPropertyName.style],
  //     },
  //   };
  //   if (properties[FormPropertyName.width] !== undefined) {
  //     this.properties[FormPropertyName.scaleX] =
  //       this.width / this.originalWidth;
  //   }
  //   if (properties[FormPropertyName.height] !== undefined) {
  //     this.properties[FormPropertyName.scaleY] =
  //       this.height / this.originalHeight;
  //   }
  //   if (properties[FormPropertyName.width] !== undefined) {
  //     this.properties[FormPropertyName.horizontalInverted] = this.width < 0;
  //   }
  //   if (properties[FormPropertyName.height] !== undefined) {
  //     this.properties[FormPropertyName.verticallyInverted] = this.height < 0;
  //   }
  // }

  abstract pointInside(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    chunkSize: number,
    chunkIndex: ChunkIndex
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
      ((!this.verticallyInvertable && newHeight >= this.minHeight) ||
        (this.verticallyInvertable && Math.abs(newHeight) >= this.minHeight)) &&
      newHeight !== this.height
    ) {
      this.height = newHeight;
      this.originY = y;
      this.scaleY = this.height / this.originalHeight;
      properties[FormPropertyName.originY] = this.originY;
      properties[FormPropertyName.height] = this.height;
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
      ((!this.verticallyInvertable && newHeight >= this.minHeight) ||
        (this.verticallyInvertable && Math.abs(newHeight) >= this.minHeight)) &&
      newHeight !== this.height
    ) {
      this.height = newHeight;
      this.scaleY = this.height / this.originalHeight;
      properties[FormPropertyName.height] = this.height;
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
      ((!this.horizontallyInvertable && newWidth > this.minWidth) ||
        (this.horizontallyInvertable && Math.abs(newWidth) >= this.minWidth)) &&
      newWidth !== this.width
    ) {
      this.width = newWidth;
      this.originX = x;
      this.scaleX = this.width / this.originalWidth;
      properties[FormPropertyName.originX] = this.originX;
      properties[FormPropertyName.width] = this.width;
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
      ((!this.horizontallyInvertable && newWidth >= this.minWidth) ||
        (this.horizontallyInvertable && Math.abs(newWidth) >= this.minWidth)) &&
      newWidth !== this.width
    ) {
      this.width = newWidth;
      this.scaleX = this.width / this.originalWidth;
      properties[FormPropertyName.width] = this.width;
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
}
