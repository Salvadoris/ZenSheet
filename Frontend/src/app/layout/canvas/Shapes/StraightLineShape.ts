import { ChunkIndex, ChunkIndexSet } from '../Chunks/ChunkIndex';
import { ChunkChange } from '../Chunks/FormChunkMap';
import { StraightLineShapeChunkMap } from '../Chunks/StraightLineMap/StraightLineShapeChunkMap';
import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { ChangableSerializedShapeProperties } from '../ShapeProperties/ShapeProperties';
import { StraightLineShapeProperties } from '../ShapeProperties/StraightLineShapeProperties';
import { ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';
import { StraightLineStyle } from '../ShapeStyles/StraightLineStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Shape } from './Shape';

export class StraightLineShape extends Shape {
  declare protected _properties: Required<StraightLineShapeProperties>;
  #chunkMap = new StraightLineShapeChunkMap(this.properties);

  constructor(
    properties: StraightLineShapeProperties,
    bufferCtx: CanvasRenderingContext2D
  ) {
    super(properties, bufferCtx, true);
    this.properties[FormPropertyName.minWidth] = 0;
    this.properties[FormPropertyName.minHeight] = 0;
  }

  override set properties(properties: Required<StraightLineShapeProperties>) {
    this._properties = properties;
  }

  override get properties(): Required<StraightLineShapeProperties> {
    return this._properties;
  }

  override get chunkMap(): StraightLineShapeChunkMap {
    return this.#chunkMap;
  }

  override get style(): StraightLineStyle {
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
    this.bufferCtx.save();
    this.bufferCtx.clearRect(0, 0, chunkSize, chunkSize);
    this.bufferCtx.lineWidth = this.style[StyleName.LineWidth];
    this.bufferCtx.strokeStyle = this.style[StyleName.Color];
    this.bufferCtx.lineCap = this.style[StyleName.LineCap];
    this.bufferCtx.translate(
      -chunkIndex[0] * chunkSize,
      -chunkIndex[1] * chunkSize
    );
    this.bufferCtx.stroke(this.path());
    this.bufferCtx.restore();
    return this.bufferCtx.canvas;
  }

  path(): Path2D {
    const path = new Path2D();
    path.moveTo(this.originX, this.originY);
    path.lineTo(this.originX + this.width, this.originY + this.height);
    return path;
  }

  override offsetPath(): Path2D {
    return this.path();
  }

  override offset(): number {
    return this.style[StyleName.LineWidth] / 2;
  }

  override pointInside(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ): boolean {
    return ctx.isPointInStroke(this.path(), x, y);
  }

  override resizeContent(): ChangableSerializedShapeProperties {
    return {};
  }
}
