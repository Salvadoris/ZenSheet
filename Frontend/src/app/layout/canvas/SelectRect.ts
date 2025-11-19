import { Point } from './Point';
import { Shape } from './Shape';

export class SelectRect {
  private fillColor = '#00f2';
  private strokeColor = '#00f8';
  private lineWidth = 4;
  private shapeLineWidth = 2;

  constructor(
    public p0: Point,
    public p1: Point
  ) {}

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
    for (const shape of shapes) {
      ctx.strokeRect(shape.originX, shape.originY, shape.width, shape.height);
    }
    if (shapes.length > 1) {
      const minX = Math.min(
        ...shapes.map(s =>
          s.horizontalInverted ? s.originX + s.width : s.originX
        )
      );
      const minY = Math.min(
        ...shapes.map(s =>
          s.verticallyInverted ? s.originY + s.height : s.originY
        )
      );
      const maxX = Math.max(
        ...shapes.map(s =>
          s.horizontalInverted ? s.originX : s.originX + s.width
        )
      );
      const maxY = Math.max(
        ...shapes.map(s =>
          s.verticallyInverted ? s.originY : s.originY + s.height
        )
      );
      ctx.lineWidth = 2 / canvasScale;
      ctx.setLineDash([ctx.lineWidth * 6, ctx.lineWidth * 3]);
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    }
  }
}
