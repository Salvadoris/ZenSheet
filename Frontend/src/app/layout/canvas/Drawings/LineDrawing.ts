import { Point } from '../Geometry';
import { LinePoints, LineShape } from '../Shapes/LineShape';
import { Shape } from '../Shapes/Shape';
import { LineStyle } from '../ShapeStyles/LineStyle';

import { Drawing } from './Drawing';

export class LineDrawing implements Drawing {
  constructor(
    public points: LinePoints,
    public style: LineStyle
  ) {}

  path(): Path2D {
    const path = new Path2D();
    path.moveTo(this.points[0][0], this.points[0][1]);
    for (let i = 1; i < this.points.length; i++) {
      path.lineTo(this.points[i][0], this.points[i][1]);
    }
    return path;
  }

  toShape(): Shape {
    return new LineShape(this.points, this.style);
  }

  update(p: Point): void {
    this.points.push([p[0], p[1]]);
  }
  render(ctx: CanvasRenderingContext2D): void {
    ctx.lineWidth = this.style.width;
    ctx.lineCap = this.style.cap;
    ctx.strokeStyle = this.style.color;
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
