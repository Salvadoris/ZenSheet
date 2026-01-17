import { SerializedShape } from '../Serializer/ShapeSerializer';

import { ActionType } from './ActionType';
import { CanvasAction } from './CanvasAction';

export class DrawingToShapeAction implements CanvasAction {
  type = ActionType.DrawingToShape;
  data!: { drawingId: string; shape: SerializedShape };
}
