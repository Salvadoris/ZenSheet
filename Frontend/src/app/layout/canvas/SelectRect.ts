import { Point } from './Point';

export class SelectRect {
  constructor(
    public p0: Point,
    public p1: Point
  ) {}

  render(ctx: CanvasRenderingContext2D, canvasScale: number) {
    ctx.fillStyle = '#00f2';
    ctx.strokeStyle = '#00f8';
    ctx.lineWidth = 4 / canvasScale;
    ctx.lineCap = 'square';
    const horizontalInverted = this.p1[0] < this.p0[0];
    const verticallyInverted = this.p1[1] < this.p0[1];
    ctx.strokeRect(
      this.p0[0],
      this.p0[1],
      this.p1[0] - this.p0[0],
      this.p1[1] - this.p0[1]
    );
    ctx.fillRect(
      horizontalInverted
        ? this.p0[0] - ctx.lineWidth / 2
        : this.p0[0] + ctx.lineWidth / 2,
      verticallyInverted
        ? this.p0[1] - ctx.lineWidth / 2
        : this.p0[1] + ctx.lineWidth / 2,
      horizontalInverted
        ? this.p1[0] - this.p0[0] + ctx.lineWidth
        : this.p1[0] - this.p0[0] - ctx.lineWidth,
      verticallyInverted
        ? this.p1[1] - this.p0[1] + ctx.lineWidth
        : this.p1[1] - this.p0[1] - ctx.lineWidth
    );
  }
}
