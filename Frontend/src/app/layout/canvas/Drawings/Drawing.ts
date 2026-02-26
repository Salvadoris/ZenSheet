import {
    ChangableDrawingProperties,
    DrawingProperties,
} from '../DrawingProperties/DrawingProperties';
import { Point } from '../Geometry';
import { Shape } from '../Shapes/Shape';

export interface Drawing {
  properties: DrawingProperties;
  update(p: Point): ChangableDrawingProperties | null;
  render(ctx: CanvasRenderingContext2D): void;
  toShape(ctx: CanvasRenderingContext2D): Shape;
}
