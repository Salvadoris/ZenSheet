import { ChangedShapeProperties } from '../Actions/ChangeShapesPropertiesAction';
import { Point } from '../Geometry';
import { ChangableSerializedShapeProperties } from '../ShapeProperties/ShapeProperties';
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
import { StraightLineShape } from '../Shapes/StraightLineShape';

import { Resize, SelectedShape } from './SelectedShape';

export class SelectedStraightLineShape extends SelectedShape {
  declare shape: StraightLineShape;

  constructor(shape: StraightLineShape) {
    super(shape);
  }

  override render(
    canvasScale: number,
    selectFrameCtx: CanvasRenderingContext2D
  ): void {
    this.frameWidth = 10 / canvasScale;
    selectFrameCtx.strokeStyle = this.color;
    selectFrameCtx.lineWidth = this.lineWidth / canvasScale;
    selectFrameCtx.fillStyle = 'white';
    for (const point of [
      [this.shape.originX, this.shape.originY],
      [
        this.shape.originX + this.shape.width,
        this.shape.originY + this.shape.height,
      ],
    ] as Point[]) {
      const path = new Path2D();
      path.ellipse(
        point[0],
        point[1],
        this.frameWidth / 2,
        this.frameWidth / 2,
        0,
        0,
        2 * Math.PI
      );
      selectFrameCtx.fill(path);
      selectFrameCtx.stroke(path);
    }
  }

  override resize(p: Point): ChangedShapeProperties[] {
    let properties: ChangableSerializedShapeProperties = {};
    switch (this.resized) {
      case Resize.StraightLineFirstPoint:
        properties = {
          ...this.shape.resizeLeft(p[0], false),
          ...this.shape.resizeTop(p[1]),
        };
        break;
      case Resize.StraightLineLastPoint:
        properties = {
          ...this.shape.resizeRight(p[0], false),
          ...this.shape.resizeBottom(p[1]),
        };
        break;
    }
    if (Object.keys(properties).length > 0) {
      return [
        {
          id: this.shape.properties[ShapePropertyName.id],
          properties: properties,
        },
      ];
    }
    return [];
  }

  override path() {
    return this.shape.path();
  }

  override pointInside(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ): boolean {
    return this.shape.pointInside(ctx, x, y);
  }

  pointOnFirstPoint(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const path = new Path2D();
    path.ellipse(
      this.shape.originX,
      this.shape.originY,
      this.frameWidth / 2,
      this.frameWidth / 2,
      0,
      0,
      2 * Math.PI
    );
    return ctx.isPointInPath(path, x, y);
  }

  pointOnSecondPoint(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const path = new Path2D();
    path.ellipse(
      this.shape.originX + this.shape.width,
      this.shape.originY + this.shape.height,
      this.frameWidth / 2,
      this.frameWidth / 2,
      0,
      0,
      2 * Math.PI
    );
    return ctx.isPointInPath(path, x, y);
  }

  override pointOnTopLine(
    _ctx: CanvasRenderingContext2D,
    _x: number,
    _y: number
  ): boolean {
    return false;
  }

  override pointOnBottomLine(
    _ctx: CanvasRenderingContext2D,
    _x: number,
    _y: number
  ): boolean {
    return false;
  }

  override pointOnLeftLine(
    _ctx: CanvasRenderingContext2D,
    _x: number,
    _y: number
  ): boolean {
    return false;
  }

  override pointOnRightLine(
    _ctx: CanvasRenderingContext2D,
    _x: number,
    _y: number
  ): boolean {
    return false;
  }

  override pointOnTopLeftCorner(
    _ctx: CanvasRenderingContext2D,
    _x: number,
    _y: number
  ): boolean {
    return false;
  }

  override pointOnTopRightCorner(
    _ctx: CanvasRenderingContext2D,
    _x: number,
    _y: number
  ): boolean {
    return false;
  }

  override pointOnBottomLeftCorner(
    _ctx: CanvasRenderingContext2D,
    _x: number,
    _y: number
  ): boolean {
    return false;
  }

  override pointOnBottomRightCorner(
    _ctx: CanvasRenderingContext2D,
    _x: number,
    _y: number
  ): boolean {
    return false;
  }
}
