import { CanvasComponent } from '../canvas.component';
import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { ShapeType } from '../Serializer/ShapeSerializer';
import { GroupShape } from '../Shapes/GroupShape';
import { Shape } from '../Shapes/Shape';
import { TextBoxShape } from '../Shapes/TextBoxShape';
import { EllipseStyle } from '../ShapeStyles/EllipseStyle';
import { GroupShapeStyle } from '../ShapeStyles/GroupShapeStyle';
import { ImageStyle } from '../ShapeStyles/ImageStyle';
import { LineStyle } from '../ShapeStyles/LineStyle';
import { RectangleStyle } from '../ShapeStyles/RectangleStyle';
import { NullableShapeStyle, ShapeStyle } from '../ShapeStyles/ShapeStyle';
import { StraightLineStyle } from '../ShapeStyles/StraightLineStyle';
import { TextBoxStyle } from '../ShapeStyles/TextBoxStyle';

import { ActionType } from './ActionType';
import { AddDrawingsAction } from './AddDrawingsAction';
import { AddGroupShapeAction } from './AddGroupShapeAction';
import { AddShapesAction } from './AddShapesAction';
import { CanvasAction } from './CanvasAction';
import { ChangeDrawingsPropertiesAction } from './ChangeDrawingPropertiesAction';
import { ChangeShapesLayerAction } from './ChangeShapesLayerAction';
import { ChangeShapesPropertiesAction } from './ChangeShapesPropertiesAction';
import { DrawingToShapeAction } from './DrawingToShapeAction';
import { RemoveDrawingsAction } from './RemoveDrawingsAction';
import { RemoveGroupShapeAction } from './RemoveGroupShapeAction';
import { RemoveShapesAction } from './RemoveShapesAction';

export class CanvasActionHandler {
  constructor(private canvas: CanvasComponent) {}

  executeAction(action: CanvasAction) {
    switch (action.type) {
      case ActionType.AddShapes: {
        this.addShapes(action as AddShapesAction);
        break;
      }
      case ActionType.RemoveShapes: {
        this.removeShapes(action as RemoveShapesAction);
        break;
      }
      case ActionType.ChangeShapesProperties: {
        this.changeShapesProperties(
          action as ChangeShapesPropertiesAction,
          this.canvas.shapes
        );
        break;
      }
      case ActionType.AddDrawings: {
        this.addDrawings(action as AddDrawingsAction);
        break;
      }
      case ActionType.RemoveDrawings: {
        this.removeDrawings(action as RemoveDrawingsAction);
        break;
      }
      case ActionType.ChangeDrawingProperties: {
        this.changeDrawingsProperties(action as ChangeDrawingsPropertiesAction);
        break;
      }
      case ActionType.DrawingToShape: {
        this.drawingToShape(action as DrawingToShapeAction);
        break;
      }
      case ActionType.AddGroupShape:
        this.addGroupShape(action as AddGroupShapeAction);
        break;
      case ActionType.RemoveGroupShape:
        this.removeGroupShape(action as RemoveGroupShapeAction);
        break;
      case ActionType.ChangeShapesLayer:
        this.changeShapesLayer(action as ChangeShapesLayerAction);
        break;
      default:
        throw new Error(`Unknown canvas action type: ${action.type}`);
    }
  }

  receiveAction(action: CanvasAction) {
    this.canvas.actionReceived.emit(action);
  }

  private addShapes(action: AddShapesAction) {
    const shapes = action.data.shapes.map(s => {
      return this.canvas.shapeSerializer.deserialized(s);
    });
    this.canvas.shapes = this.canvas.shapes.concat(shapes);
    this.canvas.rendering.renderAddShapes(shapes);
  }

  private removeShapes(action: RemoveShapesAction) {
    const shapes = (this.canvas.shapes = this.canvas.shapes.filter(s => {
      return action.data.shapeIdList.includes(
        s.properties[FormPropertyName.id]
      );
    }));
    this.canvas.shapes = this.canvas.shapes.filter(s => {
      return !action.data.shapeIdList.includes(
        s.properties[FormPropertyName.id]
      );
    });
    this.canvas.rendering.renderRemoveShapes(shapes);
  }

