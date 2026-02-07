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
  constructor(
    public properties: LineDrawingProperties,
    public bufferCtx: CanvasRenderingContext2D
  ) {}

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
  ): Required<
    Pick<ChangableDrawingProperties, DrawingPropertyName.points>
  > | null {
    const lastPoint = this.points[this.points.length - 1];
    const dx = p[0] - lastPoint[0];
    const dy = p[1] - lastPoint[1];
    const distanceSq = dx * dx + dy * dy;

    // 0.25 pixel distance squared
    if (distanceSq < 0.25) {
      return null;
    }

    this.points.push([p[0], p[1]]);
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
    this.bufferCtx.stroke(this.path());
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

export function simplifyLine(points: Point[], epsilon: number): LinePoints {
  if (points.length <= 2) return points as LinePoints;

  let maxDistance = 0;
  let index = 0;

  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], start, end);
    if (distance > maxDistance) {
      index = i;
      maxDistance = distance;
    }
  }

  if (maxDistance > epsilon) {
    const left = simplifyLine(points.slice(0, index + 1), epsilon);
    const right = simplifyLine(points.slice(index), epsilon);
    return [...left.slice(0, left.length - 1), ...right] as LinePoints;
  } else {
    return [start, end] as LinePoints;
  }
}

function perpendicularDistance(p: Point, p1: Point, p2: Point): number {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const mag = Math.sqrt(dx * dx + dy * dy);

  if (mag === 0) {
    return Math.sqrt((p[0] - p1[0]) ** 2 + (p[1] - p1[1]) ** 2);
  }

  return Math.abs(dy * p[0] - dx * p[1] + p2[0] * p1[1] - p2[1] * p1[0]) / mag;
}
