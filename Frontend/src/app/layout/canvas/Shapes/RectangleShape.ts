import { ChunkIndex } from '../Chunks/ChunkIndex';
import { RectangleShapeChunkMap } from '../Chunks/RectangleChunkMap/RectangleShapeChunkMap';
import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { RectangleShapeProperties } from '../ShapeProperties/RectangleShapeProperties';
import { ChangableSerializedShapeProperties } from '../ShapeProperties/ShapeProperties';
import { RectangleStyle } from '../ShapeStyles/RectangleStyle';
import { ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Shape } from './Shape';

export class RectangleShape extends Shape {
  declare protected _properties: Required<RectangleShapeProperties>;
  #chunkMap = new RectangleShapeChunkMap(this.properties);

  constructor(
    properties: RectangleShapeProperties,
    bufferCtx: CanvasRenderingContext2D
  ) {
    super(properties, bufferCtx);
  }

  override set properties(properties: Required<RectangleShapeProperties>) {
    this._properties = properties;
  }

  override get properties(): Required<RectangleShapeProperties> {
    return this._properties;
  }

  override get chunkMap(): RectangleShapeChunkMap {
    return this.#chunkMap;
  }

  override get style(): RectangleStyle {
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

  path(): Path2D {
    const path = new Path2D();
    path.rect(this.originX, this.originY, this.width, this.height);
    return path;
  }

  override offsetPath(): Path2D {
    const path = new Path2D();
    const rect = this.offsetRect();
    path.rect(rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1]);
    return path;
  }

  override offset(): number {
    return this.style[StyleName.Color] === 'transparent'
      ? 0
      : this.style[StyleName.LineWidth] / 2;
  }

  override pointInside(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ): boolean {
    ctx.lineWidth = this.style[StyleName.LineWidth];
    const backgroundTransparent =
      this.style[StyleName.BackgroundColor] === 'transparent';
    const borderTransparent = this.style[StyleName.Color] === 'transparent';
    if (backgroundTransparent && !borderTransparent) {
      return ctx.isPointInStroke(this.path(), x, y);
    } else if (borderTransparent && !backgroundTransparent) {
      return ctx.isPointInPath(this.path(), x, y);
    } else {
      return ctx.isPointInPath(this.offsetPath(), x, y);
    }
  }

  override resizeContent(): ChangableSerializedShapeProperties {
    return {};
  }
}
