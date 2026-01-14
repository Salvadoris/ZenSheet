import { ActionType } from './ActionType';
import { CanvasAction } from './CanvasAction';

export class RemoveDrawingsAction implements CanvasAction {
  type = ActionType.RemoveDrawings;
  data!: { drawingIdList: string[] };
}
