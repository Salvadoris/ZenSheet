import { generateUuid } from '../../../utils/uuid';
import { CanvasComponent } from '../canvas.component';
import { StraightLineDrawing } from '../Drawings/StraightLineDrawing';
import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';
import { StraightLineStyle } from '../ShapeStyles/StraightLineStyle';

import { CanvasToolState } from './CanvasToolState';

export class StraightLineToolState extends CanvasToolState {
  #currentDrawing: StraightLineDrawing | null = null;

  constructor(canvas: CanvasComponent) {
    super(canvas);
    this.canvas.changeStyle(new StraightLineStyle(this.canvas.style));
    this.canvas.changeCursor('default');
  }

  override setStyleProperty(styleProperty: ShapeStyleProperty): void {
    this.canvas.style.updateProperty(styleProperty);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override remove(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onMouseDown(_event: MouseEvent): void {}

  override onPressedMouseMove(_event: MouseEvent): void {
    if (!this.#currentDrawing) {
      const startOrigin = this.canvas.pointToGrid(this.canvas.startCursor);
      const newPoint = this.canvas.pointToGrid(this.canvas.cursor);
      if (startOrigin[0] !== newPoint[0] || startOrigin[1] !== newPoint[1]) {
        this.#currentDrawing = new StraightLineDrawing(
          {
            [FormPropertyName.id]: generateUuid(),
            [FormPropertyName.originX]: startOrigin[0],
            [FormPropertyName.originY]: startOrigin[1],
            [FormPropertyName.width]: newPoint[0] - startOrigin[0],
            [FormPropertyName.height]: newPoint[1] - startOrigin[1],
            [FormPropertyName.style]: new StraightLineStyle(this.canvas.style),
          },
          this.canvas.bufferCtx
        );
        this.canvas.addDrawings([this.#currentDrawing]);
        this.canvas.rendering.renderAddDrawing(this.#currentDrawing);
      }
    } else {
      const newPoint = this.canvas.pointToGrid(this.canvas.cursor);
      if (
        (newPoint[0] !== this.#currentDrawing.originX ||
          newPoint[1] !== this.#currentDrawing.originY) &&
        !(
          newPoint[0] ===
            this.#currentDrawing.originX + this.#currentDrawing.width &&
          newPoint[1] ===
            this.#currentDrawing.originY + this.#currentDrawing.height
        )
      ) {
        const changeProperties = this.#currentDrawing.update(newPoint);
        this.canvas.rendering.renderChangeDrawing(this.#currentDrawing);
        this.canvas.changeDrawingsProperties(
          [this.#currentDrawing.properties[FormPropertyName.id]],
          changeProperties
        );
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onHoveringMouseMove(_event: MouseEvent): void {}

  override onMouseUp(_event: MouseEvent): void {
    if (this.#currentDrawing) {
      const shape = this.canvas.drawingToShape(this.#currentDrawing);
      shape.chunkMap.set(
        this.canvas.rendering.canvasChunkSize,
        this.#currentDrawing.chunkMap.chunkIndexes(
          this.canvas.rendering.canvasChunkSize,
          this.canvas.rendering.visibleChunkRange
        )
      );
      this.canvas.rendering.renderDrawingToShape(this.#currentDrawing, shape);
      this.#currentDrawing = null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onKeyPress(_event: KeyboardEvent): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onKeyDown(_event: KeyboardEvent): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onDoubleClick(_event: MouseEvent): void {}
}
