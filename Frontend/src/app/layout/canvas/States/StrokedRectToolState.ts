import { CanvasComponent } from '../canvas.component';
import { StrokedRectDrawing } from '../Drawings/StrokedRectDrawing';

import { CanvasToolState } from './CanvasToolState';

export class StrokedRectToolState extends CanvasToolState {
  constructor(canvas: CanvasComponent) {
    super(canvas);
    if (this.canvas.tmpCtx) {
      this.canvas.changeCursor('default');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override renderMain(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override renderTmp(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override remove(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onMouseDown(_event: MouseEvent): void {}

  override onPressedMouseMove(_event: MouseEvent): void {
    if (this.canvas.firstMove) {
      this.canvas.currentDrawing = new StrokedRectDrawing(
        [this.canvas.startCursor[0], this.canvas.startCursor[1]],
        [this.canvas.cursor[0], this.canvas.cursor[1]],
        this.canvas.strokedRectStyle
      );
      this.canvas.drawings.push(this.canvas.currentDrawing);
    } else if (this.canvas.currentDrawing) {
      this.canvas.currentDrawing.update([
        this.canvas.cursor[0],
        this.canvas.cursor[1],
      ]);
    }
    this.canvas.renderCanvas(false, true);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onHoveringMouseMove(_event: MouseEvent): void {}

  override onMouseUp(_event: MouseEvent): void {
    if (this.canvas.currentDrawing) {
      this.canvas.shapes.push(this.canvas.currentDrawing.toShape());
      const idx = this.canvas.drawings.indexOf(this.canvas.currentDrawing);
      this.canvas.currentDrawing = null;
      if (idx !== -1) {
        this.canvas.drawings.splice(idx, 1);
      }
      this.canvas.renderCanvas(true, true);
    }
  }
}
