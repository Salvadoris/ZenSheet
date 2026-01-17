import { ChangableDrawingProperties } from '../DrawingProperties/DrawingProperties';
import { DrawingPropertyName } from '../DrawingProperties/DrawingPropertyName';
import { StraightLineDrawingProperties } from '../DrawingProperties/StraightLineDrawingProperties';
import { Point } from '../Geometry';
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
import { Shape } from '../Shapes/Shape';
import { StraightLineShape } from '../Shapes/StraightLineShape';
import { StraightLineStyle } from '../ShapeStyles/StraightLineStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Drawing } from './Drawing';

export class StraightLineDrawing implements Drawing {
  constructor(public properties: StraightLineDrawingProperties) {}

  get p0() {
    return this.properties[DrawingPropertyName.p0];
  }

  get p1() {
    return this.properties[DrawingPropertyName.p1];
  }

  get style(): StraightLineStyle {
    return this.properties[DrawingPropertyName.style];
  }

  path(): Path2D {
    const path = new Path2D();
    path.moveTo(this.p0[0], this.p0[1]);
    path.lineTo(this.p1[0], this.p1[1]);
    return path;
  }

  toShape(ctx: CanvasRenderingContext2D): Shape {
    const horizontalInverted = this.p1[0] < this.p0[0];
    const verticallyInverted = this.p1[1] < this.p0[1];
    return new StraightLineShape(
      {
        [ShapePropertyName.id]: crypto.randomUUID(),
        [ShapePropertyName.style]: this.style,
        [ShapePropertyName.originX]: horizontalInverted
          ? this.p0[0] + this.style[StyleName.LineWidth] / 2
          : this.p0[0] - this.style[StyleName.LineWidth] / 2,
        [ShapePropertyName.originY]: verticallyInverted
          ? this.p0[1] + this.style[StyleName.LineWidth] / 2
          : this.p0[1] - this.style[StyleName.LineWidth] / 2,
        [ShapePropertyName.originalWidth]: horizontalInverted
          ? this.p1[0] - this.p0[0] - this.style[StyleName.LineWidth]
          : this.p1[0] - this.p0[0] + this.style[StyleName.LineWidth],
        [ShapePropertyName.originalHeight]: verticallyInverted
          ? this.p1[1] - this.p0[1] - this.style[StyleName.LineWidth]
          : this.p1[1] - this.p0[1] + this.style[StyleName.LineWidth],
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
    ctx.lineWidth = this.style[StyleName.LineWidth];
    ctx.lineCap = this.style[StyleName.LineCap];
    ctx.strokeStyle =
      this.style[StyleName.Color] +
      this.style[StyleName.Opacity].toString(16).padStart(2, '0');
    ctx.stroke(this.path());
  }
}
