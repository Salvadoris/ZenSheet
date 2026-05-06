import { ChangedShapeProperties } from '../Actions/ChangeShapesPropertiesAction';
import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { Point, Rect } from '../Geometry';
import { ChangableSerializedShapeProperties } from '../ShapeProperties/ShapeProperties';
import { Shape } from '../Shapes/Shape';
import { ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';

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
  StraightLineFirstPoint,
  StraightLineLastPoint,
}

export class SelectedShape {
  shape!: Shape;
  lineWidth = 2;
  frameWidth = 10;
  color = '#4040ff';
  dragged = false;
  originFromCursor: Point = [0, 0];
  resized = Resize.None;
  offsetRect!: Rect;

  constructor(shape: Shape) {
    this.shape = shape;
    this.offsetRect = this.shape.offsetRect();
  }

  setStyleProperty(
    styleProperty: ShapeStyleProperty
  ): ChangableSerializedShapeProperties {
    const properties = this.shape.setStyleProperty(styleProperty);
    this.updateOffsetRect();
    return properties;
  }

  updateOffsetRect() {
    this.offsetRect = this.shape.offsetRect();
  }

  render(canvasScale: number, selectFrameCtx: CanvasRenderingContext2D): void {
    this.frameWidth = 10 / canvasScale;
    this.drawMarkedLine(selectFrameCtx, canvasScale);
  }

  moveTo(newOrigin: Point): ChangedShapeProperties[] {
    const properties: ChangableSerializedShapeProperties = {};
    if (this.shape.originX !== newOrigin[0]) {
      this.shape.originX = newOrigin[0];
      properties[FormPropertyName.originX] = this.shape.originX;
    }
    if (this.shape.originY !== newOrigin[1]) {
      this.shape.originY = newOrigin[1];
      properties[FormPropertyName.originY] = this.shape.originY;
    }
    if (Object.keys(properties).length > 0) {
      this.updateOffsetRect();
      return [
        {
          id: this.shape.properties[FormPropertyName.id],
          properties: properties,
        },
      ];
    }
    return [];
  }

  resize(p: Point): ChangedShapeProperties[] {
    let properties: ChangableSerializedShapeProperties = {};
    switch (this.resized) {
      case Resize.Top:
        properties = this.shape.resizeTop(p[1]);
        break;
      case Resize.Bottom:
        properties = this.shape.resizeBottom(p[1]);
        break;
      case Resize.Left:
        properties = this.shape.resizeLeft(p[0]);
        break;
      case Resize.Right:
        properties = this.shape.resizeRight(p[0]);
        break;
      case Resize.TopLeft:
        properties = {
          ...this.shape.resizeLeft(p[0], false),
          ...this.shape.resizeTop(p[1]),
        };
        break;
      case Resize.TopRight:
        properties = {
          ...this.shape.resizeRight(p[0], false),
          ...this.shape.resizeTop(p[1]),
        };
        break;
      case Resize.BottomLeft:
        properties = {
          ...this.shape.resizeLeft(p[0], false),
          ...this.shape.resizeBottom(p[1]),
        };
        break;
      case Resize.BottomRight:
        properties = {
          ...this.shape.resizeRight(p[0], false),
          ...this.shape.resizeBottom(p[1]),
        };
        break;
    }
    if (Object.keys(properties).length > 0) {
      this.updateOffsetRect();
      return [
        {
          id: this.shape.properties[FormPropertyName.id],
          properties: properties,
        },
      ];
    }
    return [];
  }

  path() {
    return this.shape.offsetPath();
  }

  pointInside(ctx: CanvasRenderingContext2D, x: number, y: number): boolean {
    return ctx.isPointInPath(this.path(), x, y);
  }

  pointOnTopLine(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.lineWidth = this.frameWidth;
    const path = new Path2D();
    path.moveTo(
      this.shape.horizontalInverted ? this.offsetRect[2] : this.offsetRect[0],
      this.shape.verticallyInverted ? this.offsetRect[3] : this.offsetRect[1]
    );
    path.lineTo(
      this.shape.horizontalInverted ? this.offsetRect[0] : this.offsetRect[2],
      this.shape.verticallyInverted ? this.offsetRect[3] : this.offsetRect[1]
    );
    return ctx.isPointInStroke(path, x, y);
  }

