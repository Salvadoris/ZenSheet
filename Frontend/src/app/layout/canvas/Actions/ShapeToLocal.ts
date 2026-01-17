import { RelocateSerializedShapeProperties } from '../ShapeProperties/ShapeProperties';

import { ActionType } from './ActionType';
import { CanvasAction } from './CanvasAction';

export class ShapeToLocalAction implements CanvasAction {
  type = ActionType.ShapeToLocal;
  data!: {
    groupShape: RelocateSerializedShapeProperties;
    shapeProperties: RelocateSerializedShapeProperties;
  };
}
