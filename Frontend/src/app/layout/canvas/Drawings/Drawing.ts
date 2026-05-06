import {
    ChangableDrawingProperties,
    DrawingProperties,
} from '../DrawingProperties/DrawingProperties';
import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { Point, Rect } from '../Geometry';
import { Shape } from '../Shapes/Shape';

export abstract class Drawing {
  constructor(
    public properties: DrawingProperties,
    protected bufferCtx: CanvasRenderingContext2D
  ) {}

  get style() {
    return this.properties[FormPropertyName.style];
  }

  get originX() {
    return this.properties[FormPropertyName.originX];
  }

  get originY() {
    return this.properties[FormPropertyName.originY];
  }

  get width() {
    return this.properties[FormPropertyName.width];
  }

  get height() {
    return this.properties[FormPropertyName.height];
  }

  abstract update(p: Point): ChangableDrawingProperties | null;

  abstract render(
    canvasRect: Rect,
    ctx: CanvasRenderingContext2D,
    bufferCtx: CanvasRenderingContext2D
  ): void;

  abstract toShape(): Shape;
}
