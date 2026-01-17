import { SerializedDrawing } from '../Serializer/DrawingSerializer';

import { ActionType } from './ActionType';
import { CanvasAction } from './CanvasAction';

export class AddDrawingsAction implements CanvasAction {
  type = ActionType.AddDrawings;
  data!: { drawings: SerializedDrawing[] };
}
