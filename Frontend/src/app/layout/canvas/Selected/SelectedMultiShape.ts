import { Rect } from '../Geometry';
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
import { GroupShape } from '../Shapes/GroupShape';
import { Shape } from '../Shapes/Shape';

import { SelectedShape } from './SelectedShape';

export class SelectedMultiShape extends SelectedShape {
  declare shape: GroupShape;

  constructor(shapes: Shape[], bufferCtx: CanvasRenderingContext2D) {
    const groupShape = new GroupShape(
      {
        [ShapePropertyName.id]: crypto.randomUUID(),
        [ShapePropertyName.shapes]: shapes,
        [ShapePropertyName.edited]: true,
        [ShapePropertyName.selected]: true,
      },
      bufferCtx
    );
    super(groupShape);
  }

  override render(
    canvasScale: number,
    canvasRect: Rect,
    selectFramectx: CanvasRenderingContext2D,
    ctx: CanvasRenderingContext2D
  ): void {
    super.render(canvasScale, canvasRect, selectFramectx, ctx);
    ctx.lineWidth = 2 / canvasScale;
    ctx.lineCap = 'square';
    ctx.strokeStyle = this.color;
    for (const shape of this.shape.shapes) {
      selectFramectx.strokeRect(
        this.shape.originX + shape.originX * this.shape.scaleX,
        this.shape.originY + shape.originY * this.shape.scaleY,
        shape.width * this.shape.scaleX,
        shape.height * this.shape.scaleY
      );
    }
  }
}
