import { ChangableDrawingProperties } from '../DrawingProperties/DrawingProperties';

import { ActionType } from './ActionType';
import { CanvasAction } from './CanvasAction';

export class ChangeDrawingsPropertiesAction implements CanvasAction {
  type = ActionType.ChangeDrawingProperties;
  data!: {
    properties: ChangableDrawingProperties;
    drawingIdList: string[];
  };
}
