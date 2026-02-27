import { generateUuid } from '../../../utils/uuid';
import { ChangableDrawingProperties } from '../DrawingProperties/DrawingProperties';
import { DrawingPropertyName } from '../DrawingProperties/DrawingPropertyName';
import { EllipseDrawingProperties } from '../DrawingProperties/EllipseDrawingProperties';
import { Point, Rect } from '../Geometry';
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
import { EllipseShape } from '../Shapes/EllipseShape';
import { Shape } from '../Shapes/Shape';
import { EllipseStyle } from '../ShapeStyles/EllipseStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Drawing } from './Drawing';

export class EllipseDrawing implements Drawing {
  constructor(
    public properties: EllipseDrawingProperties,
    public bufferCtx: CanvasRenderingContext2D
  ) {}

  get p0() {
    return this.properties[DrawingPropertyName.p0];
  }

  get p1() {
    return this.properties[DrawingPropertyName.p1];
  }

  get style(): EllipseStyle {
    return this.properties[DrawingPropertyName.style];
  }

  toShape(): Shape {
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
      this.bufferCtx
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

  render(canvasRect: Rect, ctx: CanvasRenderingContext2D): void {
    this.bufferCtx.save();
    this.bufferCtx.lineWidth = this.style[StyleName.LineWidth];
    this.bufferCtx.strokeStyle = this.style[StyleName.Color];
    this.bufferCtx.fillStyle = this.style[StyleName.BackgroundColor];

    const centerX = (this.p1[0] + this.p0[0]) / 2;
    const centerY = (this.p1[1] + this.p0[1]) / 2;
    const radiusX = Math.abs(this.p1[0] - this.p0[0]) / 2;
    const radiusY = Math.abs(this.p1[1] - this.p0[1]) / 2;

    const path = new Path2D();
    path.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);

    this.bufferCtx.fill(path);
    this.bufferCtx.stroke(path);
    this.bufferCtx.restore();

    ctx.save();
    ctx.globalAlpha = this.style[StyleName.Opacity];
    ctx.drawImage(this.bufferCtx.canvas, 0, 0);
    ctx.restore();

    this.bufferCtx.clearRect(
      canvasRect[0],
      canvasRect[1],
      canvasRect[2] - canvasRect[0],
      canvasRect[3] - canvasRect[1]
    );
  }
}
