import { ChangableSerializedShapeProperties } from '../ShapeProperties/ShapeProperties';

import { ActionType } from './ActionType';
import { CanvasAction } from './CanvasAction';

export interface ChangedShapeProperties {
  id: string;
  properties: ChangableSerializedShapeProperties;
}

export class ChangeShapesPropertiesAction implements CanvasAction {
  type = ActionType.ChangeShapesProperties;
  data!: {
    shapes: ChangedShapeProperties[];
  };
}
