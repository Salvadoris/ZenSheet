import { CanvasComponent } from '../canvas.component';
import { DrawingPropertyName } from '../DrawingProperties/DrawingPropertyName';
import { LineDrawing } from '../Drawings/LineDrawing';
import { Point } from '../Geometry';
import { LinePoints } from '../ShapeProperties/LineShapeProperties';
import { LineStyle } from '../ShapeStyles/LineStyle';
import { ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';

import { CanvasToolState } from './CanvasToolState';

export class PenToolState extends CanvasToolState {
  #currentDrawing: LineDrawing | null = null;
  #lastPoint: Point | null = null;

  constructor(canvas: CanvasComponent) {
    super(canvas);
    this.canvas.changeStyle(new LineStyle(this.canvas.style));
    if (this.canvas.selectFrameCtx) {
      this.canvas.changeCursor('default');
    }
  }

  override setStyleProperty(styleProperty: ShapeStyleProperty): void {
    this.canvas.style.updateProperty(styleProperty);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override remove(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onMouseDown(_event: MouseEvent): void {}

  override onPressedMouseMove(_event: MouseEvent): void {
    if (this.canvas.leftmouseDown) {
      if (!this.#currentDrawing) {
        if (
          this.canvas.startCursor[0] !== this.canvas.cursor[0] &&
          this.canvas.startCursor[1] !== this.canvas.cursor[1]
        ) {
          this.#currentDrawing = new LineDrawing(
            {
              [DrawingPropertyName.id]: crypto.randomUUID(),
              [DrawingPropertyName.points]: [
                [this.canvas.startCursor[0], this.canvas.startCursor[1]],
                [this.canvas.cursor[0], this.canvas.cursor[1]],
              ],
              [DrawingPropertyName.style]: new LineStyle(this.canvas.style),
            },
            this.canvas.bufferCtx
          );
          this.canvas.addDrawings([this.#currentDrawing]);
          this.canvas.renderCanvas({ drawingsChanged: true });
          this.#lastPoint = [this.canvas.cursor[0], this.canvas.cursor[1]];
        }
      } else if (this.#lastPoint) {
        const distanceSq = Math.hypot(
          this.canvas.cursor[0] - this.#lastPoint[0],
          this.canvas.cursor[1] - this.#lastPoint[1]
        );

        // 0.25 pixel distance squared
        if (distanceSq >= 0.25) {
          const changeProperties = this.#currentDrawing.update(
            this.roundPoint([this.canvas.cursor[0], this.canvas.cursor[1]])
          );
          this.canvas.renderCanvas({ drawingsChanged: true });
          this.canvas.changeDrawingsProperties(
            [this.#currentDrawing.properties[DrawingPropertyName.id]],
            changeProperties
          );
          this.#lastPoint = [this.canvas.cursor[0], this.canvas.cursor[1]];
        }
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onHoveringMouseMove(_event: MouseEvent): void {}

  override onMouseUp(_event: MouseEvent): void {
    if (this.canvas.leftmouseDown) {
      if (this.#currentDrawing) {
        if (
          this.canvas.smoothLine &&
          this.#currentDrawing instanceof LineDrawing
        ) {
          const screenPoints = this.pointsToScreen(this.#currentDrawing.points);
          const smoothedPoints = this.smoothLine(screenPoints);
          const canvasPoints = this.pointsToCanvas(smoothedPoints);
          const roundedPoints = this.roundPoints(canvasPoints);
          this.#currentDrawing.points = this.simplifyLine(roundedPoints, 0.3);
        }
        this.canvas.drawingToShape(this.#currentDrawing);
        this.#currentDrawing = null;
        this.canvas.renderCanvas({
          drawingsChanged: true,
          shapesChanged: true,
        });
      }
      this.#lastPoint = null;
    }
  }

  private pointsToScreen(canvasPoints: Point[]) {
    return canvasPoints.map((p): Point => {
      return [
        p[0] * this.canvas.scale + this.canvas.origin[0],
        p[1] * this.canvas.scale + this.canvas.origin[1],
      ];
    });
  }

  private pointsToCanvas(screenPoints: Point[]) {
    return screenPoints.map((point): Point => {
      return [
        (point[0] - this.canvas.origin[0]) / this.canvas.scale,
        (point[1] - this.canvas.origin[1]) / this.canvas.scale,
      ];
    });
  }

  private roundPoints(points: Point[]): Point[] {
    return points.map(p => this.roundPoint(p));
  }

  private roundPoint(point: Point): Point {
    return [Math.round(point[0] * 10) / 10, Math.round(point[1] * 10) / 10];
  }

  private smoothLine(points: Point[], windowSize = 4, maxDist = 6): Point[] {
    if (points.length < 2 * windowSize + 1) return points;

    const result: Point[] = [points[0]];

    for (let i = 1; i < points.length - 1; i++) {
      let sumX = 0,
        sumY = 0,
        weightSum = 0;

      for (
        let j = Math.max(0, i - windowSize);
        j <= Math.min(points.length - 1, i + windowSize);
        j++
      ) {
        const dist = Math.hypot(
          points[i][0] - points[j][0],
          points[i][1] - points[j][1]
        );

        const weight = Math.max(0, 1 - dist / maxDist);
        if (weight <= 0) continue;

        sumX += points[j][0] * weight;
        sumY += points[j][1] * weight;
        weightSum += weight;
      }

      result.push(
        weightSum > 0 ? [sumX / weightSum, sumY / weightSum] : points[i]
      );
    }
    result.push(points[points.length - 1]);
    return result;
  }

  private simplifyLine(points: Point[], epsilon: number): LinePoints {
    if (points.length <= 2) return points as LinePoints;

    let maxDistance = 0;
    let index = 0;

    const start = points[0];
    const end = points[points.length - 1];

    for (let i = 1; i < points.length - 1; i++) {
      const distance = this.perpendicularDistance(points[i], start, end);
      if (distance > maxDistance) {
        index = i;
        maxDistance = distance;
      }
    }

    if (maxDistance > epsilon) {
      const left = this.simplifyLine(points.slice(0, index + 1), epsilon);
      const right = this.simplifyLine(points.slice(index), epsilon);
      return [...left.slice(0, left.length - 1), ...right] as LinePoints;
    } else {
      return [start, end] as LinePoints;
    }
  }

  private perpendicularDistance(p: Point, p1: Point, p2: Point): number {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const mag = Math.sqrt(dx * dx + dy * dy);

    if (mag === 0) {
      return Math.sqrt((p[0] - p1[0]) ** 2 + (p[1] - p1[1]) ** 2);
    }

    return (
      Math.abs(dy * p[0] - dx * p[1] + p2[0] * p1[1] - p2[1] * p1[0]) / mag
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onKeyPress(_event: KeyboardEvent): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onKeyDown(_event: KeyboardEvent): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onDoubleClick(_event: MouseEvent): void {}
}
