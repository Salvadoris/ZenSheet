import { GroupShape } from './GroupShape';
import { SelectedShape } from './SelectedShape';
import { Shape } from './Shape';

export class SelectedMultiShape extends SelectedShape {
  declare shape: GroupShape;

  constructor(shapes: Shape[]) {
    const groupShape = new GroupShape(shapes);
    super(groupShape);
  }
}
