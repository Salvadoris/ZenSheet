import { generateUuid } from '../../../utils/uuid';
import { ChangableDrawingProperties } from '../DrawingProperties/DrawingProperties';
import { DrawingPropertyName } from '../DrawingProperties/DrawingPropertyName';
import { EllipseDrawingProperties } from '../DrawingProperties/EllipseDrawingProperties';
import { Point } from '../Geometry';
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
import { EllipseShape } from '../Shapes/EllipseShape';
import { Shape } from '../Shapes/Shape';
import { EllipseStyle } from '../ShapeStyles/EllipseStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Drawing } from './Drawing';

export class EllipseDrawing implements Drawing {
  constructor(public properties: EllipseDrawingProperties) {}

  get p0() {
    return this.properties[DrawingPropertyName.p0];
  }

  get p1() {
    return this.properties[DrawingPropertyName.p1];
  }

  get style(): EllipseStyle {
    return this.properties[DrawingPropertyName.style];
  }

  toShape(ctx: CanvasRenderingContext2D): Shape {
    return new EllipseShape(
      {
        [ShapePropertyName.id]: generateUuid(),
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
    ctx.save();
    const lineWidth = this.style[StyleName.LineWidth];
    const opacity = this.style[StyleName.Opacity].toString(16).padStart(2, '0');
    ctx.lineWidth = lineWidth;

    if (this.style[StyleName.Color].length === 9) {
      ctx.strokeStyle = this.style[StyleName.Color];
    } else {
      ctx.strokeStyle = this.style[StyleName.Color] + opacity;
    }
    if (this.style[StyleName.BackgroundColor].length === 9) {
      ctx.fillStyle = this.style[StyleName.BackgroundColor];
    } else {
      ctx.fillStyle = this.style[StyleName.BackgroundColor] + opacity;
    }

    const centerX = (this.p1[0] + this.p0[0]) / 2;
    const centerY = (this.p1[1] + this.p0[1]) / 2;
    const radiusX = Math.abs(this.p1[0] - this.p0[0]) / 2;
    const radiusY = Math.abs(this.p1[1] - this.p0[1]) / 2;

    const fillpath = new Path2D();
    fillpath.ellipse(
      centerX,
      centerY,
      Math.abs(radiusX - lineWidth),
      Math.abs(radiusY - lineWidth),
      0,
      0,
      2 * Math.PI
    );
    ctx.fill(fillpath);

    const strokePath = new Path2D();
    strokePath.ellipse(
      centerX,
      centerY,
      Math.abs(radiusX - lineWidth / 2),
      Math.abs(radiusY - lineWidth / 2),
      0,
      0,
      2 * Math.PI
    );
    ctx.stroke(strokePath);

    ctx.restore();
  }
}
