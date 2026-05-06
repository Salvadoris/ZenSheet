import { generateUuid } from '../../../utils/uuid';
import { ChangedShapeProperties } from '../Actions/ChangeShapesPropertiesAction';
import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { Point, Rect } from '../Geometry';
import {
  ChangableBaseSerializedShapeProperties,
  ChangableSerializedShape,
  ChangableSerializedShapeProperties,
} from '../ShapeProperties/ShapeProperties';
import { GroupShape } from '../Shapes/GroupShape';
import { Shape } from '../Shapes/Shape';

import { Resize, SelectedShape } from './SelectedShape';

type ShapeTransformProperties = Required<
  Pick<
    ChangableBaseSerializedShapeProperties,
    | FormPropertyName.originX
    | FormPropertyName.originY
    | FormPropertyName.width
    | FormPropertyName.height
  >
>;

export class SelectedMultiShape extends SelectedShape {
  declare shape: GroupShape;
  #childShapeOffsetRects!: Rect[];

  constructor(shapes: Shape[], bufferCtx: CanvasRenderingContext2D) {
    const groupShape = new GroupShape(
      {
        [FormPropertyName.id]: generateUuid(),
        [FormPropertyName.shapes]: shapes,
        [FormPropertyName.edited]: true,
        [FormPropertyName.selected]: true,
      },
      bufferCtx
    );
    super(groupShape);
    this.#childShapeOffsetRects = this.shape.shapes.map(s =>
      this.shape.shapeGlobalOffsetRect(s)
    );
  }

  addShape(shape: Shape) {
    this.shape.addShape(shape);
    this.updateOffsetRect();
  }

  override updateOffsetRect(): void {
    super.updateOffsetRect();
    this.#childShapeOffsetRects = this.shape.shapes.map(s =>
      this.shape.shapeGlobalOffsetRect(s)
    );
  }

  override render(
    canvasScale: number,
    selectFramectx: CanvasRenderingContext2D
  ): void {
    selectFramectx.lineWidth = 2 / canvasScale;
    selectFramectx.lineCap = 'square';
    selectFramectx.strokeStyle = this.color;
    for (const rect of this.#childShapeOffsetRects) {
      selectFramectx.strokeRect(
        rect[0],
        rect[1],
        rect[2] - rect[0],
        rect[3] - rect[1]
      );
    }
    super.render(canvasScale, selectFramectx);
  }

  override moveTo(newOrigin: Point): ChangedShapeProperties[] {
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
      return this.shape.shapes.map((shape): ChangedShapeProperties => {
        return {
          [FormPropertyName.id]: shape.properties[FormPropertyName.id],
          properties: {
            [FormPropertyName.originX]: this.shape.originX + shape.originX,
            [FormPropertyName.originY]: this.shape.originY + shape.originY,
          },
        };
      });
    }
    return [];
  }

  override resize(p: Point): ChangedShapeProperties[] {
    let properties: ChangedShapeProperties[] = [];
    switch (this.resized) {
      case Resize.Top:
        properties = this.resizeTop(p[1]);
        break;
      case Resize.Bottom:
        properties = this.resizeBottom(p[1]);
        break;
      case Resize.Left:
        properties = this.resizeLeft(p[0]);
        break;
      case Resize.Right:
        properties = this.resizeRight(p[0]);
        break;
      case Resize.TopLeft:
        properties = this.resizeTopLeft(p[0], p[1]);
        break;
      case Resize.TopRight:
        properties = this.resizeTopRight(p[0], p[1]);
        break;
      case Resize.BottomLeft:
        properties = this.resizeBottomLeft(p[0], p[1]);
        break;
      case Resize.BottomRight:
        properties = this.resizeBottomRight(p[0], p[1]);
        break;
    }
    this.updateOffsetRect();
    this.shape.properties[FormPropertyName.horizontalInverted] =
      this.shape.width < 0;
    this.shape.properties[FormPropertyName.verticallyInverted] =
      this.shape.height < 0;
    return properties;
  }

  private resizeTop(y: number): ChangedShapeProperties[] {
    const shapesTransformProperties = this.globalShapesTransformProperties();
    const resizeProperties = this.shape.resizeTop(y);
    return this.resizeShapes(
      shapesTransformProperties,
      resizeProperties[FormPropertyName.shapes]
    );
  }

  private resizeBottom(y: number): ChangedShapeProperties[] {
    const shapesTransformProperties = this.globalShapesTransformProperties();
    const resizeProperties = this.shape.resizeBottom(y);
    return this.resizeShapes(
      shapesTransformProperties,
      resizeProperties[FormPropertyName.shapes]
    );
  }

  private resizeLeft(x: number): ChangedShapeProperties[] {
    const shapesTransformProperties = this.globalShapesTransformProperties();
    const resizeProperties = this.shape.resizeLeft(x);
    return this.resizeShapes(
      shapesTransformProperties,
      resizeProperties[FormPropertyName.shapes]
    );
  }

  private resizeRight(x: number): ChangedShapeProperties[] {
    const shapesTransformProperties = this.globalShapesTransformProperties();
    const resizeProperties = this.shape.resizeRight(x);
    return this.resizeShapes(
      shapesTransformProperties,
      resizeProperties[FormPropertyName.shapes]
    );
  }

  private resizeTopLeft(x: number, y: number): ChangedShapeProperties[] {
    const shapesTransformProperties = this.globalShapesTransformProperties();
    const resizeLeftProperties = this.shape.resizeLeft(x);
    const resizeTopProperties = this.shape.resizeTop(y);
    return this.resizeShapes(
      shapesTransformProperties,
      resizeLeftProperties[FormPropertyName.shapes],
      resizeTopProperties[FormPropertyName.shapes]
    );
  }

  private resizeTopRight(x: number, y: number): ChangedShapeProperties[] {
    const shapesTransformProperties = this.globalShapesTransformProperties();
    const resizeRightProperties = this.shape.resizeRight(x);
    const resizeTopProperties = this.shape.resizeTop(y);
    return this.resizeShapes(
      shapesTransformProperties,
      resizeRightProperties[FormPropertyName.shapes],
      resizeTopProperties[FormPropertyName.shapes]
    );
  }

  private resizeBottomLeft(x: number, y: number): ChangedShapeProperties[] {
    const shapesTransformProperties = this.globalShapesTransformProperties();
    const resizeLeftProperties = this.shape.resizeLeft(x);
    const resizeBottomProperties = this.shape.resizeBottom(y);
    return this.resizeShapes(
      shapesTransformProperties,
      resizeLeftProperties[FormPropertyName.shapes],
      resizeBottomProperties[FormPropertyName.shapes]
    );
  }

  private resizeBottomRight(x: number, y: number): ChangedShapeProperties[] {
    const shapesTransformProperties = this.globalShapesTransformProperties();
    const resizeRightProperties = this.shape.resizeRight(x);
    const resizeBottomProperties = this.shape.resizeBottom(y);
    return this.resizeShapes(
      shapesTransformProperties,
      resizeRightProperties[FormPropertyName.shapes],
      resizeBottomProperties[FormPropertyName.shapes]
    );
  }

  private globalShapesTransformProperties(): ShapeTransformProperties[] {
    return this.shape.shapes.map((s): ShapeTransformProperties => {
      return this.globalShapeTransformProperties(s);
    });
  }

  globalShapeTransformProperties(localShape: Shape): ShapeTransformProperties {
    return {
      originX: this.shape.originX + localShape.originX * this.shape.scaleX,
      originY: this.shape.originY + localShape.originY * this.shape.scaleY,
      width: localShape.width * this.shape.scaleX,
      height: localShape.height * this.shape.scaleY,
    };
  }

  private resizeShapes(
    shapesTransformProperties: ShapeTransformProperties[],
    changableSerializedShapes?: ChangableSerializedShape[],
    changableSerializedShapes2?: ChangableSerializedShape[]
  ): ChangedShapeProperties[] {
    const properties: ChangedShapeProperties[] = [];
    this.shape.shapes.forEach((shape, i) => {
      let shapeProperties: ChangableSerializedShapeProperties = {};
      const globalTransFormProperties =
        this.globalShapeTransformProperties(shape);
      if (changableSerializedShapes !== undefined) {
        const idx = changableSerializedShapes.findIndex(
          s => s[FormPropertyName.id] === shape.properties[FormPropertyName.id]
        );
        if (idx !== -1) {
          shapeProperties = changableSerializedShapes[idx].properties;
        }
      }
      if (changableSerializedShapes2 !== undefined) {
        const idx = changableSerializedShapes2.findIndex(
          s => s[FormPropertyName.id] === shape.properties[FormPropertyName.id]
        );
        if (idx !== -1) {
          shapeProperties = {
            ...shapeProperties,
            ...changableSerializedShapes2[idx].properties,
          };
        }
      }
      if (
        globalTransFormProperties[FormPropertyName.originY] !==
        shapesTransformProperties[i][FormPropertyName.originY]
      ) {
        shapeProperties[FormPropertyName.originY] =
          globalTransFormProperties[FormPropertyName.originY];
      }
      if (
        globalTransFormProperties[FormPropertyName.originX] !==
        shapesTransformProperties[i][FormPropertyName.originX]
      ) {
        shapeProperties[FormPropertyName.originX] =
          globalTransFormProperties[FormPropertyName.originX];
      }
      if (
        globalTransFormProperties[FormPropertyName.height] !==
        shapesTransformProperties[i][FormPropertyName.height]
      ) {
        shapeProperties[FormPropertyName.height] =
          globalTransFormProperties[FormPropertyName.height];
      }
      if (
        globalTransFormProperties[FormPropertyName.width] !==
        shapesTransformProperties[i][FormPropertyName.width]
      ) {
        shapeProperties[FormPropertyName.width] =
          globalTransFormProperties[FormPropertyName.width];
      }
      properties.push({
        [FormPropertyName.id]: shape.properties[FormPropertyName.id],
        properties: shapeProperties,
      });
    });
    return properties;
  }
}
