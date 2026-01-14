import { ActionType } from './ActionType';
import { CanvasAction } from './CanvasAction';

export class RemoveShapesAction implements CanvasAction {
  type = ActionType.RemoveShapes;
  data!: { shapeIdList: string[] };
}
