import { FormProperties } from '../FormProperties/FormProperties';
import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { Rect } from '../Geometry';

import { ChunkIndex } from './ChunkIndex';
import { FormChunkMap } from './FormChunkMap';

export abstract class Form {
  constructor(
    protected _properties: FormProperties,
    private _bufferCtx: CanvasRenderingContext2D
  ) {}

  get bufferCtx() {
    return this._bufferCtx;
  }

  get properties() {
    return this._properties;
  }

  set properties(properties: FormProperties) {
    this._properties = properties;
  }

  abstract get chunkMap(): FormChunkMap;

  get style() {
    return this._properties[FormPropertyName.style];
  }

  get originX() {
    return this._properties[FormPropertyName.originX];
  }

  set originX(originX: number) {
    this.properties[FormPropertyName.originX] = originX;
  }

  get originY() {
    return this._properties[FormPropertyName.originY];
  }

  set originY(originY: number) {
    this.properties[FormPropertyName.originY] = originY;
  }

  get width() {
    return this._properties[FormPropertyName.width];
  }

  set width(width: number) {
    this.properties[FormPropertyName.width] = width;
  }

  get height() {
    return this._properties[FormPropertyName.height];
  }

  set height(height: number) {
    this.properties[FormPropertyName.height] = height;
  }

  abstract loadChunkImage(
    chunkSize: number,
    chunkIndex: ChunkIndex
  ): HTMLCanvasElement;

  abstract offset(): number;

  offsetRect(): Rect {
    const trueRect = this.trueRect();
    const offset = this.offset();
    return [
      trueRect[0] - offset,
      trueRect[1] - offset,
      trueRect[2] + offset,
      trueRect[3] + offset,
    ];
  }

  trueRect(): Rect {
    let minX = 0;
    let maxX = 0;
    if (this.width < 0) {
      minX = this.originX + this.width;
      maxX = this.originX;
    } else {
      minX = this.originX;
      maxX = this.originX + this.width;
    }
    let minY = 0;
    let maxY = 0;
    if (this.height < 0) {
      minY = this.originY + this.height;
      maxY = this.originY;
    } else {
      minY = this.originY;
      maxY = this.originY + this.height;
    }
    return [minX, minY, maxX, maxY];
  }
}
