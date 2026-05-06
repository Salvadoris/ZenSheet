import { ChunkIndex } from '../Chunks/ChunkIndex';
import { RectangleDrawingChunkMap } from '../Chunks/RectangleChunkMap/RectangleDrawingChunkMap';
import { generateUuid } from '../../../utils/uuid';
import {
  ChangableRectangleDrawingProperties,
  RectangleDrawingProperties,
} from '../DrawingProperties/RectangleDrawingProperties';
import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { Point } from '../Geometry';
import { RectangleShape } from '../Shapes/RectangleShape';
import { Shape } from '../Shapes/Shape';
import { RectangleStyle } from '../ShapeStyles/RectangleStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Drawing } from './Drawing';

export class RectangleDrawing extends Drawing {
  declare protected _properties: RectangleDrawingProperties;
  #chunkMap = new RectangleDrawingChunkMap(this.properties);

  override get properties() {
    return this._properties;
  }

  override set properties(properties: RectangleDrawingProperties) {
    this._properties = properties;
  }

  override get chunkMap(): RectangleDrawingChunkMap {
    return this.#chunkMap;
  }

  override get style(): RectangleStyle {
    return this.properties[FormPropertyName.style];
  }

  toShape(): Shape {
    return new RectangleShape(
      {
        [FormPropertyName.id]: generateUuid(),
        [FormPropertyName.style]: this.style,
        [FormPropertyName.originX]: Math.min(
          this.originX,
          this.originX + this.width
        ),
        [FormPropertyName.originY]: Math.min(
          this.originY,
          this.originY + this.height
        ),
        [FormPropertyName.originalWidth]: Math.abs(this.width),
        [FormPropertyName.originalHeight]: Math.abs(this.height),
        [FormPropertyName.edited]: false,
        [FormPropertyName.selected]: false,
      },
      this.bufferCtx
    );
  }

  update(p: Point): ChangableRectangleDrawingProperties {
    const properties: ChangableRectangleDrawingProperties = {};
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

  offset(): number {
    return this.style[StyleName.Color] === 'transparent'
      ? 0
      : this.style[StyleName.LineWidth] / 2;
  }

  loadChunkImage(chunkSize: number, chunkIndex: ChunkIndex): HTMLCanvasElement {
    const chunkindexes = this.#chunkMap.get(chunkSize);
    if (chunkindexes) {
      if (chunkindexes.hasIndex(chunkIndex[0], chunkIndex[1])) {
        this.bufferCtx.save();
        this.bufferCtx.clearRect(0, 0, chunkSize, chunkSize);
        this.bufferCtx.lineWidth = this.style[StyleName.LineWidth];
        this.bufferCtx.strokeStyle = this.style[StyleName.Color];
        this.bufferCtx.fillStyle = this.style[StyleName.BackgroundColor];
        this.bufferCtx.translate(
          -chunkIndex[0] * chunkSize,
          -chunkIndex[1] * chunkSize
        );

        const path = this.path();
        this.bufferCtx.fill(path);
        this.bufferCtx.stroke(path);
        this.bufferCtx.restore();
        return this.bufferCtx.canvas;
      }
      throw new Error(`chunkMap does not contain chunkIndex: ${chunkIndex}`);
    }
    throw new Error(`chunkMap does not contain chunkSize: ${chunkSize}`);
  }

  private path() {
    const path = new Path2D();
    path.rect(this.originX, this.originY, this.width, this.height);
    return path;
  }
}
