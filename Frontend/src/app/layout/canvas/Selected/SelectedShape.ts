import { Point, Rect } from '../Geometry';
import {
  BaseSerializedShapeProperties,
  ChangableBaseSerializedShapeProperties,
} from '../ShapeProperties/ShapeProperties';
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
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

type MoveProperties = Partial<
  Pick<
    BaseSerializedShapeProperties,
    ShapePropertyName.originX | ShapePropertyName.originY
  >
>;

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
  originFromCursor: Point = [0, 0];
  resized = Resize.None;

  constructor(shape: Shape) {
    this.shape = shape;
  }

  render(
    canvasScale: number,
    canvasRect: Rect,
    selectFrameCtx: CanvasRenderingContext2D,
    ctx: CanvasRenderingContext2D
  ): void {
    this.shape.render(canvasRect, ctx);
    selectFrameCtx.fillStyle = 'transparent';
    this.setHoverLines(canvasScale);
    selectFrameCtx.fill(this.topLine);
    selectFrameCtx.fill(this.bottomLine);
    selectFrameCtx.fill(this.leftLine);
    selectFrameCtx.fill(this.rightLine);
    selectFrameCtx.fill(this.topLeftCorner);
    selectFrameCtx.fill(this.topRightCorner);
    selectFrameCtx.fill(this.bottomLeftCorner);
    selectFrameCtx.fill(this.bottomRightCorner);
    selectFrameCtx.strokeStyle = this.color;
    selectFrameCtx.fillStyle = this.color;
    selectFrameCtx.lineWidth = this.lineWidth / canvasScale;
    selectFrameCtx.lineCap = 'square';
    selectFrameCtx.stroke(this.markedLine(selectFrameCtx.lineWidth));
  }

  moveTo(x: number, y: number): MoveProperties {
    this.shape.originX = x + this.originFromCursor[0];
    this.shape.originY = y + this.originFromCursor[1];
    const properties: MoveProperties = {};
    if (x !== 0) {
      properties[ShapePropertyName.originX] = this.shape.originX;
    }
    if (y !== 0) {
      properties[ShapePropertyName.originY] = this.shape.originY;
    }
    return properties;
  }

  resize(p: Point): ChangableBaseSerializedShapeProperties {
    switch (this.resized) {
      case Resize.Top:
        return this.shape.resizeTop(p[1]);
      case Resize.Bottom:
        return this.shape.resizeBottom(p[1]);
      case Resize.Left:
        return this.shape.resizeLeft(p[0]);
      case Resize.Right:
        return this.shape.resizeRight(p[0]);
      case Resize.TopLeft:
        return {
          ...this.shape.resizeLeft(p[0]),
          ...this.shape.resizeTop(p[1]),
        };
      case Resize.TopRight:
        return {
          ...this.shape.resizeRight(p[0]),
          ...this.shape.resizeTop(p[1]),
        };
      case Resize.BottomLeft:
        return {
          ...this.shape.resizeLeft(p[0]),
          ...this.shape.resizeBottom(p[1]),
        };
      case Resize.BottomRight:
        return {
          ...this.shape.resizeRight(p[0]),
          ...this.shape.resizeBottom(p[1]),
        };
    }
    return {};
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
