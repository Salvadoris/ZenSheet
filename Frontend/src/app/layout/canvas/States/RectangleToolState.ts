import { CanvasComponent } from '../canvas.component';
import { DrawingPropertyName } from '../DrawingProperties/DrawingPropertyName';
import { RectangleDrawing } from '../Drawings/RectangleDrawing';
import { RectangleStyle } from '../ShapeStyles/RectangleStyle';
import { ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';

import { CanvasToolState } from './CanvasToolState';

export class RectangleToolState extends CanvasToolState {
  #currentDrawing: RectangleDrawing | null = null;

  constructor(canvas: CanvasComponent) {
    super(canvas);
    this.canvas.changeStyle(new RectangleStyle(this.canvas.style));
    if (this.canvas.selectFrameCtx) {
      this.canvas.changeCursor('default');
    }
  }

  override setStyleProperty(styleProperty: ShapeStyleProperty): void {
    this.canvas.style.updateProperty(styleProperty);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override renderShapes(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override renderDrawings(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override remove(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onMouseDown(_event: MouseEvent): void {}

  override onPressedMouseMove(_event: MouseEvent): void {
    if (this.canvas.firstMove) {
      this.#currentDrawing = new RectangleDrawing(
        {
          [DrawingPropertyName.id]: crypto.randomUUID(),
          [DrawingPropertyName.p0]: [
            this.canvas.startCursor[0],
            this.canvas.startCursor[1],
          ],
          [DrawingPropertyName.p1]: [
            this.canvas.cursor[0],
            this.canvas.cursor[1],
          ],
          [DrawingPropertyName.style]: new RectangleStyle(this.canvas.style),
        },
        this.canvas.bufferCtx
      );
      this.canvas.addDrawings([this.#currentDrawing]);
    } else if (this.#currentDrawing) {
      const changeProperties = this.#currentDrawing.update([
        this.canvas.cursor[0],
        this.canvas.cursor[1],
      ]);
      this.canvas.changeDrawingsProperties(
        [this.#currentDrawing.properties[DrawingPropertyName.id]],
        changeProperties
      );
    }
    this.canvas.renderCanvas(false, true);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onHoveringMouseMove(_event: MouseEvent): void {}

  override onMouseUp(_event: MouseEvent): void {
    if (this.#currentDrawing) {
      this.canvas.drawingToShape(this.#currentDrawing);
      this.#currentDrawing = null;
      this.canvas.renderCanvas(true, true);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onKeyPress(_event: KeyboardEvent): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onKeyDown(_event: KeyboardEvent): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onDoubleClick(_event: MouseEvent): void {}
}
