import { ActionType } from './ActionType';

export interface CanvasAction {
  type: ActionType;
  data: Record<string, unknown>;
}
