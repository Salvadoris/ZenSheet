import {
  BaseSerializedShapeProperties,
  RelocateSerializedShapeProperties,
} from '../ShapeProperties/ShapeProperties';

import { ActionType } from './ActionType';
import { CanvasAction } from './CanvasAction';

export class AddGroupShapeAction implements CanvasAction {
  type = ActionType.AddGroupShape;
  data!: {
    groupShape: BaseSerializedShapeProperties;
    shapesProperties: RelocateSerializedShapeProperties[];
  };
}
