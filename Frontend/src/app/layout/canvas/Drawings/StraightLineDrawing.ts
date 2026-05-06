import { ChunkIndex } from '../Chunks/ChunkIndex';
import { StraightLineDrawingChunkMap } from '../Chunks/StraightLineMap/StraightLineDrawingChunkMap';
import { generateUuid } from '../../../utils/uuid';
import {
  ChangableStraightLineDrawingProperties,
  StraightLineDrawingProperties,
} from '../DrawingProperties/StraightLineDrawingProperties';
import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { Point } from '../Geometry';
import { Shape } from '../Shapes/Shape';
import { StraightLineShape } from '../Shapes/StraightLineShape';
import { StraightLineStyle } from '../ShapeStyles/StraightLineStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Drawing } from './Drawing';

export class StraightLineDrawing extends Drawing {
  declare protected _properties: StraightLineDrawingProperties;
  #chunkMap = new StraightLineDrawingChunkMap(this.properties);

  override get properties() {
    return this._properties;
  }

  override set properties(properties: StraightLineDrawingProperties) {
    this._properties = properties;
  }

  override get chunkMap(): StraightLineDrawingChunkMap {
    return this.#chunkMap;
  }

  override get style(): StraightLineStyle {
    return this.properties[FormPropertyName.style];
  }

  toShape(): Shape {
    return new StraightLineShape(
      {
        [FormPropertyName.id]: generateUuid(),
        [FormPropertyName.style]: this.style,
        [FormPropertyName.originX]: this.originX,
        [FormPropertyName.originY]: this.originY,
        [FormPropertyName.originalWidth]: this.width,
        [FormPropertyName.originalHeight]: this.height,
        [FormPropertyName.edited]: false,
        [FormPropertyName.selected]: false,
      },
      this.bufferCtx
    );
  }

  update(p: Point): ChangableStraightLineDrawingProperties {
    const properties: ChangableStraightLineDrawingProperties = {};
    const newWidth = p[0] - this.originX;
    if (newWidth !== this.width) {
      this.properties[FormPropertyName.width] = newWidth;
      properties[FormPropertyName.width] = newWidth;
    }
    const newHeight = p[1] - this.originY;
    if (newHeight !== this.height) {
      this.properties[FormPropertyName.height] = newHeight;
      properties[FormPropertyName.height] = newHeight;
    }
    return properties;
  }

  loadChunkImage(chunkSize: number, chunkIndex: ChunkIndex): HTMLCanvasElement {
    const chunkIndexes = this.#chunkMap.get(chunkSize);
    if (chunkIndexes) {
      if (chunkIndexes.hasIndex(chunkIndex[0], chunkIndex[1])) {
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
      throw new Error(`chunkMap does not contain chunkIndex: ${chunkIndex}`);
    }
    throw new Error(`chunkMap does not contain chunkSize: ${chunkSize}`);
  }

  private path() {
    const path = new Path2D();
    path.moveTo(this.originX, this.originY);
    path.lineTo(this.originX + this.width, this.originY + this.height);
    return path;
  }

  override offset(): number {
    return this.style[StyleName.LineWidth] / 2;
  }
}
