import { Rect } from '../Geometry';
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
import { GroupShape } from '../Shapes/GroupShape';
import { Shape } from '../Shapes/Shape';

import { SelectedShape } from './SelectedShape';

export class SelectedMultiShape extends SelectedShape {
  declare shape: GroupShape;

  constructor(shapes: Shape[], ctx: CanvasRenderingContext2D) {
    const groupShape = new GroupShape(
      {
        [ShapePropertyName.id]: crypto.randomUUID(),
        [ShapePropertyName.shapes]: shapes,
        [ShapePropertyName.edited]: false,
        [ShapePropertyName.selected]: false,
      },
      ctx
    );
    super(groupShape);
  }

  override render(canvasScale: number, canvasRect: Rect): void {
    super.render(canvasScale, canvasRect);
    this.shape.ctx.lineWidth = 2 / canvasScale;
    this.shape.ctx.lineCap = 'square';
    this.shape.ctx.strokeStyle = this.color;
    for (const shape of this.shape.shapes) {
      this.shape.ctx.strokeRect(
        this.shape.originX + shape.originX * this.shape.scaleX,
        this.shape.originY + shape.originY * this.shape.scaleY,
        shape.width * this.shape.scaleX,
        shape.height * this.shape.scaleY
      );
    }
  }
}
