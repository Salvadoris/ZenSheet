import { ActionType } from './ActionType';
import { CanvasAction } from './CanvasAction';

export interface ShapeLayerMove {
  id: string;
  newIndex: number;
}

export class ChangeShapesLayerAction implements CanvasAction {
  type = ActionType.ChangeShapesProperties;
  data!: {
    shapes: ShapeLayerMove[];
  };
}
