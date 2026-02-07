import { ChangableDrawingProperties } from '../DrawingProperties/DrawingProperties';
import { DrawingPropertyName } from '../DrawingProperties/DrawingPropertyName';
import { StraightLineDrawingProperties } from '../DrawingProperties/StraightLineDrawingProperties';
import { Point, Rect } from '../Geometry';
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
import { Shape } from '../Shapes/Shape';
import { StraightLineShape } from '../Shapes/StraightLineShape';
import { StraightLineStyle } from '../ShapeStyles/StraightLineStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Drawing } from './Drawing';

export class StraightLineDrawing implements Drawing {
  constructor(
    public properties: StraightLineDrawingProperties,
    public bufferCtx: CanvasRenderingContext2D
  ) {}

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

  toShape(): Shape {
    return new StraightLineShape(
      {
        [ShapePropertyName.id]: crypto.randomUUID(),
        [ShapePropertyName.style]: this.style,
        [ShapePropertyName.originX]: this.p0[0],
        [ShapePropertyName.originY]: this.p0[1],
        [ShapePropertyName.originalWidth]: this.p1[0] - this.p0[0],
        [ShapePropertyName.originalHeight]: this.p1[1] - this.p0[1],
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
    this.bufferCtx.lineCap = this.style[StyleName.LineCap];
    this.bufferCtx.strokeStyle = this.style[StyleName.Color];
    this.bufferCtx.stroke(this.path());

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
