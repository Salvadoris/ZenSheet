import { Point } from '../Geometry';
import { Shape } from '../Shapes/Shape';

export interface Drawing {
  update(p: Point): void;
  path(): Path2D;
  render(ctx: CanvasRenderingContext2D): void;
  toShape(ctx: CanvasRenderingContext2D): Shape;
}
