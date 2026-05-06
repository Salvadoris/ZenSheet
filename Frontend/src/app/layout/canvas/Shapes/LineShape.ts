import {
  ChunkIndex,
  ChunkIndexSet,
  chunkIndexToString,
} from '../Chunks/ChunkIndex';
import { ChunkChange } from '../Chunks/FormChunkMap';
import { LineShapeChunkMap } from '../Chunks/LineChunkMap/LineShapeChunkMap';
import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { LineShapeProperties } from '../ShapeProperties/LineShapeProperties';
import { ChangableSerializedShapeProperties } from '../ShapeProperties/ShapeProperties';
import { LineStyle } from '../ShapeStyles/LineStyle';
import { ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Shape } from './Shape';

export class LineShape extends Shape {
  declare protected _properties: Required<LineShapeProperties>;
  #chunkMap: LineShapeChunkMap;

  constructor(
    properties: LineShapeProperties,
    bufferCtx: CanvasRenderingContext2D
  ) {
    super(properties as Required<LineShapeProperties>, bufferCtx);
    this.#chunkMap = new LineShapeChunkMap(this.properties);
  }

  override set properties(properties: Required<LineShapeProperties>) {
    this._properties = properties;
  }

  override get properties(): Required<LineShapeProperties> {
    return this._properties;
  }

  override get chunkMap(): LineShapeChunkMap {
    return this.#chunkMap;
  }

  override get style(): LineStyle {
    return this.properties[FormPropertyName.style];
  }

  get points() {
    return this.properties[FormPropertyName.points];
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
    this.bufferCtx.lineCap = this.style[StyleName.LineCap];
    this.bufferCtx.strokeStyle = this.style[StyleName.Color];
    this.bufferCtx.lineJoin = 'round';
    this.bufferCtx.translate(
      -chunkIndex[0] * chunkSize + this.originX,
      -chunkIndex[1] * chunkSize + this.originY
    );

    this.bufferCtx.stroke(this.chunkPath(chunkSize, chunkIndex));
    this.bufferCtx.restore();
    return this.bufferCtx.canvas;
  }

  chunkPath(chunkSize: number, chunkIndex: ChunkIndex) {
    const chunkMap = this.#chunkMap.get(chunkSize);
    if (!chunkMap) {
      throw new Error(`chunkMap does not contain chunkSize: ${chunkSize}`);
    }

    const lineSegments = chunkMap.get(chunkIndexToString(chunkIndex));
    if (lineSegments) {
      const path = new Path2D();
      for (const [startIdx, endIdx] of lineSegments) {
        path.moveTo(this.points[startIdx][0], this.points[startIdx][1]);
        for (let i = startIdx + 1; i <= endIdx; i++) {
          path.lineTo(this.points[i][0], this.points[i][1]);
        }
      }
      return path;
    }
    throw new Error(`chunkMap does not contain chunkIndex: ${chunkIndex}`);
  }

  override offsetPath(): Path2D {
    const path = new Path2D();
    path.rect(this.originX, this.originY, this.width, this.height);
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
    return ctx.isPointInStroke(this.chunkPath(chunkSize, chunkIndex), x, y);
  }

  override resizeContent(): ChangableSerializedShapeProperties {
    return {};
  }
}
