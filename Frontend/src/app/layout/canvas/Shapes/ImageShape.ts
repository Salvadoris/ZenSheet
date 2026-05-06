import { ChunkIndex, ChunkIndexSet } from '../Chunks/ChunkIndex';
import { ChunkChange, FormChunkMap } from '../Chunks/FormChunkMap';
import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { Rect } from '../Geometry';
import { ImageShapeProperties } from '../ShapeProperties/ImageShapeProperties';
import { ChangableSerializedShapeProperties } from '../ShapeProperties/ShapeProperties';
import { ImageStyle } from '../ShapeStyles/ImageStyle';
import { ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Shape } from './Shape';

export class ImageShape extends Shape {
  declare protected _properties: Required<ImageShapeProperties>;

  constructor(
    properties: ImageShapeProperties,
    bufferCtx: CanvasRenderingContext2D
  ) {
    super(properties, bufferCtx);
  }

  override set properties(properties: Required<ImageShapeProperties>) {
    this._properties = properties;
  }

  override get properties(): Required<ImageShapeProperties> {
    return this._properties;
  }

  override get chunkMap(): FormChunkMap {
    throw new Error('function not implemented');
    // TODO
  }

  override get style(): ImageStyle {
    return this.properties[FormPropertyName.style];
  }

  override setStyleProperty(
    styleProperty: ShapeStyleProperty
  ): ChangableSerializedShapeProperties {
    const updated = this.style.updateProperty(styleProperty);
    if (updated) {
      return {
        [FormPropertyName.style]: {
          [styleProperty.name]: styleProperty.value,
        },
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
    path.rect(0, 0, this.width, this.height);
    return path;
  }

  override offset(): number {
    return 0;
  }

  override pointInside(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    chunkSize: number,
    chunkIndex: ChunkIndex
  ): boolean {
    throw new Error('function not implemented');
    // TODO
  }

  override resizeContent(): ChangableSerializedShapeProperties {
    return {};
  }
}
