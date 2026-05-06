import { CanvasComponent } from '../canvas.component';
import { Drawing } from '../Drawings/Drawing';
import { Rect, rectsOverlap } from '../Geometry';
import { Shape } from '../Shapes/Shape';
import { SelectToolState } from '../States/SelectToolState';
import { TextToolState } from '../States/TextToolState';

import { CanvasChunkMap } from './CanvasChunkMap';
import { ChunkIndexSet } from './ChunkIndex';
import { Form } from './Form';
import { ScalableCanvasChunkMap } from './ScalableCanvasChunkMap';

export class CanvasRendering {
  #visibleChunkRange: Rect = [0, 0, 0, 0];
  #width = 1;
  #height = 1;

  #scaleIndex!: number;
  #canvasChunkSize!: number;
  #imageChunkSize = 256;

  #smallGridChunkSize = 1;
  #trueRect: Rect = [0, 0, 0, 0];

  #drawingChunkMap: ScalableCanvasChunkMap;
  #shapeChunkMap: ScalableCanvasChunkMap;

  #canvas: CanvasComponent;

  #bufferCtx: CanvasRenderingContext2D;
  #shapeCtx: CanvasRenderingContext2D;
  #drawingCtx: CanvasRenderingContext2D;
  #selectFrameCtx: CanvasRenderingContext2D;
  #backgroundCtx: CanvasRenderingContext2D;

  constructor(
    canvas: CanvasComponent,
    bufferCtx: CanvasRenderingContext2D,
    shapeCtx: CanvasRenderingContext2D,
    drawingCtx: CanvasRenderingContext2D,
    selectFrameCtx: CanvasRenderingContext2D,
    backgroundCtx: CanvasRenderingContext2D
  ) {
    this.#canvas = canvas;
    this.#bufferCtx = bufferCtx;
    this.#shapeCtx = shapeCtx;
    this.#drawingCtx = drawingCtx;
    this.#selectFrameCtx = selectFrameCtx;
    this.#backgroundCtx = backgroundCtx;

    this.#shapeChunkMap = new ScalableCanvasChunkMap();
    this.#drawingChunkMap = new ScalableCanvasChunkMap();
  }

  get shapeCtx() {
    return this.#shapeCtx;
  }

  get width() {
    return this.#width;
  }

  get height() {
    return this.#height;
  }

  get smallChunkSize() {
    return this.#smallGridChunkSize;
  }

  get scaleIndex() {
    return this.#scaleIndex;
  }

  get canvasChunkSize() {
    return this.#canvasChunkSize;
  }

  get visibleChunkRange() {
    return this.#visibleChunkRange;
  }

  renderTransformedCanvas() {
    this.#width = window.innerWidth;
    this.#height = window.innerHeight;

    const originX = -this.#canvas.origin[0] / this.#canvas.scale;
    const originY = -this.#canvas.origin[1] / this.#canvas.scale;
    const xMax = originX + this.#width / this.#canvas.scale;
    const yMax = originY + this.#height / this.#canvas.scale;
    this.#trueRect = [originX, originY, xMax, yMax];

    const newScaleIndex = this.calcScaleIndex();
    if (newScaleIndex !== this.#scaleIndex) {
      const chunkIndexesToHide = this.chunkIndexesFromChunkRange(
        this.#visibleChunkRange
      );

      this.#shapeChunkMap.hideChunkIndexes(
        this.#scaleIndex,
        chunkIndexesToHide
      );
      this.#drawingChunkMap.hideChunkIndexes(
        this.#scaleIndex,
        chunkIndexesToHide
      );

      this.#shapeCtx.clearRect(0, 0, this.#width, this.#height);
      this.#drawingCtx.clearRect(0, 0, this.#width, this.#height);

      this.#scaleIndex = newScaleIndex;
      this.#canvasChunkSize = this.calcChunkSize();
      this.#smallGridChunkSize = Math.round(this.#canvasChunkSize / 5);

      this.#visibleChunkRange = this.calcVisibleChunkRange();

