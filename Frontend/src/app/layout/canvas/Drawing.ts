import { Point } from './Point';
import { Shape } from './Shape';

export interface Drawing {
  update(p: Point): void;
  path(): Path2D;
  render(ctx: CanvasRenderingContext2D): void;
  toShape(): Shape;
}
