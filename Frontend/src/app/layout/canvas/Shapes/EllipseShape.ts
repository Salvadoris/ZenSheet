import { ChunkIndex } from '../Chunks/ChunkIndex';
import { EllipseShapeChunkMap } from '../Chunks/EllipseChunkMap/EllipseShapeChunkMap';
import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { EllipseShapeProperties } from '../ShapeProperties/EllipseShapeProperties';
import { ChangableSerializedShapeProperties } from '../ShapeProperties/ShapeProperties';
import { EllipseStyle } from '../ShapeStyles/EllipseStyle';
import { ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Shape } from './Shape';

export class EllipseShape extends Shape {
  declare protected _properties: Required<EllipseShapeProperties>;
  #chunkMap = new EllipseShapeChunkMap(this.properties);

  constructor(
    properties: EllipseShapeProperties,
    bufferCtx: CanvasRenderingContext2D
  ) {
    super(properties, bufferCtx);
  }

  override set properties(properties: Required<EllipseShapeProperties>) {
    this._properties = properties;
  }

  override get properties(): Required<EllipseShapeProperties> {
    return this._properties;
  }

  override get chunkMap(): EllipseShapeChunkMap {
    return this.#chunkMap;
  }

  override get style(): EllipseStyle {
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

  private path() {
    const radiusX = Math.abs(this.width / 2);
    const radiusY = Math.abs(this.height / 2);
    const centerX = this.originX + this.width / 2;
    const centerY = this.originY + this.height / 2;

    const path = new Path2D();
    path.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    return path;
  }

  override offsetPath(): Path2D {
    const path = new Path2D();
    const rect = this.offsetRect();
    path.ellipse(
      (rect[0] + rect[2]) / 2,
      (rect[1] + rect[3]) / 2,
      Math.abs(rect[0] - rect[2]) / 2,
      Math.abs(rect[1] - rect[3]) / 2,
      0,
      0,
      2 * Math.PI
    );
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