      if (!this.#shapeChunkMap.has(this.#scaleIndex)) {
        this.#shapeChunkMap.set(
          this.#scaleIndex,
          new CanvasChunkMap(this.#shapeCtx, this.#canvasChunkSize)
        );
      }
      if (!this.#drawingChunkMap.has(this.#scaleIndex)) {
        this.#drawingChunkMap.set(
          this.#scaleIndex,
          new CanvasChunkMap(this.#drawingCtx, this.#canvasChunkSize)
        );
      }

      const scale = this.calcScaleFromIndex();

      this.#bufferCtx.canvas.width = this.#imageChunkSize;
      this.#bufferCtx.canvas.height = this.#imageChunkSize;

      this.#bufferCtx.scale(scale, scale);

      this.transformShapeCanvas();
      this.transformDrawingCanvas();

      this.loadScaledShapeCanvas();
      this.loadScaledDrawingCanvas();

      this.#shapeChunkMap.render(this.#scaleIndex, this.#canvas.scale);
      this.#drawingChunkMap.render(this.#scaleIndex, this.#canvas.scale);
    } else {
      const newVisibleChunkRange = this.calcVisibleChunkRange();

      this.transformShapeCanvas();
      this.transformDrawingCanvas();

      if (!this.rectsEqual(this.#visibleChunkRange, newVisibleChunkRange)) {
        const chunkIndexesToAdd = this.chunkIndexesOnlyinSecondChunkRange(
          this.#visibleChunkRange,
          newVisibleChunkRange
        );
        const chunkIndexesToHide = this.chunkIndexesOnlyinSecondChunkRange(
          newVisibleChunkRange,
          this.#visibleChunkRange
        );
        this.#visibleChunkRange = newVisibleChunkRange;

        this.loadMovedShapeCanvas(chunkIndexesToAdd, chunkIndexesToHide);
        this.loadMovedDrawingCanvas(chunkIndexesToAdd, chunkIndexesToHide);
      }

      this.#shapeChunkMap.render(this.#scaleIndex, this.#canvas.scale);
      this.#drawingChunkMap.render(this.#scaleIndex, this.#canvas.scale);
    }

    this.#selectFrameCtx.canvas.width = this.#width;
    this.#selectFrameCtx.canvas.height = this.#height;
    this.#selectFrameCtx.translate(
      Math.round(this.#canvas.origin[0]),
      Math.round(this.#canvas.origin[1])
    );
    this.#selectFrameCtx.scale(this.#canvas.scale, this.#canvas.scale);

    this.renderBackgroundCanvas();
  }

  private transformShapeCanvas() {
    this.#shapeCtx.canvas.width = this.#width;
    this.#shapeCtx.canvas.height = this.#height;
    this.#shapeCtx.translate(
      Math.round(this.#canvas.origin[0]),
      Math.round(this.#canvas.origin[1])
    );
  }

  private transformDrawingCanvas() {
    this.#drawingCtx.canvas.width = this.#width;
    this.#drawingCtx.canvas.height = this.#height;
    this.#drawingCtx.translate(
      Math.round(this.#canvas.origin[0]),
      Math.round(this.#canvas.origin[1])
    );
  }

  private loadMovedShapeCanvas(
    chunkIndexesToAdd?: ChunkIndexSet,
    chunkIndexesToHide?: ChunkIndexSet
  ) {
    if (chunkIndexesToAdd) {
      this.#canvas.shapes.forEach((shape, index) => {
        if (this.formInsideVisibleChunkRange(shape)) {
          const extendedChunkIndexes = shape.chunkMap.extendChunkMap(
            this.#canvasChunkSize,
            this.#visibleChunkRange,
            chunkIndexesToAdd
          );

          if (extendedChunkIndexes) {
            this.#shapeChunkMap.reloadFormChunks(
              this.#scaleIndex,
              shape,
              index,
              this.#visibleChunkRange,
              undefined,
              undefined,
              extendedChunkIndexes
            );
          }
        }
      });

      this.#shapeChunkMap.showChunkIndexes(this.#scaleIndex, chunkIndexesToAdd);
    }

    if (chunkIndexesToHide) {
      this.#shapeChunkMap.hideChunkIndexes(
        this.#scaleIndex,
        chunkIndexesToHide
      );
    }
  }

  private loadScaledShapeCanvas() {
    this.#canvas.shapes.forEach((shape, index) => {
      if (this.formInsideVisibleChunkRange(shape)) {
        if (shape.chunkMap.has(this.#canvasChunkSize)) {
          const {
            chunkIndexesToReload: reloadChunkIndexes,
            chunkIndexesToRemove: removeChunkIndexes,
          } = shape.chunkMap.updateChunkMap(
            this.#canvasChunkSize,
            this.#visibleChunkRange
          );
          this.#shapeChunkMap.reloadFormChunks(
            this.#scaleIndex,
            shape,
            index,
            this.#visibleChunkRange,
            reloadChunkIndexes,
            removeChunkIndexes,
            shape.chunkMap.chunkIndexes(
              this.#canvasChunkSize,
              this.#visibleChunkRange
            )
          );
        } else {
          this.#shapeChunkMap.reloadFormChunks(
            this.#scaleIndex,
            shape,
            index,
            this.#visibleChunkRange,
            shape.chunkMap.chunkIndexes(
              this.#canvasChunkSize,
              this.#visibleChunkRange
            )
          );
        }
      }
    });

    this.#shapeChunkMap.showChunkIndexRange(
      this.#scaleIndex,
      this.#visibleChunkRange
    );
  }

  private loadMovedDrawingCanvas(
    chunkIndexesToAdd?: ChunkIndexSet,
    chunkIndexesToHide?: ChunkIndexSet
  ) {
    if (chunkIndexesToAdd) {
      this.#canvas.drawings.forEach((drawing, index) => {
        if (this.formInsideVisibleChunkRange(drawing)) {
          const extendedChunkIndexes = drawing.chunkMap.extendChunkMap(
            this.#canvasChunkSize,
            this.#visibleChunkRange,
            chunkIndexesToAdd
          );

          if (extendedChunkIndexes) {
            this.#drawingChunkMap.reloadFormChunks(
              this.#scaleIndex,
              drawing,
              index,
              this.#visibleChunkRange,
              undefined,
              undefined,
              extendedChunkIndexes
            );
          }
        }
      });

      this.#drawingChunkMap.showChunkIndexes(
        this.#scaleIndex,
        chunkIndexesToAdd
      );
    }

    if (chunkIndexesToHide) {
      this.#drawingChunkMap.hideChunkIndexes(
        this.#scaleIndex,
        chunkIndexesToHide
      );
    }
  }

  private loadScaledDrawingCanvas() {
    this.#canvas.drawings.forEach((drawing, index) => {
      if (this.formInsideVisibleChunkRange(drawing)) {
        if (drawing.chunkMap.has(this.#canvasChunkSize)) {
          const chunkChange = drawing.chunkMap.updateChunkMap(
            this.#canvasChunkSize,
            this.#visibleChunkRange
          );
          this.#drawingChunkMap.reloadFormChunks(
            this.#scaleIndex,
            drawing,
            index,
            this.#visibleChunkRange,
            chunkChange.chunkIndexesToReload,
            chunkChange.chunkIndexesToRemove,
            drawing.chunkMap.chunkIndexes(
              this.#canvasChunkSize,
              this.#visibleChunkRange
            )
          );
        } else {
          const chunkIndexes = drawing.chunkMap.chunkIndexes(
            this.#canvasChunkSize,
            this.#visibleChunkRange
          );
          this.#drawingChunkMap.reloadFormChunks(
            this.#scaleIndex,
            drawing,
            index,
            this.#visibleChunkRange,
            chunkIndexes
          );
        }
      }
    });

    this.#drawingChunkMap.showChunkIndexRange(
      this.#scaleIndex,
      this.#visibleChunkRange
    );
  }

  renderAddDrawing(drawing: Drawing) {
    if (this.formInsideVisibleChunkRange(drawing)) {
      const drawingIndex = this.#canvas.drawings.indexOf(drawing);
      if (drawingIndex !== -1) {
        const chunkIndexes = drawing.chunkMap.chunkIndexes(
          this.#canvasChunkSize,
          this.#visibleChunkRange
        );

        this.#drawingChunkMap.reloadFormChunks(
          this.#scaleIndex,
          drawing,
          drawingIndex,
          this.#visibleChunkRange,
          chunkIndexes
        );

        this.#drawingChunkMap.showChunkIndexes(this.#scaleIndex, chunkIndexes);

        this.#drawingChunkMap.render(
          this.#scaleIndex,
          this.#canvas.scale,
          chunkIndexes
        );
      }
    }
  }

  renderChangeDrawing(drawing: Drawing) {
    if (this.formInsideVisibleChunkRange(drawing)) {
      const {
        chunkIndexesToReload: reloadChunkIndexes,
        chunkIndexesToRemove: removeChunkIndexes,
      } = drawing.chunkMap.updateChunkMap(
        this.#canvasChunkSize,
        this.#visibleChunkRange
      );
      if (reloadChunkIndexes || removeChunkIndexes) {
        this.removeDrawingChunkImagesOutsideOfCurrentScaleIndex(drawing);
        const drawingIndex = this.#canvas.drawings.indexOf(drawing);
        if (drawingIndex !== -1) {
          this.#drawingChunkMap.reloadFormChunks(
            this.#scaleIndex,
            drawing,
            drawingIndex,
            this.#visibleChunkRange,
            reloadChunkIndexes,
            removeChunkIndexes
          );

          if (reloadChunkIndexes) {
            this.#drawingChunkMap.showChunkIndexes(
              this.#scaleIndex,
              reloadChunkIndexes
            );
          }

          this.#drawingChunkMap.render(
            this.#scaleIndex,
            this.#canvas.scale,
            reloadChunkIndexes,
            removeChunkIndexes
          );
        }
      }
    }
  }

  renderChangeDrawings(drawings: Drawing[]) {
    if (drawings.length === 1) {
      this.renderChangeDrawing(drawings[0]);
    } else {
      const totalReloadChunkIndexes = new ChunkIndexSet();
      const totalRemoveChunkIndexes = new ChunkIndexSet();
      for (const drawing of drawings) {
        this.removeDrawingChunkImagesOutsideOfCurrentScaleIndex(drawing);
        if (this.formInsideVisibleChunkRange(drawing)) {
          const drawingIndex = this.#canvas.drawings.indexOf(drawing);
          const {
            chunkIndexesToReload: reloadChunkIndexes,
            chunkIndexesToRemove: removeChunkIndexes,
          } = drawing.chunkMap.updateChunkMap(
            this.#canvasChunkSize,
            this.#visibleChunkRange
          );
          this.#drawingChunkMap.reloadFormChunks(
            this.#scaleIndex,
            drawing,
            drawingIndex,
            this.#visibleChunkRange,
            reloadChunkIndexes,
            removeChunkIndexes
          );
          if (reloadChunkIndexes) {
            reloadChunkIndexes.forEach(index => {
              totalReloadChunkIndexes.add(index);
            });
          }
          if (removeChunkIndexes) {
            removeChunkIndexes.forEach(index => {
              totalRemoveChunkIndexes.add(index);
            });
          }
        }
      }

      this.#drawingChunkMap.showChunkIndexes(
        this.#scaleIndex,
        totalReloadChunkIndexes
      );

      this.#drawingChunkMap.render(
        this.#scaleIndex,
        this.#canvas.scale,
        totalReloadChunkIndexes,
        totalRemoveChunkIndexes
      );
    }
  }

  renderAddDrawings(drawings: Drawing[]) {
    if (drawings.length === 1) {
      if (this.formInsideVisibleChunkRange(drawings[0])) {
        this.renderAddDrawing(drawings[0]);
      }
    } else {
      const totalChunkIndexes = new ChunkIndexSet();
      for (const drawing of drawings) {
        if (this.formInsideVisibleChunkRange(drawing)) {
          const drawingIndex = this.#canvas.drawings.indexOf(drawing);
          if (drawingIndex !== -1) {
            const chunkIndexes = drawing.chunkMap.chunkIndexes(
              this.#canvasChunkSize,
              this.#visibleChunkRange
            );
            this.#drawingChunkMap.reloadFormChunks(
              this.#scaleIndex,
              drawing,
              drawingIndex,
              this.#visibleChunkRange,
              chunkIndexes
            );
            chunkIndexes.forEach(index => {
              totalChunkIndexes.add(index);
            });
          }
        }
      }

      this.#drawingChunkMap.showChunkIndexes(
        this.#scaleIndex,
        totalChunkIndexes
      );

      this.#drawingChunkMap.render(
        this.#scaleIndex,
        this.#canvas.scale,
        totalChunkIndexes
      );
    }
  }

  renderRemoveDrawings(drawings: Drawing[]) {
    const totalChunkIndexes = new ChunkIndexSet();
    for (const drawing of drawings) {
      if (drawing.chunkMap.size() > 0) {
        for (const canvasChunkSize of drawing.chunkMap.keys()) {
          const scaleIndex = this.calcScaleIndexFromChunkSize(canvasChunkSize);
          if (this.#drawingChunkMap.has(scaleIndex)) {
            const chunkIndexes = drawing.chunkMap.chunkIndexes(
              canvasChunkSize,
              this.#visibleChunkRange
            );
            this.#drawingChunkMap.removeForm(scaleIndex, drawing, chunkIndexes);

            if (scaleIndex === this.#scaleIndex) {
              chunkIndexes.forEach(index => {
                totalChunkIndexes.add(index);
              });
            }
          }
        }
      }
    }
    this.#drawingChunkMap.render(
      this.#scaleIndex,
      this.#canvas.scale,
      totalChunkIndexes
    );
  }

  renderAddShape(shape: Shape) {
    if (this.formInsideVisibleChunkRange(shape)) {
      const shapeIndex = this.#canvas.shapes.indexOf(shape);
      if (shapeIndex !== -1) {
        const chunkIndexes = shape.chunkMap.chunkIndexes(
          this.#canvasChunkSize,
          this.#visibleChunkRange
        );

        this.#shapeChunkMap.reloadFormChunks(
          this.#scaleIndex,
          shape,
          shapeIndex,
          this.#visibleChunkRange,
          chunkIndexes
        );

        this.#shapeChunkMap.showChunkIndexes(this.#scaleIndex, chunkIndexes);

        this.#shapeChunkMap.render(
          this.#scaleIndex,
          this.#canvas.scale,
          chunkIndexes
        );
      }
    }
  }

  renderChangeShape(shape: Shape) {
    if (this.formInsideVisibleChunkRange(shape)) {
      const {
        chunkIndexesToReload: reloadChunkIndexes,
        chunkIndexesToRemove: removeChunkIndexes,
      } = shape.chunkMap.updateChunkMap(
        this.#canvasChunkSize,
        this.#visibleChunkRange
      );
      if (reloadChunkIndexes || removeChunkIndexes) {
        const shapeIndex = this.#canvas.shapes.indexOf(shape);
        if (shapeIndex !== -1) {
          this.#shapeChunkMap.reloadFormChunks(
            this.#scaleIndex,
            shape,
            shapeIndex,
            this.#visibleChunkRange,
            reloadChunkIndexes,
            removeChunkIndexes
          );

          if (reloadChunkIndexes) {
            this.#shapeChunkMap.showChunkIndexes(
              this.#scaleIndex,
              reloadChunkIndexes
            );
          }

          this.#shapeChunkMap.render(
            this.#scaleIndex,
            this.#canvas.scale,
            reloadChunkIndexes,
            removeChunkIndexes
          );
        }
      }
    }
  }

  renderAddShapes(shapes: Shape[]) {
    if (shapes.length === 1) {
      this.renderAddShape(shapes[0]);
    } else {
      const totalChunkIndexes = new ChunkIndexSet();
      for (const shape of shapes) {
        if (this.formInsideVisibleChunkRange(shape)) {
          const shapeIndex = this.#canvas.shapes.indexOf(shape);
          if (shapeIndex !== -1) {
            const chunkIndexes = shape.chunkMap.chunkIndexes(
              this.#canvasChunkSize,
              this.#visibleChunkRange
            );
            this.#shapeChunkMap.reloadFormChunks(
              this.#scaleIndex,
              shape,
              shapeIndex,
              this.#visibleChunkRange,
              chunkIndexes
            );
            chunkIndexes.forEach(index => {
              totalChunkIndexes.add(index);
            });
          }
        }
      }

      this.#shapeChunkMap.showChunkIndexes(this.#scaleIndex, totalChunkIndexes);

      this.#shapeChunkMap.render(
        this.#scaleIndex,
        this.#canvas.scale,
        totalChunkIndexes
      );
    }
  }

  renderRemoveShapes(shapes: Shape[]) {
    const totalChunkIndexes = new ChunkIndexSet();
    for (const shape of shapes) {
      if (shape.chunkMap.size() > 0) {
        for (const canvasChunkSize of shape.chunkMap.keys()) {
          const scaleIndex = this.calcScaleIndexFromChunkSize(canvasChunkSize);
          if (this.#shapeChunkMap.has(scaleIndex)) {
            const chunkIndexes = shape.chunkMap.chunkIndexes(
              canvasChunkSize,
              this.#visibleChunkRange
            );
            this.#shapeChunkMap.removeForm(scaleIndex, shape, chunkIndexes);

            if (scaleIndex === this.#scaleIndex) {
              chunkIndexes.forEach(index => {
                totalChunkIndexes.add(index);
              });
            }
          }
        }
      }
    }
    this.#shapeChunkMap.render(
      this.#scaleIndex,
      this.#canvas.scale,
      totalChunkIndexes
    );
  }

  renderDrawingToShape(drawing: Drawing, shape: Shape) {
    this.renderRemoveDrawings([drawing]);
    this.renderAddShape(shape);
  }

  renderChangeShapesLayers(shapes: Shape[]) {
    const chunkIndexes = this.mergedChunkIndexes(
      shapes.map(shape => {
        return shape.chunkMap.chunkIndexes(
          this.#canvasChunkSize,
          this.#visibleChunkRange
        );
      })
    );
    this.#shapeChunkMap.changeFormsLayers(this.#scaleIndex, chunkIndexes);
    this.#shapeChunkMap.render(
      this.#scaleIndex,
      this.#canvas.scale,
      chunkIndexes
    );
  }

  renderSeletedFrameCanvas() {
    this.#selectFrameCtx.canvas.width = this.#width;
    this.#selectFrameCtx.canvas.height = this.#height;
    this.#selectFrameCtx.translate(
      this.#canvas.origin[0],
      this.#canvas.origin[1]
    );
    this.#selectFrameCtx.scale(this.#canvas.scale, this.#canvas.scale);

    if (this.#canvas.toolState instanceof SelectToolState) {
      this.#canvas.toolState.renderSelectedFrame();
    } else if (this.#canvas.toolState instanceof TextToolState) {
      this.#canvas.toolState.renderTextBoxRect();
    }
  }

  renderBackgroundCanvas() {
    this.#backgroundCtx.canvas.width = this.#width;
    this.#backgroundCtx.canvas.height = this.#height;
    this.#backgroundCtx.translate(
      this.#canvas.origin[0],
      this.#canvas.origin[1]
    );
    this.#backgroundCtx.scale(this.#canvas.scale, this.#canvas.scale);

    this.#backgroundCtx.clearRect(
      0,
      0,
      this.#backgroundCtx.canvas.width,
      this.#backgroundCtx.canvas.height
    );

    if (this.#canvas.backgroundIsGrid) {
      this.drawGrid();
    }
  }

  private removeDrawingChunkImagesOutsideOfCurrentScaleIndex(drawing: Drawing) {
    for (const [scaleIndex] of this.#drawingChunkMap) {
      if (this.#scaleIndex !== scaleIndex) {
        this.#drawingChunkMap.removeFormImages(scaleIndex, drawing);
      }
    }
    this.#drawingChunkMap.removeFormImagesOutsideOfChunkRange(
      this.#scaleIndex,
      drawing,
      this.#visibleChunkRange
    );
  }

  private removeShapeChunkImagesOutsideOfLoadedChunkRange(shape: Shape) {
    for (const [scaleIndex] of this.#shapeChunkMap) {
      if (this.#scaleIndex !== scaleIndex) {
        this.#shapeChunkMap.removeFormImages(scaleIndex, shape);
      }
    }
    this.#shapeChunkMap.removeFormImagesOutsideOfChunkRange(
      this.#scaleIndex,
      shape,
      this.#visibleChunkRange
    );
  }

  private calcVisibleChunkRange(): Rect {
    const originX =
      -this.#canvas.origin[0] / this.#canvas.scale / this.#canvasChunkSize;
    const originY =
      -this.#canvas.origin[1] / this.#canvas.scale / this.#canvasChunkSize;
    return [
      Math.floor(originX),
      Math.floor(originY),
      Math.ceil(
        originX + this.#width / this.#canvas.scale / this.#canvasChunkSize
      ) - 1,
      Math.ceil(
        originY + this.#height / this.#canvas.scale / this.#canvasChunkSize
      ) - 1,
    ];
  }

  private chunkIndexesFromChunkRange(chunkRange: Rect) {
    const chunkIndexes = new ChunkIndexSet();
    for (let x = chunkRange[0]; x <= chunkRange[2]; x++) {
      for (let y = chunkRange[1]; y <= chunkRange[3]; y++) {
        chunkIndexes.addIndex(x, y);
      }
    }
    return chunkIndexes;
  }

  private formInsideVisibleChunkRange(form: Form) {
    return rectsOverlap(
      form.offsetRect().map(r => r / this.#canvasChunkSize) as Rect,
      this.#visibleChunkRange
    );
  }

  private drawGrid() {
    this.drawGridChunksBySize(this.#smallGridChunkSize, '#d0d0d0');
    this.drawGridChunksBySize(this.#canvasChunkSize, '#808080');
  }

  private calcScaleIndex() {
    return Math.ceil(Math.log2(this.#canvas.scale / 0.1));
  }

  private calcScaleFromIndex() {
    return 0.1 * 2 ** this.#scaleIndex;
  }

  private calcChunkSize() {
    return (this.#imageChunkSize * 10) / Math.pow(2, this.#scaleIndex);
  }

  private calcScaleIndexFromChunkSize(canvasChunkSize: number) {
    return Math.log2((this.#imageChunkSize * 10) / canvasChunkSize);
  }

  private calcScreenChunkSize() {
    return Math.round(this.#canvasChunkSize * this.#canvas.scale);
  }

  private drawGridChunksBySize(chunkSize: number, color: string) {
    this.#backgroundCtx.strokeStyle = color;
    this.#backgroundCtx.lineWidth = 1 / this.#canvas.scale;

    const path = new Path2D();

    // vertical lines
    const startX = Math.ceil(this.#trueRect[0] / chunkSize) * chunkSize;
    const countX = Math.ceil((this.#trueRect[2] - startX) / chunkSize);
    for (let x = startX; x < startX + countX * chunkSize; x += chunkSize) {
      path.moveTo(x, this.#trueRect[1]);
      path.lineTo(x, this.#trueRect[3]);
    }

    // horizontal lines
    const startY = Math.ceil(this.#trueRect[1] / chunkSize) * chunkSize;
    const countY = Math.ceil((this.#trueRect[3] - startY) / chunkSize);
    for (let y = startY; y < startY + countY * chunkSize; y += chunkSize) {
      path.moveTo(this.#trueRect[0], y);
      path.lineTo(this.#trueRect[2], y);
    }

    this.#backgroundCtx.stroke(path);
  }

  private rectsEqual(a: Rect, b: Rect) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  }

  private overlappingChunkIndexes(
    a: ChunkIndexSet,
    b: ChunkIndexSet
  ): ChunkIndexSet {
    const result = new ChunkIndexSet();

    // iterate the smaller set for better performance
    const [small, large] = a.size < b.size ? [a, b] : [b, a];

    small.forEach(chunkIndex => {
      if (large.has(chunkIndex)) {
        result.add(chunkIndex);
      }
    });

    return result;
  }

  private chunkIndexesOnlyinSecondChunkRange(a: Rect, b: Rect) {
    const [x1Min, y1Min, x1Max, y1Max] = a;
    const [x2Min, y2Min, x2Max, y2Max] = b;

    const result = new ChunkIndexSet();

    for (let x = x2Min; x <= x2Max; x++) {
      for (let y = y2Min; y <= y2Max; y++) {
        const inRect1 = x >= x1Min && x <= x1Max && y >= y1Min && y <= y1Max;

        if (!inRect1) {
          result.addIndex(x, y);
        }
      }
    }

    return result;
  }

  private mergedChunkIndexes(chunkIndexesList: ChunkIndexSet[]): ChunkIndexSet {
    const result = new ChunkIndexSet();
    for (const chunkIndexes of chunkIndexesList) {
      chunkIndexes.forEach(chunkIndex => result.add(chunkIndex));
    }
    return result;
  }
}
