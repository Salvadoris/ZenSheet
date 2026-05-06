import { ChunkIndex, chunkIndexToString } from '../Chunks/ChunkIndex';
import { LineSegment } from '../Chunks/LineChunkMap/LineChunkMap';
import { LineDrawingChunkMap } from '../Chunks/LineChunkMap/LineDrawingChunkMap';
import { generateUuid } from '../../../utils/uuid';
import {
  ChangableLineDrawingProperties,
  LineDrawingProperties,
} from '../DrawingProperties/LineDrawingProperties';
import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { Point } from '../Geometry';
import { LinePoints } from '../ShapeProperties/LineShapeProperties';
import { LineShape } from '../Shapes/LineShape';
import { Shape } from '../Shapes/Shape';
import { LineStyle } from '../ShapeStyles/LineStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Drawing } from './Drawing';

export class LineDrawing extends Drawing {
  declare protected _properties: LineDrawingProperties;
  #chunkMap = new LineDrawingChunkMap(this.properties);

  override get properties() {
    return this._properties;
  }

  override set properties(properties: LineDrawingProperties) {
    this._properties = properties;
  }

  get chunkMap(): LineDrawingChunkMap {
    return this.#chunkMap;
  }

  get points() {
    return this.properties[FormPropertyName.points];
  }

  set points(points: LinePoints) {
    this.properties[FormPropertyName.points] = points;
  }

  override get style(): LineStyle {
    return this.properties[FormPropertyName.style];
  }

  toShape(): Shape {
    return new LineShape(
      {
        [FormPropertyName.id]: generateUuid(),
        [FormPropertyName.style]: this.style,
        [FormPropertyName.originX]: this.originX,
        [FormPropertyName.originY]: this.originY,
        [FormPropertyName.originalWidth]: this.width,
        [FormPropertyName.originalHeight]: this.height,
        [FormPropertyName.points]: this.points.map((p): Point => {
          return [p[0] - this.originX, p[1] - this.originY];
        }) as LinePoints,
        [FormPropertyName.edited]: false,
        [FormPropertyName.selected]: false,
      },
      this.bufferCtx
    );
  }

  update(p: Point): ChangableLineDrawingProperties {
    this.points.push([p[0], p[1]]);
    const properties: ChangableLineDrawingProperties = {
      [FormPropertyName.points]: { lastPoint: [p[0], p[1]] },
    };
    const halflineWidth = this.style[StyleName.LineWidth];
    if (p[0] - halflineWidth < this.originX) {
      this.properties[FormPropertyName.width] =
        this.originX + this.width - (p[0] - halflineWidth);
      this.properties[FormPropertyName.originX] = p[0] - halflineWidth;
      properties[FormPropertyName.width] = this.width;
      properties[FormPropertyName.originX] = this.originX;
    }
    if (p[0] + halflineWidth > this.originX + this.width) {
      this.properties[FormPropertyName.width] =
        p[0] + halflineWidth - this.originX;
      properties[FormPropertyName.width] = this.width;
    }
    if (p[1] - halflineWidth < this.originY) {
      this.properties[FormPropertyName.height] =
        this.originY + this.height - (p[1] - halflineWidth);
      this.properties[FormPropertyName.originY] = p[1] - halflineWidth;
      properties[FormPropertyName.height] = this.height;
      properties[FormPropertyName.originY] = this.originY;
    }
    if (p[1] + halflineWidth > this.originY + this.height) {
      this.properties[FormPropertyName.height] =
        p[1] + halflineWidth - this.originY;
      properties[FormPropertyName.height] = this.height;
    }
    return properties;
  }

  loadChunkImage(chunkSize: number, chunkIndex: ChunkIndex): HTMLCanvasElement {
    const chunkMap = this.#chunkMap.get(chunkSize);
    if (chunkMap) {
      const lineSegments = chunkMap.get(chunkIndexToString(chunkIndex));

      if (lineSegments) {
        this.bufferCtx.save();
        this.bufferCtx.clearRect(0, 0, chunkSize, chunkSize);
        this.bufferCtx.lineWidth = this.style[StyleName.LineWidth];
        this.bufferCtx.lineCap = this.style[StyleName.LineCap];
        this.bufferCtx.strokeStyle = this.style[StyleName.Color];
        this.bufferCtx.lineJoin = 'round';
        this.bufferCtx.translate(
          -chunkIndex[0] * chunkSize,
          -chunkIndex[1] * chunkSize
        );
        this.bufferCtx.stroke(this.chunkPath(lineSegments));
        this.bufferCtx.restore();
        return this.bufferCtx.canvas;
      }
      throw new Error(`chunkMap does not contain chunkIndex: ${chunkIndex}`);
    }
    throw new Error(`chunkMap does not contain chunkSize: ${chunkSize}`);
  }

  private chunkPath(segments: LineSegment[]) {
    const path = new Path2D();
    for (const [startIdx, endIdx] of segments) {
      path.moveTo(this.points[startIdx][0], this.points[startIdx][1]);
      for (let i = startIdx + 1; i <= endIdx; i++) {
        path.lineTo(this.points[i][0], this.points[i][1]);
      }
    }
    return path;
  }

  override offset(): number {
    return 0;
  }
}
