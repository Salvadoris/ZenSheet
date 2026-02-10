import { ChangableDrawingProperties } from '../DrawingProperties/DrawingProperties';
import { DrawingPropertyName } from '../DrawingProperties/DrawingPropertyName';
import { LineDrawingProperties } from '../DrawingProperties/LineDrawingProperties';
import { Point, Rect } from '../Geometry';
import { LinePoints } from '../ShapeProperties/LineShapeProperties';
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
import { LineShape } from '../Shapes/LineShape';
import { Shape } from '../Shapes/Shape';
import { LineStyle } from '../ShapeStyles/LineStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Drawing } from './Drawing';

export class LineDrawing implements Drawing {
  #path = new Path2D();

  constructor(
    public properties: LineDrawingProperties,
    public bufferCtx: CanvasRenderingContext2D
  ) {
    this.#path.moveTo(this.points[0][0], this.points[0][1]);
    for (let i = 1; i < this.points.length; i++) {
      this.#path.lineTo(this.points[i][0], this.points[i][1]);
    }
  }

  get points() {
    return this.properties[DrawingPropertyName.points];
  }

  set points(points: LinePoints) {
    this.properties[DrawingPropertyName.points] = points;
  }

  get style(): LineStyle {
    return this.properties[DrawingPropertyName.style];
  }

  toShape(): Shape {
    return new LineShape(
      {
        [ShapePropertyName.id]: crypto.randomUUID(),
        [ShapePropertyName.style]: this.style,
        [ShapePropertyName.points]: this.points,
        [ShapePropertyName.edited]: false,
        [ShapePropertyName.selected]: false,
      },
      this.bufferCtx
    );
  }

  update(
    p: Point
  ): Required<Pick<ChangableDrawingProperties, DrawingPropertyName.points>> {
    this.points.push([p[0], p[1]]);
    this.#path.lineTo(p[0], p[1]);
    return {
      [DrawingPropertyName.points]: { lastPoint: [p[0], p[1]] },
    };
  }

  render(canvasRect: Rect, ctx: CanvasRenderingContext2D): void {
    this.bufferCtx.save();
    this.bufferCtx.lineWidth = this.style[StyleName.LineWidth];
    this.bufferCtx.lineCap = this.style[StyleName.LineCap];
    this.bufferCtx.strokeStyle = this.style[StyleName.Color];
    this.bufferCtx.lineJoin = 'round';
    this.bufferCtx.stroke(this.#path);
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
