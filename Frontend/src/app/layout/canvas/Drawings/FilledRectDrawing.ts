import { ChangableDrawingProperties } from '../DrawingProperties/DrawingProperties';
import { DrawingPropertyName } from '../DrawingProperties/DrawingPropertyName';
import { FilledRectDrawingProperties } from '../DrawingProperties/FilledRectDrawingProperties';
import { Point } from '../Geometry';
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
import { FilledRectShape } from '../Shapes/FilledRectShape';
import { Shape } from '../Shapes/Shape';
import { FilledRectStyle } from '../ShapeStyles/FilledRectStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Drawing } from './Drawing';

export class FilledRectDrawing implements Drawing {
  constructor(public properties: FilledRectDrawingProperties) {}

  get p0() {
    return this.properties[DrawingPropertyName.p0];
  }

  get p1() {
    return this.properties[DrawingPropertyName.p1];
  }

  get style(): FilledRectStyle {
    return this.properties[DrawingPropertyName.style];
  }

  path(): Path2D {
    const path = new Path2D();
    path.rect(
      this.p0[0],
      this.p0[1],
      this.p1[0] - this.p0[0],
      this.p1[1] - this.p0[1]
    );
    return path;
  }

  toShape(ctx: CanvasRenderingContext2D): Shape {
    return new FilledRectShape(
      {
        [ShapePropertyName.id]: crypto.randomUUID(),
        [ShapePropertyName.style]: this.style,
        [ShapePropertyName.originX]: Math.min(this.p0[0], this.p1[0]),
        [ShapePropertyName.originY]: Math.min(this.p0[1], this.p1[1]),
        [ShapePropertyName.originalWidth]: Math.abs(this.p1[0] - this.p0[0]),
        [ShapePropertyName.originalHeight]: Math.abs(this.p1[1] - this.p0[1]),
        [ShapePropertyName.edited]: false,
        [ShapePropertyName.selected]: false,
      },
      ctx
    );
  }

  update(
    p: Point
  ): Required<Pick<ChangableDrawingProperties, DrawingPropertyName.p1>> {
    this.p1[0] = p[0];
    this.p1[1] = p[1];
    return {
      [DrawingPropertyName.p1]: [this.p1[0], this.p1[1]],
    };
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle =
      this.style[StyleName.Color] +
      this.style[StyleName.Opacity].toString(16).padStart(2, '0');
    ctx.fill(this.path());
  }
}
