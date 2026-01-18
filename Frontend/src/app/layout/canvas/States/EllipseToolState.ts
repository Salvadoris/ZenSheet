import { CanvasComponent } from '../canvas.component';
import { DrawingPropertyName } from '../DrawingProperties/DrawingPropertyName';
import { EllipseDrawing } from '../Drawings/EllipseDrawing';
import { EllipseStyle } from '../ShapeStyles/EllipseStyle';
import { ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';

import { CanvasToolState } from './CanvasToolState';

export class EllipseToolState extends CanvasToolState {
  #currentDrawing: EllipseDrawing | null = null;

  constructor(canvas: CanvasComponent) {
    super(canvas);
    this.canvas.changeStyle(new EllipseStyle(this.canvas.style));
    if (this.canvas.tmpCtx) {
      this.canvas.changeCursor('default');
    }
  }

  override setStyleProperty(styleProperty: ShapeStyleProperty): void {
    this.canvas.style.updateProperty(styleProperty);
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
      this.#currentDrawing = new EllipseDrawing({
        [DrawingPropertyName.id]: crypto.randomUUID(),
        [DrawingPropertyName.p0]: [
          this.canvas.startCursor[0],
          this.canvas.startCursor[1],
        ],
        [DrawingPropertyName.p1]: [
          this.canvas.cursor[0],
          this.canvas.cursor[1],
        ],
        [DrawingPropertyName.style]: new EllipseStyle(this.canvas.style),
      });
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
