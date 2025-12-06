import { Rect } from '../Geometry';
import { GroupShapeStyle } from '../ShapeStyles/GroupShapeStyle';
import { ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';

import { Shape } from './Shape';

export class GroupShape extends Shape {
  declare style: GroupShapeStyle;
  constructor(
    public shapes: Shape[],
    ctx: CanvasRenderingContext2D
  ) {
    const [originX, originY, width, height] = calcRect(shapes, false, false);
    super(
      [originX, originY],
      width,
      height,
      new GroupShapeStyle(shapes.map(s => s.style)),
      ctx
    );
    for (const shape of this.shapes) {
      shape.originX -= this.originX;
      shape.originY -= this.originY;
    }
    this.invertable = !shapes.some(s => !s.invertable);
    this.minWidth = this.calcMinWidth();
    this.minHeight = this.calcMinHeight();
  }

  override setStyleProperty(styleProperty: ShapeStyleProperty): void {
    this.style.updateProperty(styleProperty);
    for (const shape of this.shapes) {
      shape.setStyleProperty(styleProperty);
    }
  }

  override renderShape(canvasRect: Rect): void {
    for (const shape of this.shapes) {
      this.shapeToGlobal(shape);
      shape.render(canvasRect);
      this.shapeToLocal(shape);
    }
  }

  override path(): Path2D {
    const path = new Path2D();
    for (const shape of this.shapes) {
      path.addPath(shape.path());
    }
    return path;
  }

  override pointInside(x: number, y: number): boolean {
    const localX = this.toLocalX(x);
    const localY = this.toLocalY(y);
    for (const shape of this.shapes) {
      if (shape.pointInside(localX, localY)) {
        return true;
      }
    }
    return false;
  }

  toLocalX(globalX: number) {
    return (globalX - this.originX) / this.scaleX;
  }

  toLocalY(globalY: number) {
    return (globalY - this.originY) / this.scaleY;
  }

  private shapeToLocal(globalShape: Shape) {
    globalShape.originX = (globalShape.originX - this.originX) / this.scaleX;
    globalShape.width /= this.scaleX;
    globalShape.scaleX = globalShape.width / globalShape.originalWidth;
    globalShape.originY = (globalShape.originY - this.originY) / this.scaleY;
    globalShape.height /= this.scaleY;
    globalShape.scaleY = globalShape.height / globalShape.originalHeight;
  }

  private shapeToGlobal(localShape: Shape) {
    localShape.originX = this.originX + localShape.originX * this.scaleX;
    localShape.width *= this.scaleX;
    localShape.scaleX = localShape.width / localShape.originalWidth;
    localShape.originY = this.originY + localShape.originY * this.scaleY;
    localShape.height *= this.scaleY;
    localShape.scaleY = localShape.height / localShape.originalHeight;
  }

  addShape(shape: Shape) {
    // calc new rect
    const shapeTrueRect = shape.trueRect();
    let newOriginX = 0;
    let newWidth = 0;
    if (this.horizontalInverted) {
      newOriginX = Math.max(shapeTrueRect[2], this.originX);
      newWidth =
        Math.min(this.originX + this.width, shapeTrueRect[0]) - newOriginX;
    } else {
      newOriginX = Math.min(shapeTrueRect[0], this.originX);
      newWidth =
        Math.max(this.originX + this.width, shapeTrueRect[2]) - newOriginX;
    }

    let newOriginY = 0;
    let newHeight = 0;
    if (this.verticallyInverted) {
      newOriginY = Math.max(shapeTrueRect[3], this.originY);
      newHeight =
        Math.min(this.originY + this.height, shapeTrueRect[1]) - newOriginY;
    } else {
      newOriginY = Math.min(shapeTrueRect[1], this.originY);
      newHeight =
        Math.max(this.originY + this.height, shapeTrueRect[3]) - newOriginY;
    }

    // recalc other shapes to new rect
    if (newOriginX != this.originX) {
      const dx = (this.originX - newOriginX) / this.scaleX;
      for (const shape of this.shapes) {
        shape.originX += dx;
      }
    }
    if (newOriginY != this.originY) {
      const dy = (this.originY - newOriginY) / this.scaleY;
      for (const shape of this.shapes) {
        shape.originY += dy;
      }
    }

    this.originX = newOriginX;
    this.originY = newOriginY;
    this.width = newWidth;
    this.height = newHeight;
    this.originalWidth = this.width / this.scaleX;
    this.originalHeight = this.height / this.scaleY;

    this.shapeToLocal(shape);

    this.shapes.push(shape);
    this.style = new GroupShapeStyle(this.shapes.map(s => s.style));

    this.invertable = !this.shapes.some(s => !s.invertable);
    this.minWidth = this.calcMinWidth();
    this.minHeight = this.calcMinHeight();
  }

  removeAllShapes() {
    for (const shape of this.shapes) {
      this.shapeToGlobal(shape);
    }
    this.shapes = [];
  }

  removeShape(shape: Shape) {
    const idx = this.shapes.indexOf(shape);
    if (idx !== -1) {
      this.shapes.splice(idx, 1);

      this.shapeToGlobal(shape);

      this.style = new GroupShapeStyle(this.shapes.map(s => s.style));

      this.invertable = !this.shapes.some(s => !s.invertable);
      this.minWidth = this.calcMinWidth();
      this.minHeight = this.calcMinHeight();

      // calc new rect
      const [localOriginX, localOriginY, localWidth, localHeight] = calcRect(
        this.shapes,
        this.horizontalInverted,
        this.verticallyInverted
      );
      const newOriginX = this.originX + localOriginX * this.scaleX;
      const newOriginY = this.originY + localOriginY * this.scaleY;
      const newWidth = localWidth * this.scaleX;
      const newHeight = localHeight * this.scaleY;

      // recalc shapes to new rect
      if (newOriginX != this.originX) {
        const dx = this.originX - newOriginX;
        for (const shape of this.shapes) {
          shape.originX += dx;
        }
      }
      if (newOriginY != this.originY) {
        const dy = this.originY - newOriginY;
        for (const shape of this.shapes) {
          shape.originY += dy;
        }
      }

      this.originX = newOriginX;
      this.originY = newOriginY;
      this.width = newWidth;
      this.height = newHeight;
      this.originalWidth = localWidth;
      this.originalHeight = localHeight;
    }
  }

  private calcMinWidth() {
    return (this.minWidth = Math.max(
      ...this.shapes.map(
        s => s.minWidth * (this.originalWidth / (s.originalWidth * s.scaleX))
      )
    ));
  }

  private calcMinHeight() {
    return (this.minHeight = Math.max(
      ...this.shapes.map(
        s => s.minHeight * (this.originalHeight / (s.originalHeight * s.scaleY))
      )
    ));
  }

  override resizeContent(): void {
    for (const shape of this.shapes) {
      this.shapeToGlobal(shape);
      shape.resizeContent();
      this.shapeToLocal(shape);
    }
  }
}

function calcRect(
  shapes: Shape[],
  horizontalInverted: boolean,
  verticallyInverted: boolean
): [number, number, number, number] {
  const originX = Math.min(
    ...shapes.map(s => (s.horizontalInverted ? s.originX + s.width : s.originX))
  );
  const originY = Math.min(
    ...shapes.map(s =>
      s.verticallyInverted ? s.originY + s.height : s.originY
    )
  );
  const width =
    Math.max(
      ...shapes.map(s =>
        s.horizontalInverted ? s.originX : s.originX + s.width
      )
    ) - originX;
  const height =
    Math.max(
      ...shapes.map(s =>
        s.verticallyInverted ? s.originY : s.originY + s.height
      )
    ) - originY;

  let newOriginX = 0;
  let newWidth = 0;
  if (horizontalInverted) {
    newOriginX = originX + width;
    newWidth = -width;
  } else {
    newOriginX = originX;
    newWidth = width;
  }

  let newOriginY = 0;
  let newHeight = 0;
  if (verticallyInverted) {
    newOriginY = originY + height;
    newHeight = -height;
  } else {
    newOriginY = originY;
    newHeight = height;
  }
  return [newOriginX, newOriginY, newWidth, newHeight];
}
