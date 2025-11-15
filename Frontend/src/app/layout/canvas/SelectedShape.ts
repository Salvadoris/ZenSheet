import { Rect } from './Rect';
import { Shape } from './Shape';

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
  topLine!: Path2D;
  bottomLine!: Path2D;
  leftLine!: Path2D;
  rightLine!: Path2D;
  topLeftCorner!: Path2D;
  topRightCorner!: Path2D;
  bottomLeftCorner!: Path2D;
  bottomRightCorner!: Path2D;
  width = 6;
  color = '#00c8';
  dragged = false;
  resized = Resize.None;
  horizontalInverted = false;
  verticallyInverted = false;

  constructor(public shape: Shape) {}

  setLines(canvasScale: number) {
    const width = this.width / canvasScale;
    this.topLine = new Path2D();
    this.topLine.rect(
      this.shape.originX,
      this.shape.originY,
      this.shape.width,
      this.verticallyInverted ? width : -width
    );
    this.bottomLine = new Path2D();
    this.bottomLine.rect(
      this.shape.originX,
      this.shape.originY + this.shape.height,
      this.shape.width,
      this.verticallyInverted ? -width : width
    );
    this.leftLine = new Path2D();
    this.leftLine.rect(
      this.shape.originX,
      this.shape.originY,
      this.horizontalInverted ? width : -width,
      this.shape.height
    );
    this.rightLine = new Path2D();
    this.rightLine.rect(
      this.shape.originX + this.shape.width,
      this.shape.originY,
      this.horizontalInverted ? -width : width,
      this.shape.height
    );
    this.topLeftCorner = new Path2D();
    this.topLeftCorner.rect(
      this.shape.originX,
      this.shape.originY,
      this.horizontalInverted ? width : -width,
      this.verticallyInverted ? width : -width
    );
    this.topRightCorner = new Path2D();
    this.topRightCorner.rect(
      this.shape.originX + this.shape.width,
      this.shape.originY,
      this.horizontalInverted ? -width : width,
      this.verticallyInverted ? width : -width
    );
    this.bottomLeftCorner = new Path2D();
    this.bottomLeftCorner.rect(
      this.shape.originX,
      this.shape.originY + this.shape.height,
      this.horizontalInverted ? width : -width,
      this.verticallyInverted ? -width : width
    );
    this.bottomRightCorner = new Path2D();
    this.bottomRightCorner.rect(
      this.shape.originX + this.shape.width,
      this.shape.originY + this.shape.height,
      this.horizontalInverted ? -width : width,
      this.verticallyInverted ? -width : width
    );
  }

  render(ctx: CanvasRenderingContext2D, canvasScale: number, canvasRect: Rect) {
    this.horizontalInverted = this.shape.width < 0;
    this.verticallyInverted = this.shape.height < 0;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;
    this.setLines(canvasScale);
    ctx.fill(this.topLine);
    ctx.fill(this.bottomLine);
    ctx.fill(this.leftLine);
    ctx.fill(this.rightLine);
    ctx.fill(this.topLeftCorner);
    ctx.fill(this.topRightCorner);
    ctx.fill(this.bottomLeftCorner);
    ctx.fill(this.bottomRightCorner);
    this.shape.render(ctx, canvasRect);
  }

  move(dx: number, dy: number): void {
    this.shape.move(dx, dy);
  }

  resize(dx: number, dy: number) {
    switch (this.resized) {
      case Resize.Top:
        this.shape.resizeTop(dy);
        break;
      case Resize.Bottom:
        this.shape.resizeBottom(dy);
        break;
      case Resize.Left:
        this.shape.resizeLeft(dx);
        break;
      case Resize.Right:
        this.shape.resizeRight(dx);
        break;
      case Resize.TopLeft:
        this.shape.resizeTop(dy);
        this.shape.resizeLeft(dx);
        break;
      case Resize.TopRight:
        this.shape.resizeTop(dy);
        this.shape.resizeRight(dx);
        break;
      case Resize.BottomLeft:
        this.shape.resizeBottom(dy);
        this.shape.resizeLeft(dx);
        break;
      case Resize.BottomRight:
        this.shape.resizeBottom(dy);
        this.shape.resizeRight(dx);
        break;
    }
  }

  path() {
    let path = new Path2D();
    path.rect(this.shape.originX, this.shape.originY, this.shape.width, this.shape.height);
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
  pointOnBottomRightCorner(ctx: CanvasRenderingContext2D, x: number, y: number) {
    return ctx.isPointInPath(this.bottomRightCorner, x, y);
  }
}
