import {
  ChangableDrawingProperties,
  DrawingProperties,
} from '../DrawingProperties/DrawingProperties';
import { Point, Rect } from '../Geometry';
import { Shape } from '../Shapes/Shape';

export interface Drawing {
  properties: DrawingProperties;
  bufferCtx: CanvasRenderingContext2D;
  update(p: Point): ChangableDrawingProperties | null;
  render(
    canvasRect: Rect,
    ctx: CanvasRenderingContext2D,
    bufferCtx: CanvasRenderingContext2D
  ): void;
  toShape(): Shape;
}
