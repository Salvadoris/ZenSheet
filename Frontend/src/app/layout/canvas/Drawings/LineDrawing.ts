import { ChangableDrawingProperties } from '../DrawingProperties/DrawingProperties';
import { DrawingPropertyName } from '../DrawingProperties/DrawingPropertyName';
import { LineDrawingProperties } from '../DrawingProperties/LineDrawingProperties';
import { Point } from '../Geometry';
import { LinePoints } from '../ShapeProperties/LineShapeProperties';
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
import { LineShape } from '../Shapes/LineShape';
import { Shape } from '../Shapes/Shape';
import { LineStyle } from '../ShapeStyles/LineStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Drawing } from './Drawing';

export class LineDrawing implements Drawing {
  constructor(public properties: LineDrawingProperties) {}

  get points() {
    return this.properties[DrawingPropertyName.points];
  }

  set points(points: LinePoints) {
    this.properties[DrawingPropertyName.points] = points;
  }

  get style(): LineStyle {
    return this.properties[DrawingPropertyName.style];
  }

  path(): Path2D {
    const path = new Path2D();
    path.moveTo(this.points[0][0], this.points[0][1]);
    for (let i = 1; i < this.points.length; i++) {
      path.lineTo(this.points[i][0], this.points[i][1]);
    }
    return path;
  }

  toShape(ctx: CanvasRenderingContext2D): Shape {
    return new LineShape(
      {
        [ShapePropertyName.id]: crypto.randomUUID(),
        [ShapePropertyName.style]: this.style,
        [ShapePropertyName.points]: this.points,
        [ShapePropertyName.edited]: false,
        [ShapePropertyName.selected]: false,
      },
      ctx
    );
  }

  update(
    p: Point
  ): Required<Pick<ChangableDrawingProperties, DrawingPropertyName.points>> {
    this.points.push([p[0], p[1]]);
    return {
      [DrawingPropertyName.points]: { lastPoint: [p[0], p[1]] },
    };
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.lineWidth = this.style[StyleName.LineWidth];
    ctx.lineCap = this.style[StyleName.LineCap];
    ctx.strokeStyle =
      this.style[StyleName.Color] +
      this.style[StyleName.Opacity].toString(16).padStart(2, '0');
    ctx.lineJoin = 'round';

    ctx.stroke(this.path());
  }
}

export function smoothLine(points: LinePoints, windowSize: number): LinePoints {
  if (points.length <= 2) return [...points]; // Nothing to smooth

  const smoothedPoints: Point[] = [];
  //   smoothedPoints.push(points[0]); // Keep first point

  for (let i = 1; i < points.length - 1; i++) {
    let count = 0;
    let sumX = 0;
    let sumY = 0;

    // Sum points in the window around current point
    for (let j = -windowSize; j <= windowSize; j++) {
      const idx = i + j;
      if (idx > 0 && idx < points.length - 1) {
        // Exclude first/last for averaging
        sumX += points[idx][0];
        sumY += points[idx][1];
        count++;
      }
    }

    smoothedPoints.push([sumX / count, sumY / count]);
  }

  //   smoothedPoints.push(points[points.length - 1]); // Keep last point
  return [points[0], ...smoothedPoints, points[points.length - 1]];
}
