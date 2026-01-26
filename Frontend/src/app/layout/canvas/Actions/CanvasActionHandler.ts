import { CanvasComponent } from '../canvas.component';
import { DrawingPropertyName } from '../DrawingProperties/DrawingPropertyName';
import { ShapeType } from '../Serializer/ShapeSerializer';
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
import { GroupShape } from '../Shapes/GroupShape';
import { Shape } from '../Shapes/Shape';
import { TextBoxShape } from '../Shapes/TextBoxShape';
import { GroupShapeStyle } from '../ShapeStyles/GroupShapeStyle';
import { ImageStyle } from '../ShapeStyles/ImageStyle';
import { LineStyle } from '../ShapeStyles/LineStyle';
import { NullableShapeStyle, ShapeStyle } from '../ShapeStyles/ShapeStyle';
import { TextBoxStyle } from '../ShapeStyles/TextBoxStyle';

import { ActionType } from './ActionType';
import { AddDrawingsAction } from './AddDrawingsAction';
import { AddGroupShapeAction } from './AddGroupShapeAction';
import { AddShapesAction } from './AddShapesAction';
import { CanvasAction } from './CanvasAction';
import { ChangeDrawingsPropertiesAction } from './ChangeDrawingPropertiesAction';
import { ChangeShapesPropertiesAction } from './ChangeShapesPropertiesAction';
import { DrawingToShapeAction } from './DrawingToShapeAction';
import { RemoveDrawingsAction } from './RemoveDrawingsAction';
import { RemoveGroupShapeAction } from './RemoveGroupShapeAction';
import { RemoveShapesAction } from './RemoveShapesAction';
import { ShapeToLocalAction } from './ShapeToLocal';

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
      case ActionType.ShapeToLocal:
        this.shapeToLocal(action as ShapeToLocalAction);
        break;
      default:
        throw new Error(`Unknown canvas action type: ${action.type}`);
    }
  }

  receiveAction(action: CanvasAction) {
    //
  }

  private addShapes(action: AddShapesAction) {
    const shapes = action.data.shapes.map(s => {
      return this.canvas.shapeSerializer.deserialized(s);
    });
    this.canvas.shapes = this.canvas.shapes.concat(shapes);
    this.canvas.renderCanvas(true, false);
  }

  private removeShapes(action: RemoveShapesAction) {
    this.canvas.shapes = this.canvas.shapes.filter(s => {
      return !action.data.shapeIdList.includes(
        s.properties[ShapePropertyName.id]
      );
    });
    this.canvas.renderCanvas(true, false);
  }

  private changeShapesProperties(
    action: ChangeShapesPropertiesAction,
    localShapes: Shape[]
  ) {
    const shapes = localShapes.filter(s =>
      action.data.shapeIdList.includes(s.properties[ShapePropertyName.id])
    );
    shapes.forEach(shape => {
      if (
        action.data.properties[ShapePropertyName.shapes] !== undefined &&
        shape instanceof GroupShape
      ) {
        action.data.properties[ShapePropertyName.shapes].forEach(
          ({ id, properties }) => {
            this.changeShapesProperties(
              {
                type: ActionType.ChangeShapesProperties,
                data: { shapeIdList: [id], properties: properties },
              } as ChangeShapesPropertiesAction,
              shape.shapes
            );
          }
        );
        delete action.data.properties[ShapePropertyName.shapes];
      }
      if (
        action.data.properties[ShapePropertyName.text] !== undefined &&
        shape instanceof TextBoxShape
      ) {
        const textChange = action.data.properties[ShapePropertyName.text];
        const firstIndex = Math.min(textChange.startIndex, textChange.endIndex);
        const lastIndex = Math.max(textChange.startIndex, textChange.endIndex);
        shape.properties[ShapePropertyName.text] =
          shape.properties[ShapePropertyName.text].slice(0, firstIndex) +
          textChange.text +
          shape.properties[ShapePropertyName.text].slice(lastIndex);
        delete action.data.properties[ShapePropertyName.text];
      }
      shape.properties = {
        ...shape.properties,
        ...action.data.properties,
        [ShapePropertyName.style]:
          action.data.properties[ShapePropertyName.style] !== undefined
            ? this.updatedStyle(
                shape.properties[ShapePropertyName.style],
                action.data.properties[ShapePropertyName.style]
              )
            : shape.properties[ShapePropertyName.style],
      };
      if (action.data.properties[ShapePropertyName.width] !== undefined) {
        shape.properties[ShapePropertyName.scaleX] =
          action.data.properties[ShapePropertyName.width] /
          shape.properties[ShapePropertyName.originalWidth];
        shape.properties[ShapePropertyName.horizontalInverted] =
          action.data.properties[ShapePropertyName.width] < 0;
      }
      if (action.data.properties[ShapePropertyName.height] !== undefined) {
        shape.properties[ShapePropertyName.scaleY] =
          action.data.properties[ShapePropertyName.height] /
          shape.properties[ShapePropertyName.originalHeight];
        shape.properties[ShapePropertyName.verticallyInverted] =
          action.data.properties[ShapePropertyName.height] < 0;
      }
    });
    this.canvas.renderCanvas(true, false);
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
    }
    return originalStyle;
  }

  private addDrawings(action: AddDrawingsAction) {
    const drawings = (action as AddDrawingsAction).data.drawings.map(d =>
      this.canvas.drawingSerializer.deserialized(d)
    );
    this.canvas.drawings = this.canvas.drawings.concat(drawings);
    this.canvas.renderCanvas(false, true);
  }

  private removeDrawings(action: RemoveDrawingsAction) {
    this.canvas.drawings.filter(
      d =>
        !action.data.drawingIdList.includes(
          d.properties[DrawingPropertyName.id]
        )
    );
    this.canvas.renderCanvas(false, true);
  }

  private changeDrawingsProperties(action: ChangeDrawingsPropertiesAction) {
    const drawings = this.canvas.drawings.filter(d =>
      action.data.drawingIdList.includes(d.properties[DrawingPropertyName.id])
    );
    drawings.forEach(drawing => {
      drawing.properties = {
        ...drawing.properties,
        ...action.data.properties,
        [DrawingPropertyName.points]:
          action.data.properties[DrawingPropertyName.points] !== undefined &&
          drawing.properties[DrawingPropertyName.points] !== undefined
            ? [
                ...drawing.properties[DrawingPropertyName.points],
                action.data.properties[DrawingPropertyName.points].lastPoint,
              ]
            : drawing.properties[DrawingPropertyName.points],
      };
    });
    this.canvas.renderCanvas(false, true);
  }

  private drawingToShape(action: DrawingToShapeAction) {
    const idx = this.canvas.drawings.findIndex(
      d => d.properties[DrawingPropertyName.id] == action.data.drawingId
    );
    if (idx !== -1) {
      this.canvas.drawings.splice(idx, 1);
    }
    this.canvas.shapes.push(
      this.canvas.shapeSerializer.deserialized(action.data.shape)
    );
    this.canvas.renderCanvas(true, true);
  }

  private addGroupShape(action: AddGroupShapeAction) {
    const shapeIdList = action.data.shapesProperties.map(
      p => p[ShapePropertyName.id]
    );
    const shapes = this.canvas.shapes.filter(s =>
      shapeIdList.includes(s.properties[ShapePropertyName.id])
    );
    this.canvas.shapes = this.canvas.shapes.filter(
      s => !shapeIdList.includes(s.properties[ShapePropertyName.id])
    );

    const groupShape = this.canvas.shapeSerializer.deserialized({
      type: ShapeType.Group,
      properties: action.data.groupShape,
    }) as GroupShape;

    groupShape.properties[ShapePropertyName.shapes] = shapes;
    for (const shape of groupShape.shapes) {
      groupShape.shapeToLocal(shape);
    }
    this.canvas.shapes.push(groupShape);
    this.canvas.renderCanvas(true, false);
  }

  private removeGroupShape(action: RemoveGroupShapeAction) {
    const idx = this.canvas.shapes.findIndex(
      s => s.properties[ShapePropertyName.id] === action.data.groupShapeId
    );
    if (idx !== -1) {
      const groupShape = this.canvas.shapes[idx] as GroupShape;
      groupShape.shapesToGlobal();
      const shapes = groupShape.shapes;

      this.canvas.shapes.splice(idx, 1);
      this.canvas.shapes = this.canvas.shapes.concat(shapes);
      this.canvas.renderCanvas(true, false);
    }
  }

  private shapeToLocal(action: ShapeToLocalAction) {
    const idx = this.canvas.shapes.findIndex(
      s =>
        s.properties[ShapePropertyName.id] ===
        action.data.groupShape[ShapePropertyName.id]
    );
    if (idx !== -1) {
      const groupShape = this.canvas.shapes[idx] as GroupShape;
      const shapeIdx = this.canvas.shapes.findIndex(
        s =>
          s.properties[ShapePropertyName.id] ===
          action.data.shapeProperties[ShapePropertyName.id]
      );
      if (shapeIdx !== -1) {
        const shape = this.canvas.shapes[shapeIdx];
        this.canvas.shapes.splice(shapeIdx, 1);
        groupShape.addShape(shape);
        this.canvas.renderCanvas(true, false);
      }
    }
  }
}
