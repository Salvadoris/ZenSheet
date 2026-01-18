import { ChangableDrawingProperties } from '../DrawingProperties/DrawingProperties';
import { DrawingPropertyName } from '../DrawingProperties/DrawingPropertyName';
import { RectangleDrawingProperties } from '../DrawingProperties/RectangleDrawingProperties';
import { Point } from '../Geometry';
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
import { RectangleShape } from '../Shapes/RectangleShape';
import { Shape } from '../Shapes/Shape';
import { RectangleStyle } from '../ShapeStyles/RectangleStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Drawing } from './Drawing';

export class RectangleDrawing implements Drawing {
  constructor(public properties: RectangleDrawingProperties) {}

  get p0() {
    return this.properties[DrawingPropertyName.p0];
  }

  get p1() {
    return this.properties[DrawingPropertyName.p1];
  }

  get style(): RectangleStyle {
    return this.properties[DrawingPropertyName.style];
  }

  toShape(ctx: CanvasRenderingContext2D): Shape {
    return new RectangleShape(
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
    ctx.save();
    const horizontalInverted = this.p1[0] < this.p0[0];
    const verticallyInverted = this.p1[1] < this.p0[1];
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

    const outerOffsetX = horizontalInverted ? -lineWidth / 2 : lineWidth / 2;
    const outerOffsetY = verticallyInverted ? -lineWidth / 2 : lineWidth / 2;
    const innerOffsetX = horizontalInverted ? -lineWidth : lineWidth;
    const innerOffsetY = verticallyInverted ? -lineWidth : lineWidth;

    ctx.fillRect(
      this.p0[0] + innerOffsetX,
      this.p0[1] + innerOffsetY,
      this.p1[0] - this.p0[0] - innerOffsetX * 2,
      this.p1[1] - this.p0[1] - innerOffsetY * 2
    );

    const path = new Path2D();
    path.moveTo(this.p0[0] + outerOffsetX, this.p0[1] + outerOffsetY);
    path.lineTo(this.p1[0] - outerOffsetX, this.p0[1] + outerOffsetY);
    path.lineTo(this.p1[0] - outerOffsetX, this.p1[1] - outerOffsetY);
    path.lineTo(this.p0[0] + outerOffsetX, this.p1[1] - outerOffsetY);
    path.closePath();
    ctx.stroke(path);

    ctx.restore();
  }
}
