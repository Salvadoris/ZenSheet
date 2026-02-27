import { Point } from '../Geometry';
import { Shape } from '../Shapes/Shape';

export class SelectRect {
  private fillColor = '#00f2';
  private strokeColor = '#00f8';
  private lineWidth = 4;
  private shapeLineWidth = 2;

  constructor(
    public p0: Point,
    public p1: Point
  ) {}

  update(x: number, y: number) {
    this.p1[0] = x;
    this.p1[1] = y;
  }

  render(ctx: CanvasRenderingContext2D, canvasScale: number) {
    ctx.fillStyle = this.fillColor;
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.lineWidth / canvasScale;
    ctx.lineCap = 'square';
    const horizontalInverted = this.p1[0] < this.p0[0];
    const verticallyInverted = this.p1[1] < this.p0[1];

    const halfLineWidth = ctx.lineWidth / 2;
    const path = new Path2D();
    const xMin = horizontalInverted
      ? this.p0[0] - halfLineWidth
      : this.p0[0] + halfLineWidth;
    const yMin = verticallyInverted
      ? this.p0[1] - halfLineWidth
      : this.p0[1] + halfLineWidth;
    const xMax = horizontalInverted
      ? this.p1[0] + halfLineWidth
      : this.p1[0] - halfLineWidth;
    const yMax = verticallyInverted
      ? this.p1[1] + halfLineWidth
      : this.p1[1] - halfLineWidth;
    path.moveTo(xMin, yMin);
    path.lineTo(xMax, yMin);
    path.lineTo(xMax, yMax);
    path.lineTo(xMin, yMax);
    path.closePath();
    ctx.stroke(path);

    ctx.fillRect(
      horizontalInverted
        ? this.p0[0] - halfLineWidth
        : this.p0[0] + halfLineWidth,
      verticallyInverted
        ? this.p0[1] - halfLineWidth
        : this.p0[1] + halfLineWidth,
      horizontalInverted
        ? this.p1[0] - this.p0[0] + ctx.lineWidth
        : this.p1[0] - this.p0[0] - ctx.lineWidth,
      verticallyInverted
        ? this.p1[1] - this.p0[1] + ctx.lineWidth
        : this.p1[1] - this.p0[1] - ctx.lineWidth
    );
  }

  renderShapeOutlines(
    ctx: CanvasRenderingContext2D,
    canvasScale: number,
    shapes: Shape[]
  ) {
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.shapeLineWidth / canvasScale;
    ctx.lineCap = 'square';
    if (shapes.length === 1) {
      const rect = shapes[0].offsetRect();
      ctx.strokeRect(rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1]);
      return;
    }

    const rects = shapes.map(s => s.offsetRect());
    for (const rect of rects) {
      ctx.strokeRect(rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1]);
    }
    const xMin = Math.min(...rects.map(r => r[0]));
    const yMin = Math.min(...rects.map(r => r[1]));
    const xMax = Math.max(...rects.map(r => r[2]));
    const yMax = Math.max(...rects.map(r => r[3]));

    ctx.lineWidth = 2 / canvasScale;
    ctx.setLineDash([ctx.lineWidth * 6, ctx.lineWidth * 3]);
    ctx.strokeRect(xMin, yMin, xMax - xMin, yMax - yMin);
  }
}
