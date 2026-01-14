import { ChangableSerializedShapeProperties } from '../ShapeProperties/ShapeProperties';

import { ActionType } from './ActionType';
import { CanvasAction } from './CanvasAction';

export class ChangeShapesPropertiesAction implements CanvasAction {
  type = ActionType.ChangeShapesProperties;
  data!: {
    properties: ChangableSerializedShapeProperties;
    shapeIdList: string[];
  };
}
