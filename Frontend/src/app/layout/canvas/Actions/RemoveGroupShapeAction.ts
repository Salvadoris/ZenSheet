import { RelocateSerializedShapeProperties } from '../ShapeProperties/ShapeProperties';

import { ActionType } from './ActionType';
import { CanvasAction } from './CanvasAction';

export class RemoveGroupShapeAction implements CanvasAction {
  type = ActionType.RemoveGroupShape;
  data!: {
    groupShapeId: string;
    shapesProperties: RelocateSerializedShapeProperties[];
  };
}
