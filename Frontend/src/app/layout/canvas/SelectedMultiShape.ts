import { GroupShape } from './GroupShape';
import { Rect } from './Rect';
import { SelectedShape } from './SelectedShape';
import { Shape } from './Shape';

export class SelectedMultiShape extends SelectedShape {
  declare shape: GroupShape;

  constructor(shapes: Shape[]) {
    const groupShape = new GroupShape(shapes);
    super(groupShape);
  }

  override render(
    ctx: CanvasRenderingContext2D,
    canvasScale: number,
    canvasRect: Rect
  ): void {
    super.render(ctx, canvasScale, canvasRect);
    ctx.lineWidth = 2 / canvasScale;
    ctx.lineCap = 'square';
    ctx.strokeStyle = this.color;
    for (const shape of this.shape.shapes) {
      ctx.strokeRect(
        this.shape.originX + shape.originX * this.shape.scaleX,
        this.shape.originY + shape.originY * this.shape.scaleY,
        shape.width * this.shape.scaleX,
        shape.height * this.shape.scaleY
      );
    }
  }
}
