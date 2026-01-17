import { SerializedShape } from '../Serializer/ShapeSerializer';

import { ActionType } from './ActionType';
import { CanvasAction } from './CanvasAction';

export class AddShapesAction implements CanvasAction {
  type = ActionType.AddShapes;
  data!: { shapes: SerializedShape[] };
}