  private changeShapesProperties(
    action: ChangeShapesPropertiesAction,
    localShapes: Shape[]
  ) {
    action.data.shapes.forEach(changedShapeProperties => {
      const idx = localShapes.findIndex(
        s => s.properties[FormPropertyName.id] === changedShapeProperties.id
      );
      if (idx !== -1) {
        const shape = this.canvas.shapes[idx];
        if (
          changedShapeProperties.properties[FormPropertyName.shapes] !==
            undefined &&
          shape instanceof GroupShape
        ) {
          changedShapeProperties.properties[FormPropertyName.shapes].forEach(
            ({ id, properties }) => {
              this.changeShapesProperties(
                {
                  type: ActionType.ChangeShapesProperties,
                  data: { shapes: [{ id: id, properties: properties }] },
                } as ChangeShapesPropertiesAction,
                shape.shapes
              );
            }
          );
          delete changedShapeProperties.properties[FormPropertyName.shapes];
        }
        if (
          changedShapeProperties.properties[FormPropertyName.text] !==
            undefined &&
          shape instanceof TextBoxShape
        ) {
          const textChange =
            changedShapeProperties.properties[FormPropertyName.text];
          const firstIndex = Math.min(
            textChange.startIndex,
            textChange.endIndex
          );
          const lastIndex = Math.max(
            textChange.startIndex,
            textChange.endIndex
          );
          shape.properties[FormPropertyName.text] =
            shape.properties[FormPropertyName.text].slice(0, firstIndex) +
            textChange.text +
            shape.properties[FormPropertyName.text].slice(lastIndex);
          delete changedShapeProperties.properties[FormPropertyName.text];
        }
        shape.properties = {
          ...shape.properties,
          ...changedShapeProperties.properties,
          [FormPropertyName.style]:
            changedShapeProperties.properties[FormPropertyName.style] !==
            undefined
              ? this.updatedStyle(
                  shape.properties[FormPropertyName.style],
                  changedShapeProperties.properties[FormPropertyName.style]
                )
              : shape.properties[FormPropertyName.style],
        };
        if (
          changedShapeProperties.properties[FormPropertyName.width] !==
          undefined
        ) {
          shape.properties[FormPropertyName.scaleX] =
            changedShapeProperties.properties[FormPropertyName.width] /
            shape.properties[FormPropertyName.originalWidth];
          shape.properties[FormPropertyName.horizontalInverted] =
            changedShapeProperties.properties[FormPropertyName.width] < 0;
        }
        if (
          changedShapeProperties.properties[FormPropertyName.height] !==
          undefined
        ) {
          shape.properties[FormPropertyName.scaleY] =
            changedShapeProperties.properties[FormPropertyName.height] /
            shape.properties[FormPropertyName.originalHeight];
          shape.properties[FormPropertyName.verticallyInverted] =
            changedShapeProperties.properties[FormPropertyName.height] < 0;
        }
      }
    });
    // TODO
    // this.canvas.rendering.renderChangeShapes(localShapes);
  }

  private updatedStyle(
    originalStyle: NullableShapeStyle,
    newStyle: NullableShapeStyle
  ): NullableShapeStyle {
    if (originalStyle instanceof LineStyle) {
      return new LineStyle({ ...originalStyle, ...(newStyle as ShapeStyle) });
    } else if (originalStyle instanceof ImageStyle) {
      return new ImageStyle({ ...originalStyle, ...(newStyle as ShapeStyle) });
    } else if (originalStyle instanceof GroupShapeStyle) {
      return new GroupShapeStyle([{ ...originalStyle, ...newStyle }]);
    } else if (originalStyle instanceof TextBoxStyle) {
      return new TextBoxStyle({
        ...originalStyle,
        ...(newStyle as ShapeStyle),
      });
    } else if (originalStyle instanceof RectangleStyle) {
      return new RectangleStyle({
        ...originalStyle,
        ...(newStyle as ShapeStyle),
      });
    } else if (originalStyle instanceof EllipseStyle) {
      return new EllipseStyle({
        ...originalStyle,
        ...(newStyle as ShapeStyle),
      });
    } else if (originalStyle instanceof StraightLineStyle) {
      return new StraightLineStyle({
        ...originalStyle,
        ...(newStyle as ShapeStyle),
      });
    }
    return originalStyle;
  }

  private addDrawings(action: AddDrawingsAction) {
    const drawings = (action as AddDrawingsAction).data.drawings.map(d =>
      this.canvas.drawingSerializer.deserialized(d)
    );
    this.canvas.drawings = this.canvas.drawings.concat(drawings);
    this.canvas.rendering.renderAddDrawings(drawings);
  }

  private removeDrawings(action: RemoveDrawingsAction) {
    const drawings = this.canvas.drawings.filter(d =>
      action.data.drawingIdList.includes(d.properties[FormPropertyName.id])
    );
    this.canvas.drawings = this.canvas.drawings.filter(
      d =>
        !action.data.drawingIdList.includes(d.properties[FormPropertyName.id])
    );
    this.canvas.rendering.renderRemoveDrawings(drawings);
  }

