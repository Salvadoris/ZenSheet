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
  override remove(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onMouseDown(_event: MouseEvent): void {}

  override onPressedMouseMove(_event: MouseEvent): void {
    if (this.canvas.leftmouseDown) {
      if (!this.#currentDrawing) {
        const startOrigin = this.canvas.pointToGrid(this.canvas.startCursor);
        const newPoint = this.canvas.pointToGrid(this.canvas.cursor);
        if (startOrigin[0] !== newPoint[0] && startOrigin[1] !== newPoint[1]) {
          this.#currentDrawing = new RectangleDrawing(
            {
              [DrawingPropertyName.id]: crypto.randomUUID(),
              [DrawingPropertyName.p0]: startOrigin,
              [DrawingPropertyName.p1]: newPoint,
              [DrawingPropertyName.style]: new RectangleStyle(
                this.canvas.style
              ),
            },
            this.canvas.bufferCtx
          );
          this.canvas.addDrawings([this.#currentDrawing]);
          this.canvas.renderCanvas({ drawingsChanged: true });
        }
      } else {
        const newPoint = this.canvas.pointToGrid(this.canvas.cursor);
        if (
          !(
            (newPoint[0] ===
              this.#currentDrawing.properties[DrawingPropertyName.p1][0] &&
              newPoint[1] ===
                this.#currentDrawing.properties[DrawingPropertyName.p1][1]) ||
            (newPoint[0] ===
              this.#currentDrawing.properties[DrawingPropertyName.p0][0] &&
              newPoint[1] ===
                this.#currentDrawing.properties[DrawingPropertyName.p0][1])
          )
        ) {
          const changeProperties = this.#currentDrawing.update(newPoint);
          this.canvas.renderCanvas({ drawingsChanged: true });
          this.canvas.changeDrawingsProperties(
            [this.#currentDrawing.properties[DrawingPropertyName.id]],
            changeProperties
          );
        }
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onHoveringMouseMove(_event: MouseEvent): void {}

  override onMouseUp(_event: MouseEvent): void {
    if (this.#currentDrawing) {
      this.canvas.drawingToShape(this.#currentDrawing);
      this.#currentDrawing = null;
      this.canvas.renderCanvas({ drawingsChanged: true, shapesChanged: true });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onKeyPress(_event: KeyboardEvent): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onKeyDown(_event: KeyboardEvent): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onDoubleClick(_event: MouseEvent): void {}
}
