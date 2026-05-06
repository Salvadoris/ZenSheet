import { ChunkIndex, ChunkIndexSet } from '../Chunks/ChunkIndex';
import { ChunkChange, FormChunkMap } from '../Chunks/FormChunkMap';
import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { Rect } from '../Geometry';
import { GroupShapeProperties } from '../ShapeProperties/GroupShapeProperties';
import { ChangableSerializedShapeProperties } from '../ShapeProperties/ShapeProperties';
import { GroupShapeStyle } from '../ShapeStyles/GroupShapeStyle';
import { ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';

import { Shape } from './Shape';
import { TextBoxShape } from './TextBoxShape';

export class GroupShape extends Shape {
  declare protected _properties: Required<GroupShapeProperties>;

  constructor(properties: GroupShapeProperties, ctx: CanvasRenderingContext2D) {
    if (
      !properties[FormPropertyName.style] ||
      properties[FormPropertyName.originX] === undefined ||
      properties[FormPropertyName.originY] === undefined ||
      properties[FormPropertyName.originalWidth] === undefined ||
      properties[FormPropertyName.originalHeight] === undefined
    ) {
      [
        properties[FormPropertyName.originX],
        properties[FormPropertyName.originY],
        properties[FormPropertyName.originalWidth],
        properties[FormPropertyName.originalHeight],
      ] = calcRect(properties[FormPropertyName.shapes], false, false);
      properties[FormPropertyName.style] = new GroupShapeStyle(
        properties[FormPropertyName.shapes].map(s => s.style)
      );
      for (const shape of properties[FormPropertyName.shapes]) {
        shape.originX -= properties[FormPropertyName.originX];
        shape.originY -= properties[FormPropertyName.originY];
      }
    }
    if (!properties[FormPropertyName.horizontallyInvertable]) {
      properties[FormPropertyName.horizontallyInvertable] = !properties[
        FormPropertyName.shapes
      ].some(s => !s.horizontallyInvertable);
    }
    if (!properties[FormPropertyName.verticallyInvertable]) {
      properties[FormPropertyName.verticallyInvertable] = !properties[
        FormPropertyName.shapes
      ].some(s => !s.verticallyInvertable);
    }
    super(properties as Required<GroupShapeProperties>, ctx);
    if (this.shapes.length !== 0) {
      this.properties[FormPropertyName.minWidth] = this.calcMinWidth();
      this.properties[FormPropertyName.minHeight] = this.calcMinHeight();
    }
  }

  override set properties(properties: Required<GroupShapeProperties>) {
    this._properties = properties;
    this.resizeContent();
  }

  override get properties(): Required<GroupShapeProperties> {
    return this._properties;
  }

  override get chunkMap(): FormChunkMap {
    throw new Error('function not implemented');
    // TODO
  }

  override get style(): GroupShapeStyle {
    return this.properties[FormPropertyName.style];
  }

  get shapes() {
    return this.properties[FormPropertyName.shapes];
  }

  override setStyleProperty(
    styleProperty: ShapeStyleProperty
  ): ChangableSerializedShapeProperties {
    const updated = this.style.updateProperty(styleProperty);
    if (updated) {
      const shapesProperties = this.shapes.map(s => {
        return {
          [FormPropertyName.id]: s.properties[FormPropertyName.id],
          properties: s.setStyleProperty(styleProperty),
        };
      });
      return {
        [FormPropertyName.style]: {
          [styleProperty.name]: styleProperty.value,
        },
        [FormPropertyName.shapes]: shapesProperties,
      };
    }
    return {};
  }

  override loadChunkImage(
    chunkSize: number,
    chunkIndex: ChunkIndex
  ): HTMLCanvasElement {
    throw new Error('function not implemented');
    // TODO
  }

  override offsetPath(): Path2D {
    const path = new Path2D();
    const rect = this.offsetRect();
    path.rect(rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1]);
    return path;
  }

  override offset(): number {
    return Math.max(...this.shapes.map(s => s.offset()));
  }

  override offsetRect(): Rect {
    const rects = this.shapes.map(s => this.shapeGlobalOffsetRect(s));
    return [
      this.horizontalInverted
        ? Math.min(...rects.map(r => r[2]))
        : Math.min(...rects.map(r => r[0])),
      this.verticallyInverted
        ? Math.min(...rects.map(r => r[3]))
        : Math.min(...rects.map(r => r[1])),
      this.horizontalInverted
        ? Math.max(...rects.map(r => r[0]))
        : Math.max(...rects.map(r => r[2])),
      this.verticallyInverted
        ? Math.max(...rects.map(r => r[1]))
        : Math.max(...rects.map(r => r[3])),
    ];
  }

  shapeGlobalOffsetRect(shape: Shape): Rect {
    if (shape instanceof GroupShape) {
      this.shapeToGlobal(shape);
      const rect = shape.offsetRect();
      this.shapeToLocal(shape);
      return [
        this.horizontalInverted ? rect[2] : rect[0],
        this.verticallyInverted ? rect[3] : rect[1],
        this.horizontalInverted ? rect[0] : rect[2],
        this.verticallyInverted ? rect[1] : rect[3],
      ];
    }
    const offset = shape.offset();
    const rect = shape.trueRect();
    return [
      this.originX +
        (this.horizontalInverted
          ? rect[2] * this.scaleX + offset
          : rect[0] * this.scaleX - offset),
      this.originY +
        (this.verticallyInverted
          ? rect[3] * this.scaleY + offset
          : rect[1] * this.scaleY - offset),
      this.originX +
        (this.horizontalInverted
          ? rect[0] * this.scaleX - offset
          : rect[2] * this.scaleX + offset),
      this.originY +
        (this.verticallyInverted
          ? rect[1] * this.scaleY - offset
          : rect[3] * this.scaleY + offset),
    ];
  }

  override pointInside(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    chunkSize: number,
    chunkIndex: ChunkIndex
  ): boolean {
    const localX = this.toLocalX(x);
    const localY = this.toLocalY(y);
    for (const shape of this.shapes) {
      if (shape.pointInside(ctx, localX, localY, chunkSize, chunkIndex)) {
        return true;
      }
    }
    return false;
  }

  toLocalX(globalX: number) {
    return (globalX - this.originX) / this.scaleX;
  }

  toLocalY(globalY: number) {
    return (globalY - this.originY) / this.scaleY;
  }

  public shapeToLocal(globalShape: Shape) {
    globalShape.originX = (globalShape.originX - this.originX) / this.scaleX;
    globalShape.width /= this.scaleX;
    globalShape.scaleX = globalShape.width / globalShape.originalWidth;
    globalShape.originY = (globalShape.originY - this.originY) / this.scaleY;
    globalShape.height /= this.scaleY;
    globalShape.scaleY = globalShape.height / globalShape.originalHeight;
  }

  private shapeToGlobal(localShape: Shape) {
    localShape.originX = this.originX + localShape.originX * this.scaleX;
    localShape.width *= this.scaleX;
    localShape.scaleX = localShape.width / localShape.originalWidth;
    localShape.originY = this.originY + localShape.originY * this.scaleY;
    localShape.height *= this.scaleY;
    localShape.scaleY = localShape.height / localShape.originalHeight;
  }

  addShape(shape: Shape) {
    // calc new rect
    const shapeTrueRect = shape.trueRect();
    let newOriginX = 0;
    let newWidth = 0;
    if (this.horizontalInverted) {
      newOriginX = Math.max(shapeTrueRect[2], this.originX);
      newWidth =
        Math.min(this.originX + this.width, shapeTrueRect[0]) - newOriginX;
    } else {
      newOriginX = Math.min(shapeTrueRect[0], this.originX);
      newWidth =
        Math.max(this.originX + this.width, shapeTrueRect[2]) - newOriginX;
    }

    let newOriginY = 0;
    let newHeight = 0;
    if (this.verticallyInverted) {
      newOriginY = Math.max(shapeTrueRect[3], this.originY);
      newHeight =
        Math.min(this.originY + this.height, shapeTrueRect[1]) - newOriginY;
    } else {
      newOriginY = Math.min(shapeTrueRect[1], this.originY);
      newHeight =
        Math.max(this.originY + this.height, shapeTrueRect[3]) - newOriginY;
    }

    // recalc other shapes to new rect
    if (newOriginX != this.originX) {
      const dx = (this.originX - newOriginX) / this.scaleX;
      for (const shape of this.shapes) {
        shape.originX += dx;
      }
    }
    if (newOriginY != this.originY) {
      const dy = (this.originY - newOriginY) / this.scaleY;
      for (const shape of this.shapes) {
        shape.originY += dy;
      }
    }

    this.originX = newOriginX;
    this.originY = newOriginY;
    this.width = newWidth;
    this.height = newHeight;
    this.properties[FormPropertyName.originalWidth] = this.width / this.scaleX;
    this.properties[FormPropertyName.originalHeight] =
      this.height / this.scaleY;

    this.shapeToLocal(shape);

    this.shapes.push(shape);
    this.properties[FormPropertyName.style] = new GroupShapeStyle(
      this.shapes.map(s => s.style)
    );

    this.properties[FormPropertyName.horizontallyInvertable] =
      !this.shapes.some(s => !s.horizontallyInvertable);
    this.properties[FormPropertyName.verticallyInvertable] = !this.shapes.some(
      s => !s.verticallyInvertable
    );
    this.properties[FormPropertyName.minWidth] = this.calcMinWidth();
    this.properties[FormPropertyName.minHeight] = this.calcMinHeight();
  }

  shapesToGlobal() {
    for (const shape of this.shapes) {
      this.shapeToGlobal(shape);
    }
  }

  shapesToLocal() {
    for (const shape of this.shapes) {
      this.shapeToLocal(shape);
    }
  }

  clearShapes() {
    this.properties[FormPropertyName.shapes] = [];
  }

  removeShape(shape: Shape) {
    const idx = this.shapes.indexOf(shape);
    if (idx !== -1) {
      this.shapes.splice(idx, 1);

      this.shapeToGlobal(shape);

      this.properties[FormPropertyName.style] = new GroupShapeStyle(
        this.shapes.map(s => s.style)
      );

      this.properties[FormPropertyName.horizontallyInvertable] =
        !this.shapes.some(s => !s.horizontallyInvertable);
      this.properties[FormPropertyName.verticallyInvertable] =
        !this.shapes.some(s => !s.verticallyInvertable);
      this.properties[FormPropertyName.minWidth] = this.calcMinWidth();
      this.properties[FormPropertyName.minHeight] = this.calcMinHeight();

      // calc new rect
      const [localOriginX, localOriginY, localWidth, localHeight] = calcRect(
        this.shapes,
        this.horizontalInverted,
        this.verticallyInverted
      );
      const newOriginX = this.originX + localOriginX * this.scaleX;
      const newOriginY = this.originY + localOriginY * this.scaleY;
      const newWidth = localWidth * this.scaleX;
      const newHeight = localHeight * this.scaleY;

      // recalc shapes to new rect
      if (newOriginX != this.originX) {
        const dx = this.originX - newOriginX;
        for (const shape of this.shapes) {
          shape.originX += dx;
        }
      }
      if (newOriginY != this.originY) {
        const dy = this.originY - newOriginY;
        for (const shape of this.shapes) {
          shape.originY += dy;
        }
      }

      this.originX = newOriginX;
      this.originY = newOriginY;
      this.width = newWidth;
      this.height = newHeight;
      this.properties[FormPropertyName.originalWidth] = localWidth;
      this.properties[FormPropertyName.originalHeight] = localHeight;
    }
  }

  private calcMinWidth() {
    return Math.max(
      ...this.shapes.map(s =>
        s.minWidth === 0 && s.originalWidth === 0
          ? 0
          : s.minWidth * (this.originalWidth / (s.originalWidth * s.scaleX))
      )
    );
  }

  private calcMinHeight() {
    return Math.max(
      ...this.shapes.map(s =>
        s.minHeight === 0 && s.originalHeight === 0
          ? 0
          : s.minHeight * (this.originalHeight / (s.originalHeight * s.scaleY))
      )
    );
  }

  override resizeContent(): ChangableSerializedShapeProperties {
    const properties: ChangableSerializedShapeProperties = {};
    for (const shape of this.shapes) {
      this.shapeToGlobal(shape);
      let shapeProperties: ChangableSerializedShapeProperties = {};
      if (shape instanceof TextBoxShape && !shape.wrap) {
        shape.wrap = true;
        shapeProperties[FormPropertyName.wrap] = true;
      }
      shapeProperties = {
        ...shapeProperties,
        ...shape.resizeContent(),
      };
      if (Object.keys(shapeProperties).length !== 0) {
        const serialized = {
          id: shape.properties[FormPropertyName.id],
          properties: shapeProperties,
        };
        if (properties.shapes) {
          properties.shapes.push(serialized);
        } else {
          properties.shapes = [serialized];
        }
      }
      this.shapeToLocal(shape);
    }
    return properties;
  }
}

export function calcRect(
  shapes: Shape[],
  horizontalInverted: boolean,
  verticallyInverted: boolean
): [number, number, number, number] {
  const originX = Math.min(
    ...shapes.map(s => (s.horizontalInverted ? s.originX + s.width : s.originX))
  );
  const originY = Math.min(
    ...shapes.map(s =>
      s.verticallyInverted ? s.originY + s.height : s.originY
    )
  );
  const width =
    Math.max(
      ...shapes.map(s =>
        s.horizontalInverted ? s.originX : s.originX + s.width
      )
    ) - originX;
  const height =
    Math.max(
      ...shapes.map(s =>
        s.verticallyInverted ? s.originY : s.originY + s.height
      )
    ) - originY;

  let newOriginX = 0;
  let newWidth = 0;
  if (horizontalInverted) {
    newOriginX = originX + width;
    newWidth = -width;
  } else {
    newOriginX = originX;
    newWidth = width;
  }

  let newOriginY = 0;
  let newHeight = 0;
  if (verticallyInverted) {
    newOriginY = originY + height;
    newHeight = -height;
  } else {
    newOriginY = originY;
    newHeight = height;
  }
  return [newOriginX, newOriginY, newWidth, newHeight];
}
