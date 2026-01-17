import { ChangableDrawingProperties } from '../DrawingProperties/DrawingProperties';
import { DrawingPropertyName } from '../DrawingProperties/DrawingPropertyName';
import { StrokedRectDrawingProperties } from '../DrawingProperties/StrokedRectDrawingProperties';
import { Point } from '../Geometry';
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
import { Shape } from '../Shapes/Shape';
import { StrokedRectShape } from '../Shapes/StrokedRectShape';
import { StrokedRectStyle } from '../ShapeStyles/StrokedRectStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Drawing } from './Drawing';

export class StrokedRectDrawing implements Drawing {
  constructor(public properties: StrokedRectDrawingProperties) {}

  get p0() {
    return this.properties[DrawingPropertyName.p0];
  }

  get p1() {
    return this.properties[DrawingPropertyName.p1];
  }

  get style(): StrokedRectStyle {
    return this.properties[DrawingPropertyName.style];
  }

  path(): Path2D {
    const horizontalInverted = this.p1[0] < this.p0[0];
    const verticallyInverted = this.p1[1] < this.p0[1];
    const path = new Path2D();
    const lineWidth = this.style[StyleName.LineWidth];
    path.rect(
      horizontalInverted
        ? this.p0[0] - lineWidth / 2
        : this.p0[0] + lineWidth / 2,
      verticallyInverted
        ? this.p0[1] - lineWidth / 2
        : this.p0[1] + lineWidth / 2,
      horizontalInverted
        ? this.p1[0] - this.p0[0] + lineWidth
        : this.p1[0] - this.p0[0] - lineWidth,
      verticallyInverted
        ? this.p1[1] - this.p0[1] + lineWidth
        : this.p1[1] - this.p0[1] - lineWidth
    );
    return path;
  }

  toShape(ctx: CanvasRenderingContext2D): Shape {
    return new StrokedRectShape(
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
    ctx.lineWidth = this.style[StyleName.LineWidth];
    ctx.lineCap = this.style[StyleName.LineCap];
    ctx.strokeStyle =
      this.style[StyleName.Color] +
      this.style[StyleName.Opacity].toString(16).padStart(2, '0');
    ctx.stroke(this.path());
  }
}
