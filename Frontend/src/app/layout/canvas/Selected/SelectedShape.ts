import { Point, Rect } from '../Geometry';
import { Shape } from '../Shapes/Shape';

export enum Resize {
  None,
  Top,
  Bottom,
  Left,
  Right,
  TopLeft,
  TopRight,
  BottomLeft,
  BottomRight,
}

export class SelectedShape {
  shape!: Shape;
  topLine!: Path2D;
  bottomLine!: Path2D;
  leftLine!: Path2D;
  rightLine!: Path2D;
  topLeftCorner!: Path2D;
  topRightCorner!: Path2D;
  bottomLeftCorner!: Path2D;
  bottomRightCorner!: Path2D;
  lineWidth = 6;
  hoverLineWidth = 12;
  color = '#00f8';
  dragged = false;
  resized = Resize.None;

  constructor(shape: Shape) {
    this.shape = shape;
  }

  render(
    ctx: CanvasRenderingContext2D,
    canvasScale: number,
    canvasRect: Rect
  ): void {
    this.shape.render(ctx, canvasRect);
    ctx.fillStyle = 'transparent';
    this.setHoverLines(canvasScale);
    ctx.fill(this.topLine);
    ctx.fill(this.bottomLine);
    ctx.fill(this.leftLine);
    ctx.fill(this.rightLine);
    ctx.fill(this.topLeftCorner);
    ctx.fill(this.topRightCorner);
    ctx.fill(this.bottomLeftCorner);
    ctx.fill(this.bottomRightCorner);

    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;
    ctx.lineWidth = this.lineWidth / canvasScale;
    ctx.lineCap = 'square';
    ctx.stroke(this.markedLine(ctx.lineWidth));
  }

  move(dx: number, dy: number): void {
    this.shape.move(dx, dy);
  }

  resize(p: Point) {
    switch (this.resized) {
      case Resize.Top:
        this.shape.resizeTop(p[1]);
        break;
      case Resize.Bottom:
        this.shape.resizeBottom(p[1]);
        break;
      case Resize.Left:
        this.shape.resizeLeft(p[0]);
        break;
      case Resize.Right:
        this.shape.resizeRight(p[0]);
        break;
      case Resize.TopLeft:
        this.shape.resizeTop(p[1]);
        this.shape.resizeLeft(p[0]);
        break;
      case Resize.TopRight:
        this.shape.resizeTop(p[1]);
        this.shape.resizeRight(p[0]);
        break;
      case Resize.BottomLeft:
        this.shape.resizeBottom(p[1]);
        this.shape.resizeLeft(p[0]);
        break;
      case Resize.BottomRight:
        this.shape.resizeBottom(p[1]);
        this.shape.resizeRight(p[0]);
        break;
    }
  }

  path() {
    const path = new Path2D();
    path.rect(
      this.shape.originX,
      this.shape.originY,
      this.shape.width,
      this.shape.height
    );
    return path;
  }

  pointInside(ctx: CanvasRenderingContext2D, x: number, y: number): boolean {
    return ctx.isPointInPath(this.path(), x, y);
  }
  pointOnTopLine(ctx: CanvasRenderingContext2D, x: number, y: number) {
    return ctx.isPointInPath(this.topLine, x, y);
  }
  pointOnBottomLine(ctx: CanvasRenderingContext2D, x: number, y: number) {
    return ctx.isPointInPath(this.bottomLine, x, y);
  }
  pointOnLeftLine(ctx: CanvasRenderingContext2D, x: number, y: number) {
    return ctx.isPointInPath(this.leftLine, x, y);
  }
  pointOnRightLine(ctx: CanvasRenderingContext2D, x: number, y: number) {
    return ctx.isPointInPath(this.rightLine, x, y);
  }
  pointOnTopLeftCorner(ctx: CanvasRenderingContext2D, x: number, y: number) {
    return ctx.isPointInPath(this.topLeftCorner, x, y);
  }
  pointOnTopRightCorner(ctx: CanvasRenderingContext2D, x: number, y: number) {
    return ctx.isPointInPath(this.topRightCorner, x, y);
  }
  pointOnBottomLeftCorner(ctx: CanvasRenderingContext2D, x: number, y: number) {
    return ctx.isPointInPath(this.bottomLeftCorner, x, y);
  }
  pointOnBottomRightCorner(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ) {
    return ctx.isPointInPath(this.bottomRightCorner, x, y);
  }

  setHoverLines(canvasScale: number) {
    const lineWidth = this.hoverLineWidth / canvasScale;
    this.topLine = new Path2D();
    this.topLine.rect(
      this.shape.originX,
      this.shape.originY,
      this.shape.width,
      this.shape.verticallyInverted ? lineWidth : -lineWidth
    );
    this.bottomLine = new Path2D();
    this.bottomLine.rect(
      this.shape.originX,
      this.shape.originY + this.shape.height,
      this.shape.width,
      this.shape.verticallyInverted ? -lineWidth : lineWidth
    );
    this.leftLine = new Path2D();
    this.leftLine.rect(
      this.shape.originX,
      this.shape.originY,
      this.shape.horizontalInverted ? lineWidth : -lineWidth,
      this.shape.height
    );
    this.rightLine = new Path2D();
    this.rightLine.rect(
      this.shape.originX + this.shape.width,
      this.shape.originY,
      this.shape.horizontalInverted ? -lineWidth : lineWidth,
      this.shape.height
    );
    this.topLeftCorner = new Path2D();
    this.topLeftCorner.rect(
      this.shape.originX,
      this.shape.originY,
      this.shape.horizontalInverted ? lineWidth : -lineWidth,
      this.shape.verticallyInverted ? lineWidth : -lineWidth
    );
    this.topRightCorner = new Path2D();
    this.topRightCorner.rect(
      this.shape.originX + this.shape.width,
      this.shape.originY,
      this.shape.horizontalInverted ? -lineWidth : lineWidth,
      this.shape.verticallyInverted ? lineWidth : -lineWidth
    );
    this.bottomLeftCorner = new Path2D();
    this.bottomLeftCorner.rect(
      this.shape.originX,
      this.shape.originY + this.shape.height,
      this.shape.horizontalInverted ? lineWidth : -lineWidth,
      this.shape.verticallyInverted ? -lineWidth : lineWidth
    );
    this.bottomRightCorner = new Path2D();
    this.bottomRightCorner.rect(
      this.shape.originX + this.shape.width,
      this.shape.originY + this.shape.height,
      this.shape.horizontalInverted ? -lineWidth : lineWidth,
      this.shape.verticallyInverted ? -lineWidth : lineWidth
    );
  }

  markedLine(lineWidth: number): Path2D {
    const halfLineWidth = lineWidth / 2;
    const path = new Path2D();
    const xMin = this.shape.horizontalInverted
      ? this.shape.originX + halfLineWidth
      : this.shape.originX - halfLineWidth;
    const yMin = this.shape.verticallyInverted
      ? this.shape.originY + halfLineWidth
      : this.shape.originY - halfLineWidth;
    const xMax = this.shape.horizontalInverted
      ? this.shape.originX + this.shape.width - halfLineWidth
      : this.shape.originX + this.shape.width + halfLineWidth;
    const yMax = this.shape.verticallyInverted
      ? this.shape.originY + this.shape.height - halfLineWidth
      : this.shape.originY + this.shape.height + halfLineWidth;
    path.moveTo(xMin, yMin);
    path.lineTo(xMax, yMin);
    path.lineTo(xMax, yMax);
    path.lineTo(xMin, yMax);
    path.closePath();
    return path;
  }
}
