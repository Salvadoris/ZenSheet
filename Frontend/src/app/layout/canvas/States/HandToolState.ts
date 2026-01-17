import { CanvasComponent } from '../canvas.component';
import { ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';

import { CanvasToolState } from './CanvasToolState';

export class HandToolState extends CanvasToolState {
  constructor(canvas: CanvasComponent) {
    super(canvas);
    this.canvas.removeCurrentStyle();
    if (this.canvas.tmpCtx) {
      this.canvas.changeCursor('grab');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override setStyleProperty(_styleProperty: ShapeStyleProperty): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override renderMain(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override renderTmp(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override remove(): void {}

  override onMouseDown(_event: MouseEvent): void {
    if (this.canvas.leftmouseDown) {
      this.canvas.disableMove();
      this.canvas.changeCursor('grabbing');
    }
  }

  override onPressedMouseMove(event: MouseEvent): void {
    if (this.canvas.leftmouseDown) {
      this.canvas.origin[0] = event.clientX - this.canvas.dragStart[0];
      this.canvas.origin[1] = event.clientY - this.canvas.dragStart[1];
      this.canvas.renderCanvas(true, false);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onHoveringMouseMove(_event: MouseEvent): void {}

  override onMouseUp(_event: MouseEvent): void {
    if (this.canvas.leftmouseDown) {
      this.canvas.enableMove();
      this.canvas.changeCursor('grab');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onKeyPress(_event: KeyboardEvent): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onKeyDown(_event: KeyboardEvent): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onDoubleClick(_event: MouseEvent): void {}
}