  pointOnBottomLine(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.lineWidth = this.frameWidth;
    const path = new Path2D();
    path.moveTo(
      this.shape.horizontalInverted ? this.offsetRect[2] : this.offsetRect[0],
      this.shape.verticallyInverted ? this.offsetRect[1] : this.offsetRect[3]
    );
    path.lineTo(
      this.shape.horizontalInverted ? this.offsetRect[0] : this.offsetRect[2],
      this.shape.verticallyInverted ? this.offsetRect[1] : this.offsetRect[3]
    );
    return ctx.isPointInStroke(path, x, y);
  }

  pointOnLeftLine(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.lineWidth = this.frameWidth;
    const path = new Path2D();
    path.moveTo(
      this.shape.horizontalInverted ? this.offsetRect[2] : this.offsetRect[0],
      this.shape.verticallyInverted ? this.offsetRect[3] : this.offsetRect[1]
    );
    path.lineTo(
      this.shape.horizontalInverted ? this.offsetRect[2] : this.offsetRect[0],
      this.shape.verticallyInverted ? this.offsetRect[1] : this.offsetRect[3]
    );
    return ctx.isPointInStroke(path, x, y);
  }

  pointOnRightLine(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.lineWidth = this.frameWidth;
    const path = new Path2D();
    path.moveTo(
      this.shape.horizontalInverted ? this.offsetRect[0] : this.offsetRect[2],
      this.shape.verticallyInverted ? this.offsetRect[3] : this.offsetRect[1]
    );
    path.lineTo(
      this.shape.horizontalInverted ? this.offsetRect[0] : this.offsetRect[2],
      this.shape.verticallyInverted ? this.offsetRect[1] : this.offsetRect[3]
    );
    return ctx.isPointInStroke(path, x, y);
  }

  pointOnTopLeftCorner(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const path = new Path2D();
    path.rect(
      (this.shape.horizontalInverted
        ? this.offsetRect[2]
        : this.offsetRect[0]) -
        this.frameWidth / 2,
      (this.shape.verticallyInverted
        ? this.offsetRect[3]
        : this.offsetRect[1]) -
        this.frameWidth / 2,
      this.frameWidth,
      this.frameWidth
    );
    return ctx.isPointInPath(path, x, y);
  }

  pointOnTopRightCorner(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const path = new Path2D();
    path.rect(
      (this.shape.horizontalInverted
        ? this.offsetRect[0]
        : this.offsetRect[2]) -
        this.frameWidth / 2,
      (this.shape.verticallyInverted
        ? this.offsetRect[3]
        : this.offsetRect[1]) -
        this.frameWidth / 2,
      this.frameWidth,
      this.frameWidth
    );
    return ctx.isPointInPath(path, x, y);
  }

  pointOnBottomLeftCorner(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const path = new Path2D();
    path.rect(
      (this.shape.horizontalInverted
        ? this.offsetRect[2]
        : this.offsetRect[0]) -
        this.frameWidth / 2,
      (this.shape.verticallyInverted
        ? this.offsetRect[1]
        : this.offsetRect[3]) -
        this.frameWidth / 2,
      this.frameWidth,
      this.frameWidth
    );
    return ctx.isPointInPath(path, x, y);
  }

  pointOnBottomRightCorner(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ) {
    const path = new Path2D();
    path.rect(
      (this.shape.horizontalInverted
        ? this.offsetRect[0]
        : this.offsetRect[2]) -
        this.frameWidth / 2,
      (this.shape.verticallyInverted
        ? this.offsetRect[1]
        : this.offsetRect[3]) -
        this.frameWidth / 2,
      this.frameWidth,
      this.frameWidth
    );
    return ctx.isPointInPath(path, x, y);
  }

  drawMarkedLine(ctx: CanvasRenderingContext2D, canvasScale: number) {
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth / canvasScale;

    ctx.moveTo(this.offsetRect[0], this.offsetRect[1]);
    ctx.lineTo(this.offsetRect[2], this.offsetRect[1]);
    ctx.lineTo(this.offsetRect[2], this.offsetRect[3]);
    ctx.lineTo(this.offsetRect[0], this.offsetRect[3]);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = 'white';
    for (const point of [
      [this.offsetRect[0], this.offsetRect[1]],
      [this.offsetRect[2], this.offsetRect[1]],
      [this.offsetRect[2], this.offsetRect[3]],
      [this.offsetRect[0], this.offsetRect[3]],
    ] as Point[]) {
      const path = new Path2D();
      path.roundRect(
        point[0] - this.frameWidth / 2,
        point[1] - this.frameWidth / 2,
        this.frameWidth,
        this.frameWidth,
        [this.frameWidth / 4]
      );
      ctx.fill(path);
      ctx.stroke(path);
    }
  }
}
