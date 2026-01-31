import { CanvasComponent } from '../canvas.component';
import { DrawingPropertyName } from '../DrawingProperties/DrawingPropertyName';
import { LineDrawing, smoothLine } from '../Drawings/LineDrawing';
import { LineStyle } from '../ShapeStyles/LineStyle';
import { ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';

import { CanvasToolState } from './CanvasToolState';

export class PenToolState extends CanvasToolState {
  #currentDrawing: LineDrawing | null = null;

  constructor(canvas: CanvasComponent) {
    super(canvas);
    this.canvas.changeStyle(new LineStyle(this.canvas.style));
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
      if (this.canvas.firstMove) {
        this.#currentDrawing = new LineDrawing(
          {
            [DrawingPropertyName.id]: crypto.randomUUID(),
            [DrawingPropertyName.points]: [
              [this.canvas.startCursor[0], this.canvas.startCursor[1]],
              [this.canvas.cursor[0], this.canvas.cursor[1]],
            ],
            [DrawingPropertyName.style]: new LineStyle(this.canvas.style),
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
      this.canvas.renderCanvas({ drawingsChanged: true });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onHoveringMouseMove(_event: MouseEvent): void {}

  override onMouseUp(_event: MouseEvent): void {
    if (this.canvas.leftmouseDown) {
      if (this.#currentDrawing) {
        if (
          this.canvas.smoothLine &&
          this.#currentDrawing instanceof LineDrawing
        ) {
          this.#currentDrawing.points = smoothLine(
            this.#currentDrawing.points,
            this.canvas.smoothLineFactor
          );
        }
        this.canvas.drawingToShape(this.#currentDrawing);
        this.#currentDrawing = null;
        this.canvas.renderCanvas({
          drawingsChanged: true,
          shapesChanged: true,
        });
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onKeyPress(_event: KeyboardEvent): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onKeyDown(_event: KeyboardEvent): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onDoubleClick(_event: MouseEvent): void {}
}