  private changeDrawingsProperties(action: ChangeDrawingsPropertiesAction) {
    const drawings = this.canvas.drawings.filter(d =>
      action.data.drawingIdList.includes(d.properties[FormPropertyName.id])
    );
    drawings.forEach(drawing => {
      drawing.properties = {
        ...drawing.properties,
        ...action.data.properties,
        [FormPropertyName.points]:
          action.data.properties[FormPropertyName.points] !== undefined &&
          drawing.properties[FormPropertyName.points] !== undefined
            ? [
                ...drawing.properties[FormPropertyName.points],
                action.data.properties[FormPropertyName.points].lastPoint,
              ]
            : drawing.properties[FormPropertyName.points],
      };
    });
    this.canvas.rendering.renderChangeDrawings(drawings);
  }

  private drawingToShape(action: DrawingToShapeAction) {
    const idx = this.canvas.drawings.findIndex(
      d => d.properties[FormPropertyName.id] == action.data.drawingId
    );
    if (idx !== -1) {
      const drawing = this.canvas.drawings[idx];
      this.canvas.drawings.splice(idx, 1);
      const shape = this.canvas.shapeSerializer.deserialized(action.data.shape);
      this.canvas.shapes.push(
        this.canvas.shapeSerializer.deserialized(action.data.shape)
      );
      this.canvas.rendering.renderDrawingToShape(drawing, shape);
    }
  }

  private addGroupShape(action: AddGroupShapeAction) {
    const shapeIdList = action.data.shapesProperties.map(
      p => p[FormPropertyName.id]
    );
    const shapes = this.canvas.shapes.filter(s =>
      shapeIdList.includes(s.properties[FormPropertyName.id])
    );
    this.canvas.shapes = this.canvas.shapes.filter(
      s => !shapeIdList.includes(s.properties[FormPropertyName.id])
    );

    const groupShape = this.canvas.shapeSerializer.deserialized({
      type: ShapeType.Group,
      properties: action.data.groupShape,
    }) as GroupShape;

    groupShape.properties[FormPropertyName.shapes] = shapes;
    for (const shape of groupShape.shapes) {
      groupShape.shapeToLocal(shape);
    }
    this.canvas.shapes.push(groupShape);
    // TODO
    // this.canvas.renderCanvas({ shapesChanged: true });
  }

  private removeGroupShape(action: RemoveGroupShapeAction) {
    const idx = this.canvas.shapes.findIndex(
      s => s.properties[FormPropertyName.id] === action.data.groupShapeId
    );
    if (idx !== -1) {
      const groupShape = this.canvas.shapes[idx] as GroupShape;
      groupShape.shapesToGlobal();
      const shapes = groupShape.shapes;

      this.canvas.shapes.splice(idx, 1);
      this.canvas.shapes = this.canvas.shapes.concat(shapes);
      // TODO
      // this.canvas.renderCanvas({ shapesChanged: true });
    }
  }

  private changeShapesLayer(action: ChangeShapesLayerAction) {
    action.data.shapes.sort((a, b) => {
      return a.newIndex > b.newIndex ? -1 : 1;
    });

    const shapes: Shape[] = [];
    for (const { id, newIndex } of action.data.shapes) {
      const idx = this.canvas.shapes.findIndex(
        s => s.properties[FormPropertyName.id] === id
      );
      if (
        idx === -1 ||
        newIndex < 0 ||
        newIndex >= this.canvas.shapes.length ||
        idx === newIndex
      ) {
        break;
      }

      shapes.push(this.canvas.shapes[idx]);

      if (newIndex === idx - 1 || newIndex === idx + 1) {
        const tmp = this.canvas.shapes[idx];
        this.canvas.shapes[idx] = this.canvas.shapes[newIndex];
        this.canvas.shapes[newIndex] = tmp;
      } else if (newIndex === 0) {
        this.canvas.shapes.unshift(this.canvas.shapes.splice(idx, 1)[0]);
      } else if (newIndex === this.canvas.shapes.length - 1) {
        this.canvas.shapes.push(this.canvas.shapes.splice(idx, 1)[0]);
      } else {
        this.canvas.shapes.splice(
          newIndex,
          0,
          this.canvas.shapes.splice(idx, 1)[0]
        );
      }
    }
    this.canvas.rendering.renderChangeShapesLayers(shapes);
  }
}
