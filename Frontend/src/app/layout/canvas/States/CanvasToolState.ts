import { CanvasComponent } from '../canvas.component';

export abstract class CanvasToolState {
  constructor(protected canvas: CanvasComponent) {}

  abstract remove(): void;
  abstract renderMain(): void;
  abstract renderTmp(): void;
  abstract onMouseDown(event: MouseEvent): void;
  abstract onPressedMouseMove(event: MouseEvent): void;
  abstract onHoveringMouseMove(event: MouseEvent): void;
  abstract onMouseUp(event: MouseEvent): void;
}
