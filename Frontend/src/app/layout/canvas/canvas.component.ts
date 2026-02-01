import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener,
  output,
} from '@angular/core';

import { NoteContent } from '../../models/note.model';
import { Mode } from '../toolbar/toolbar.component';

import { ActionType } from './Actions/ActionType';
import { AddDrawingsAction } from './Actions/AddDrawingsAction';
import { AddGroupShapeAction } from './Actions/AddGroupShapeAction';
import { AddShapesAction } from './Actions/AddShapesAction';
import { CanvasActionHandler } from './Actions/CanvasActionHandler';
import { ChangeDrawingsPropertiesAction } from './Actions/ChangeDrawingPropertiesAction';
import {
  ChangeShapesLayerAction,
  ShapeLayerMove,
} from './Actions/ChangeShapesLayerAction';
import {
  ChangedShapeProperties,
  ChangeShapesPropertiesAction,
} from './Actions/ChangeShapesPropertiesAction';
import { DrawingToShapeAction } from './Actions/DrawingToShapeAction';
import { RemoveDrawingsAction } from './Actions/RemoveDrawingsAction';
import { RemoveGroupShapeAction } from './Actions/RemoveGroupShapeAction';
import { RemoveShapesAction } from './Actions/RemoveShapesAction';
import { CanvasContextMenu } from './ContextMenus/canvas-context-menu/canvas-context-menu.component';
import { ShapeContextMenu } from './ContextMenus/shape-context-menu/shape-context-menu.component';
import { ChangableDrawingProperties } from './DrawingProperties/DrawingProperties';
import { DrawingPropertyName } from './DrawingProperties/DrawingPropertyName';
import { Drawing } from './Drawings/Drawing';
import { Point, Rect } from './Geometry';
import {
  DrawingSerializer,
  SerializedDrawing,
} from './Serializer/DrawingSerializer';
import { SerializedShape, ShapeSerializer } from './Serializer/ShapeSerializer';
import { ChangableSerializedShapeProperties } from './ShapeProperties/ShapeProperties';
import { ShapePropertyName } from './ShapeProperties/ShapePropertyName';
import { GroupShape } from './Shapes/GroupShape';
import { Shape } from './Shapes/Shape';
import { CanvasStyle } from './ShapeStyles/CanvasStyle';
import { LineAlignment } from './ShapeStyles/LineAlignment';
import {
  NullableShapeStyle,
  ShapeStyle,
  ShapeStyleProperty,
} from './ShapeStyles/ShapeStyle';
import { StyleName } from './ShapeStyles/StyleName';
import { CanvasToolState } from './States/CanvasToolState';
import { EllipseToolState } from './States/EllipseToolState';
import { HandToolState } from './States/HandToolState';
import { PenToolState } from './States/PenToolState';
import { RectangleToolState } from './States/RectangleToolState';
import { SelectToolState } from './States/SelectToolState';
import { StraightLineToolState } from './States/StraightLineToolState';
import { TextToolState } from './States/TextToolState';

type GestureEventWithScale = Event & {
  scale: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  preventDefault(): void;
};

declare global {
  interface WindowEventMap {
    gesturestart: GestureEventWithScale;
    gesturechange: GestureEventWithScale;
    gestureend: GestureEventWithScale;
  }
}

export interface CanvasRenderType {
  transformed?: boolean;
  shapesChanged?: boolean;
  drawingsChanged?: boolean;
  shapesEdited?: boolean;
  backgroundChanged?: boolean;
}

@Component({
  selector: 'app-canvas',
  imports: [ShapeContextMenu, CanvasContextMenu],
  template: `<div class="relative">
    <canvas hidden #bufferCanvas class="absolute top-0 left-0"></canvas>
    <canvas #backgroundCanvas class="absolute top-0 left-0"></canvas>
    <canvas #shapeCanvas class="absolute top-0 left-0"></canvas>
    <canvas #drawingCanvas class="absolute top-0 left-0 "></canvas>
    <canvas #selectFrameCanvas class="absolute top-0 left-0"></canvas>
    <div
      #inputElement
      (mousedown)="onMouseDown($event)"
      (mousemove)="onHoveringMouseMove($event)"
      (wheel)="onWheel($event)"
      (keypress)="onKeyPress($event)"
      (keydown)="onKeyDown($event)"
      (dblclick)="onDoubleClick($event)"
      (touchstart)="onTouchStart($event)"
      (touchmove)="onTouchMove($event)"
      (touchend)="onTouchEnd($event)"
      (touchcancel)="onTouchCancel($event)"
      tabindex="0"
      class="absolute top-0 left-0 w-screen h-screen bg-transparent"></div>
    <textarea
      #hiddenInput
      class="absolute opacity-0 top-0 left-0 h-0 w-0 overflow-hidden"
      (input)="onInput($event)"
      (keydown)="onKeyDown($event)"
      (blur)="onInputBlur()"></textarea>
    @if (isSelectToolState()) {
      <app-shape-context-menu
        [hidden]="!asSelectToolState().shapeContextMenuVisible"
        [style.left.px]="asSelectToolState().contextMenuPosition[0]"
        [style.top.px]="asSelectToolState().contextMenuPosition[1]"
        [selectedShape]="asSelectToolState().selectedShapeChange()"
        (executeAction)="
          asSelectToolState().executeShapeContextMenuAction($event)
        "
        class="absolute z-2"></app-shape-context-menu>
      <app-canvas-context-menu
        [hidden]="!asSelectToolState().canvasContextMenuVisible"
        [style.left.px]="asSelectToolState().contextMenuPosition[0]"
        [style.top.px]="asSelectToolState().contextMenuPosition[1]"
        (executeAction)="
          asSelectToolState().executeCanvasContextMenuAction($event)
        "
        class="absolute z-2"></app-canvas-context-menu>
    }
  </div> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasComponent implements AfterViewInit {
  @ViewChild('shapeCanvas', { static: true })
  private shapeCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('drawingCanvas', { static: true })
  private drawingCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('bufferCanvas', { static: true })
  private bufferCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('selectFrameCanvas', { static: true })
  private selectFrameCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('backgroundCanvas', { static: true })
  private backgroundCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('hiddenInput', { static: true })
  private hiddenInputRef!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('inputElement', { static: true })
  private inputElementRef!: ElementRef<HTMLTextAreaElement>;

  #shapeCtx!: CanvasRenderingContext2D;
  #drawingCtx!: CanvasRenderingContext2D;
  #bufferCtx!: CanvasRenderingContext2D;
  #selectFrameCtx!: CanvasRenderingContext2D;
  #backgroundCtx!: CanvasRenderingContext2D;

  #toolState!: CanvasToolState;
  modeChange = output<Mode>();
  canvasChanged = output<void>();

  #shapeSerializer!: ShapeSerializer;
  #drawingSerializer!: DrawingSerializer;

  #actionHandler!: CanvasActionHandler;

  #shapes: Shape[] = [];
  #drawings: Drawing[] = [];

  #scale = 1;
  #minScale = 0.1;
  #maxScale = 5;
  scaleChanged = output<number>();

  #backgroundIsGrid = true;

  #origin: Point = [0, 0];

  #cursor: Point = [0, 0];

  #prevCursor: Point = [0, 0];
  #startCursor: Point = [0, 0];

  #trueRect: Rect = [0, 0, 0, 0];

  #wheelZoomStep = 0.004;
  #lineScrollPixels = 16;
  #isPinching = false;
  #pinchStartScale = 1;
  #pinchFocus: Point = [0, 0];
  #moveEnabled = true;

  #lastTouchDistance = 0;
  #isTouchPinching = false;
  #touchStartFocus: Point = [0, 0];

  #dragStart: Point = [0, 0];

  #firstMove = false;
  #pressedMouseMoved = false;

  #isPanning = false;
  #previousCursor = '';

  #mouseDown = false;
  #leftMouseDown = false;
  #rightMouseDown = false;

  #longTouchTimeout?: number;
  #doubleTouchTimeout?: number;

  #style = new CanvasStyle({
    [StyleName.Color]: '#000000',
    [StyleName.BackgroundColor]: '#00000000',
    [StyleName.LineWidth]: 10,
    [StyleName.LineCap]: 'round',
    [StyleName.Opacity]: 1,
    [StyleName.FontSize]: 40,
    [StyleName.FontLineSpace]: 1.25,
    [StyleName.FontName]: 'Times New Roman',
    [StyleName.FontBold]: false,
    [StyleName.FontItalic]: false,
    [StyleName.FontAlignment]: LineAlignment.Left,
  } as Required<ShapeStyle>);

  styleChange = output<NullableShapeStyle | null>();
  #smoothLine = true;
  #smoothLineFactor = 4;

  ngAfterViewInit() {
    const bufferCanvas = this.bufferCanvasRef.nativeElement;
    this.#bufferCtx = bufferCanvas.getContext('2d')!;
    const shapeCanvas = this.shapeCanvasRef.nativeElement;
    this.#shapeCtx = shapeCanvas.getContext('2d')!;
    const drawingCanvas = this.drawingCanvasRef.nativeElement;
    this.#drawingCtx = drawingCanvas.getContext('2d')!;
    const selectFrameCanvas = this.selectFrameCanvasRef.nativeElement;
    this.#selectFrameCtx = selectFrameCanvas.getContext('2d')!;
    const backgroundCanvas = this.backgroundCanvasRef.nativeElement;
    this.#backgroundCtx = backgroundCanvas.getContext('2d')!;

    this.#shapeSerializer = new ShapeSerializer(this.#bufferCtx);
    this.#drawingSerializer = new DrawingSerializer(this.#bufferCtx);
    this.#actionHandler = new CanvasActionHandler(this);

    this.changeToHover();
  }

  get shapeCtx() {
    return this.#shapeCtx;
  }

  get drawingCtx() {
    return this.#drawingCtx;
  }

  get bufferCtx() {
    return this.#bufferCtx;
  }

  get selectFrameCtx() {
    return this.#selectFrameCtx;
  }

  get backgroundCtx() {
    return this.#backgroundCtx;
  }

  get shapeSerializer() {
    return this.#shapeSerializer;
  }

  get drawingSerializer() {
    return this.#drawingSerializer;
  }

  get actionHandler() {
    return this.#actionHandler;
  }

  get shapes() {
    return this.#shapes;
  }

  set shapes(shapes: Shape[]) {
    this.#shapes = shapes;
  }

  get drawings() {
    return this.#drawings;
  }

  set drawings(drawings: Drawing[]) {
    this.#drawings = drawings;
  }

  get scale() {
    return this.#scale;
  }

  get origin() {
    return this.#origin;
  }

  set origin(origin: Point) {
    this.#origin = origin;
  }

  get cursor() {
    return this.#cursor;
  }

  get prevCursor() {
    return this.#prevCursor;
  }

  get startCursor() {
    return this.#startCursor;
  }

  get trueRect() {
    return this.#trueRect;
  }

  get dragStart() {
    return this.#dragStart;
  }

  get firstMove() {
    return this.#firstMove;
  }

  get pressedMouseMoved() {
    return this.#pressedMouseMoved;
  }

  get leftmouseDown() {
    return this.#leftMouseDown;
  }

  get rightmouseDown() {
    return this.#rightMouseDown;
  }

  get style() {
    return this.#style;
  }

  get smoothLine() {
    return this.#smoothLine;
  }

  get smoothLineFactor() {
    return this.#smoothLineFactor;
  }

  get toolstate() {
    return this.#toolState;
  }

  isSelectToolState() {
    return this.#toolState instanceof SelectToolState;
  }

  asSelectToolState() {
    return this.#toolState as SelectToolState;
  }

  zoomInCenter(zoom: number) {
    if (zoom !== this.#scale) {
      this.applyZoom(
        zoom,
        this.#shapeCtx.canvas.width / 2,
        this.#shapeCtx.canvas.height / 2
      );
      this.scaleChanged.emit(this.scale);
      this.renderCanvas({ transformed: true });
    }
  }

  addShapes(shapes: Shape[]) {
    if (shapes.length === 1) {
      this.shapes.push(shapes[0]);
    } else {
      this.shapes = this.shapes.concat(shapes);
    }
    const serializedShapes = shapes.map(s =>
      this.shapeSerializer.serialized(s)
    );

    this.#actionHandler.receiveAction({
      type: ActionType.AddShapes,
      data: {
        shapes: serializedShapes,
      },
    } as AddShapesAction);
    this.canvasChanged.emit();
  }

  removeShapes(shapeIdList: string[]) {
    this.shapes = this.shapes.filter(
      s => !shapeIdList.includes(s.properties[ShapePropertyName.id])
    );
    this.#actionHandler.receiveAction({
      type: ActionType.RemoveShapes,
      data: { shapeIdList: shapeIdList },
    } as RemoveShapesAction);
    this.canvasChanged.emit();
  }

  changeShapesProperties(changedShapeProperties: ChangedShapeProperties[]) {
    this.#actionHandler.receiveAction({
      type: ActionType.ChangeShapesProperties,
      data: { shapes: changedShapeProperties },
    } as ChangeShapesPropertiesAction);
    this.canvasChanged.emit();
  }

  addDrawings(drawings: Drawing[]) {
    if (drawings.length === 1) {
      this.drawings.push(drawings[0]);
    } else {
      this.#drawings = this.drawings.concat(drawings);
    }
    const serializedDrawings = drawings.map(d =>
      this.#drawingSerializer.serialized(d)
    );
    this.#actionHandler.receiveAction({
      type: ActionType.AddDrawings,
      data: { drawings: serializedDrawings },
    } as AddDrawingsAction);
    this.canvasChanged.emit();
  }

  removeDrawings(drawingIdList: string[]) {
    this.#drawings = this.drawings.filter(
      d => !drawingIdList.includes(d.properties[DrawingPropertyName.id])
    );
    this.#actionHandler.receiveAction({
      type: ActionType.RemoveDrawings,
      data: { drawingIdList: drawingIdList },
    } as RemoveDrawingsAction);
    this.canvasChanged.emit();
  }

  changeDrawingsProperties(
    drawingIdList: string[],
    properties: ChangableDrawingProperties
  ) {
    this.#actionHandler.receiveAction({
      type: ActionType.ChangeDrawingProperties,
      data: {
        drawingIdList: drawingIdList,
        properties: properties,
      },
    } as ChangeDrawingsPropertiesAction);
    this.canvasChanged.emit();
  }

  drawingToShape(drawing: Drawing) {
    const shape = drawing.toShape();
    this.shapes.push(shape);
    const serializedShape = this.shapeSerializer.serialized(shape);

    const idx = this.#drawings.indexOf(drawing);
    if (idx !== -1) {
      this.drawings.splice(idx, 1);
    }

    this.#actionHandler.receiveAction({
      type: ActionType.DrawingToShape,
      data: {
        drawingId: drawing.properties[DrawingPropertyName.id],
        shape: serializedShape,
      },
    } as DrawingToShapeAction);
    this.canvasChanged.emit();
  }

  addGroupShape(groupShape: GroupShape) {
    this.shapes.push(groupShape);

    const shapeIdList = groupShape.shapes.map(
      s => s.properties[ShapePropertyName.id]
    );
    this.#shapes = this.shapes.filter(
      s => !shapeIdList.includes(s.properties[ShapePropertyName.id])
    );
    this.#actionHandler.receiveAction({
      type: ActionType.AddGroupShape,
      data: {
        groupShape: {
          [ShapePropertyName.id]: groupShape.properties[ShapePropertyName.id],
          [ShapePropertyName.style]:
            groupShape.properties[ShapePropertyName.style],
          [ShapePropertyName.originX]:
            groupShape.properties[ShapePropertyName.originX],
          [ShapePropertyName.originY]:
            groupShape.properties[ShapePropertyName.originY],
          [ShapePropertyName.originalWidth]:
            groupShape.properties[ShapePropertyName.originalWidth],
          [ShapePropertyName.originalHeight]:
            groupShape.properties[ShapePropertyName.originalHeight],
          [ShapePropertyName.width]:
            groupShape.properties[ShapePropertyName.width],
          [ShapePropertyName.height]:
            groupShape.properties[ShapePropertyName.height],
          [ShapePropertyName.minWidth]:
            groupShape.properties[ShapePropertyName.minWidth],
          [ShapePropertyName.minHeight]:
            groupShape.properties[ShapePropertyName.minHeight],
          [ShapePropertyName.horizontallyInvertable]:
            groupShape.properties[ShapePropertyName.horizontallyInvertable],
          [ShapePropertyName.verticallyInvertable]:
            groupShape.properties[ShapePropertyName.verticallyInvertable],
          [ShapePropertyName.edited]:
            groupShape.properties[ShapePropertyName.edited],
        },
        shapesProperties: groupShape.shapes.map(s => {
          return {
            [ShapePropertyName.id]: s.properties[ShapePropertyName.id],
            [ShapePropertyName.originX]:
              s.properties[ShapePropertyName.originX],
            [ShapePropertyName.originY]:
              s.properties[ShapePropertyName.originY],
            [ShapePropertyName.width]: s.properties[ShapePropertyName.width],
            [ShapePropertyName.height]: s.properties[ShapePropertyName.height],
          };
        }),
      },
    } as AddGroupShapeAction);
    this.canvasChanged.emit();
  }

  removeGroupShape(groupShape: GroupShape) {
    const idx = this.shapes.indexOf(groupShape);
    if (idx !== -1) {
      this.shapes.splice(idx, 1);
    }
    this.shapes = this.shapes.concat(groupShape.shapes);

    this.#actionHandler.receiveAction({
      type: ActionType.RemoveGroupShape,
      data: {
        groupShapeId: groupShape.properties[ShapePropertyName.id],
        shapesProperties: groupShape.shapes.map(s => {
          return {
            [ShapePropertyName.id]: s.properties[ShapePropertyName.id],
            [ShapePropertyName.originX]:
              s.properties[ShapePropertyName.originX],
            [ShapePropertyName.originY]:
              s.properties[ShapePropertyName.originY],
            [ShapePropertyName.width]: s.properties[ShapePropertyName.width],
            [ShapePropertyName.height]: s.properties[ShapePropertyName.height],
          };
        }),
      },
    } as RemoveGroupShapeAction);
    this.canvasChanged.emit();
  }

  changeShapesLayer(shapes: ShapeLayerMove[]) {
    this.#actionHandler.receiveAction({
      type: ActionType.ChangeShapesLayer,
      data: { shapes: shapes },
    } as ChangeShapesLayerAction);
    this.canvasChanged.emit();
  }

  changeBackground(grid: boolean) {
    this.#backgroundIsGrid = grid;
    this.renderCanvas({ backgroundChanged: true });
  }

  changeMode(mode: Mode) {
    if (
      this.#toolState instanceof TextToolState &&
      mode == Mode.Select &&
      this.#toolState.currentTextBox
    ) {
      const textBox = this.#toolState.currentTextBox;
      this.#toolState = new SelectToolState(this);
      if (this.#toolState instanceof SelectToolState) {
        this.#toolState.selectSingleShape(textBox);
      }
      this.renderCanvas({ shapesEdited: true });
      return;
    }

    if (this.#toolState) {
      this.#toolState.remove();
    }
    switch (mode) {
      case Mode.Hand:
        this.#toolState = new HandToolState(this);
        break;
      case Mode.Select:
        this.#toolState = new SelectToolState(this);
        break;
      case Mode.Pen:
        this.#toolState = new PenToolState(this);
        break;
      case Mode.StraightLine:
        this.#toolState = new StraightLineToolState(this);
        break;
      case Mode.Rectangle:
        this.#toolState = new RectangleToolState(this);
        break;
      case Mode.Ellipse:
        this.#toolState = new EllipseToolState(this);
        break;
      case Mode.Text:
        this.#toolState = new TextToolState(this);
        break;
    }
  }

  changeToEditedTextState(event: MouseEvent) {
    this.changeMode(Mode.Text);
    this.onMouseDown(event);
    this.onMouseUp(event);
    this.modeChange.emit(Mode.Text);
  }

  focusCanvas() {
    this.inputElementRef.nativeElement.focus();
  }

  changeStyle(style: NullableShapeStyle) {
    this.styleChange.emit(style);
  }

  setStyleProperty(styleProperty: ShapeStyleProperty) {
    this.#toolState.setStyleProperty(styleProperty);
  }

  removeCurrentStyle() {
    this.styleChange.emit(null);
  }

  changeCursor(cursor: string) {
    this.inputElementRef.nativeElement.style.cursor = cursor;
  }

  enableMove() {
    this.#moveEnabled = true;
  }

  disableMove() {
    this.#moveEnabled = false;
  }

  changeToHover() {
    this.#mouseDown = false;
    this.#leftMouseDown = false;
    this.#rightMouseDown = false;
  }

  changeToMouseDown() {
    this.#mouseDown = true;
  }

  @HostListener('window:mousemove', ['$event'])
  handleWindowMouseMove(event: MouseEvent) {
    if (!this.#mouseDown) {
      return;
    }
    this.onPressedMouseMove(event);
  }

  @HostListener('window:mouseup', ['$event'])
  handleWindowMouseUp(event: MouseEvent) {
    if (!this.#mouseDown) {
      return;
    }
    this.onMouseUp(event);
  }

  @HostListener('window:blur')
  handleWindowBlur() {
    this.onWindowBlur();
  }

  private clampScale(value: number) {
    if (value < this.#minScale) {
      return this.#minScale;
    }
    if (value > this.#maxScale) {
      return this.#maxScale;
    }
    return value;
  }

  private applyZoom(nextScale: number, focusX: number, focusY: number) {
    const clampedScale = this.clampScale(nextScale);
    if (clampedScale === this.#scale) {
      return;
    }

    const scaleRatio = clampedScale / this.#scale;

    this.#origin[0] = focusX - (focusX - this.#origin[0]) * scaleRatio;
    this.#origin[1] = focusY - (focusY - this.#origin[1]) * scaleRatio;
    this.#scale = clampedScale;
    this.scaleChanged.emit(this.#scale);

    this.renderCanvas({ transformed: true });
  }

  private panBy(deltaX: number, deltaY: number) {
    if (deltaX === 0 && deltaY === 0) {
      return;
    }

    this.#origin[0] -= deltaX;
    this.#origin[1] -= deltaY;

    this.renderCanvas({ transformed: true });
  }

  @HostListener('window:resize')
  onResize() {
    this.renderCanvas({ transformed: true });
  }

  renderCanvas(renderType: CanvasRenderType) {
    const originX = -this.#origin[0] / this.#scale;
    const originY = -this.#origin[1] / this.#scale;
    const xMax = originX + window.innerWidth / this.#scale;
    const yMax = originY + window.innerHeight / this.#scale;
    this.#trueRect = [originX, originY, xMax, yMax];

    if (renderType.backgroundChanged || renderType.transformed) {
      this.#backgroundCtx.canvas.width = window.innerWidth;
      this.#backgroundCtx.canvas.height = window.innerHeight;
      this.#backgroundCtx.translate(this.#origin[0], this.#origin[1]);
      this.#backgroundCtx.scale(this.#scale, this.#scale);

      this.#backgroundCtx.clearRect(
        0,
        0,
        this.#backgroundCtx.canvas.width,
        this.#backgroundCtx.canvas.height
      );

      if (this.#backgroundIsGrid) {
        this.drawGrid();
      }
    }

    if (renderType.shapesChanged || renderType.transformed) {
      this.#bufferCtx.canvas.width = window.innerWidth;
      this.#bufferCtx.canvas.height = window.innerHeight;
      this.#bufferCtx.translate(this.#origin[0], this.#origin[1]);
      this.#bufferCtx.scale(this.#scale, this.#scale);

      this.#shapeCtx.canvas.width = window.innerWidth;
      this.#shapeCtx.canvas.height = window.innerHeight;
      this.#shapeCtx.save();

      this.#shapeCtx.clearRect(
        0,
        0,
        this.#shapeCtx.canvas.width,
        this.#shapeCtx.canvas.height
      );

      if (this.#toolState instanceof SelectToolState) {
        this.#toolState.selectedShapesToGlobal();
      }
      for (const shape of this.#shapes) {
        shape.render(this.#trueRect, this.#shapeCtx);
      }
      if (this.#toolState instanceof SelectToolState) {
        this.#toolState.selectedShapesToLocal();
      }

      this.#shapeCtx.restore();
    }

    if (renderType.shapesEdited || renderType.transformed) {
      this.#selectFrameCtx.canvas.width = window.innerWidth;
      this.#selectFrameCtx.canvas.height = window.innerHeight;
      this.#selectFrameCtx.translate(this.#origin[0], this.#origin[1]);
      this.#selectFrameCtx.scale(this.#scale, this.#scale);

      if (this.#toolState instanceof SelectToolState) {
        this.#toolState.renderSelectedFrame();
      } else if (this.#toolState instanceof TextToolState) {
        this.#toolState.renderTextBoxRect();
      }
    }

    if (renderType.drawingsChanged || renderType.transformed) {
      this.#drawingCtx.canvas.width = window.innerWidth;
      this.#drawingCtx.canvas.height = window.innerHeight;
      this.#drawingCtx.save();

      this.#drawingCtx.clearRect(
        0,
        0,
        this.#drawingCtx.canvas.width,
        this.#drawingCtx.canvas.height
      );

      for (const drawing of this.#drawings) {
        drawing.render(this.#trueRect, this.#drawingCtx, this.#bufferCtx);
      }

      this.#drawingCtx.restore();
    }
  }

  private drawGrid() {
    const smallChunkSize = this.scaleToSmallGridChunkSize();
    const bigChunkSize = smallChunkSize * 5;
    this.drawGridChunksBySize(smallChunkSize, '#d0d0d0');
    this.drawGridChunksBySize(bigChunkSize, '#808080');
  }

  private scaleToSmallGridChunkSize(): number {
    if (this.scale <= 0) return 0;
    const index = Math.floor(Math.log2(this.scale / 0.1));
    return 256 / Math.pow(2, index);
  }

  private drawGridChunksBySize(chunkSize: number, color: string) {
    this.backgroundCtx.strokeStyle = color;
    this.backgroundCtx.lineWidth = 1 / this.scale;

    const path = new Path2D();

    // vertical lines
    const startX = Math.ceil(this.trueRect[0] / chunkSize) * chunkSize;
    const countX = Math.ceil((this.trueRect[2] - startX) / chunkSize);
    for (let x = startX; x < startX + countX * chunkSize; x += chunkSize) {
      path.moveTo(x, this.trueRect[1]);
      path.lineTo(x, this.trueRect[3]);
    }

    // horizontal lines
    const startY = Math.ceil(this.trueRect[1] / chunkSize) * chunkSize;
    const countY = Math.ceil((this.trueRect[3] - startY) / chunkSize);
    for (let y = startY; y < startY + countY * chunkSize; y += chunkSize) {
      path.moveTo(this.trueRect[0], y);
      path.lineTo(this.trueRect[2], y);
    }

    this.backgroundCtx.stroke(path);
  }

  private zoomWithWheel(event: WheelEvent) {
    const delta = -event.deltaY;
    if (delta === 0) {
      return;
    }
    const step =
      event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? this.#wheelZoomStep * 15
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? this.#wheelZoomStep * window.innerHeight
          : this.#wheelZoomStep;
    const normalizedDelta = Math.max(-1, Math.min(1, delta * step));
    const zoomFactor = Math.exp(normalizedDelta);
    this.applyZoom(this.#scale * zoomFactor, event.pageX, event.pageY);

    if (this.#isPanning) {
      this.#dragStart[0] = event.clientX - this.#origin[0];
      this.#dragStart[1] = event.clientY - this.#origin[1];
    }
  }

  private panWithWheel(event: WheelEvent) {
    const unit =
      event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? this.#lineScrollPixels
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? window.innerHeight
          : 1;

    let deltaX = event.deltaX * unit;
    let deltaY = event.deltaY * unit;

    if (event.shiftKey && Math.abs(deltaX) < Math.abs(deltaY)) {
      deltaX = deltaY;
      deltaY = 0;
    }

    const isTrackpadSwipe = Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0;
    if (!isTrackpadSwipe) {
      return;
    }

    this.panBy(deltaX, deltaY);
    this.updateCursor(event.clientX, event.clientY);
    if (this.#mouseDown) {
      this.onPressedMouseMove(event);
    } else {
      this.onHoveringMouseMove(event);
    }
  }

  onWheel = (event: WheelEvent) => {
    event.preventDefault();
    if (!this.#moveEnabled) {
      return;
    }
    const shouldZoom = event.ctrlKey || event.metaKey;
    if (shouldZoom) {
      this.zoomWithWheel(event);
      return;
    }
    this.panWithWheel(event);
  };

  onKeyPress = (event: KeyboardEvent) => {
    event.preventDefault();
    this.#toolState.onKeyPress(event);
  };

  onKeyDown = (event: KeyboardEvent) => {
    this.#toolState.onKeyDown(event);
  };

  onDoubleClick = (event: MouseEvent) => {
    this.#toolState.onDoubleClick(event);
  };

  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: PointerEvent) {
    event.preventDefault();
    this.updateCursor(event.clientX, event.clientY);
    if (this.#toolState instanceof SelectToolState) {
      this.#toolState.onContextMenu(event.clientX, event.clientY);
    }
  }

  @HostListener('window:gesturestart', ['$event'])
  handleGestureStart(event: GestureEventWithScale) {
    if (!this.#moveEnabled) {
      return;
    }
    event.preventDefault();
    this.#isPinching = true;
    this.#pinchStartScale = this.#scale;
    this.#pinchFocus[0] = event.pageX ?? event.clientX ?? 0;
    this.#pinchFocus[1] = event.pageY ?? event.clientY ?? 0;
  }

  @HostListener('window:gesturechange', ['$event'])
  handleGestureChange(event: GestureEventWithScale) {
    if (!this.#isPinching || !this.#moveEnabled) {
      return;
    }
    event.preventDefault();
    const targetScale = this.#pinchStartScale * event.scale;
    const focusX = event.pageX ?? event.clientX ?? this.#pinchFocus[0];
    const focusY = event.pageY ?? event.clientY ?? this.#pinchFocus[1];
    this.#pinchFocus[0] = focusX;
    this.#pinchFocus[1] = focusY;
    this.applyZoom(targetScale, focusX, focusY);
  }

  @HostListener('window:gestureend')
  handleGestureEnd() {
    this.#isPinching = false;
  }

  startLongTouch(event: TouchEvent) {
    this.#longTouchTimeout = setTimeout(() => {
      if (
        event.touches.length > 0 &&
        this.#toolState instanceof SelectToolState
      )
        this.#toolState.onContextMenu(
          event.touches[0].clientX,
          event.touches[0].clientY
        );
    }, 500);
  }

  cancelLongTouch() {
    clearTimeout(this.#longTouchTimeout);
  }

  onTouchStart(event: TouchEvent) {
    event.preventDefault();
    this.startLongTouch(event);
    if (event.touches.length === 1) {
      this.#isTouchPinching = false;

      // Touch fix. Reset movement state for a new touch input.
      this.#pressedMouseMoved = false;
      this.#firstMove = true;

      const touch = event.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0,
        buttons: 1,
      });

      if (this.#doubleTouchTimeout === undefined) {
        this.#doubleTouchTimeout = event.timeStamp + 500;
      } else if (event.timeStamp <= this.#doubleTouchTimeout) {
        this.#doubleTouchTimeout = undefined;
        this.onDoubleClick(mouseEvent);
      } else {
        this.#doubleTouchTimeout = event.timeStamp + 500;
      }

      this.onMouseDown(mouseEvent);
    } else if (event.touches.length === 2) {
      if (this.#mouseDown) {
        this.onMouseUp(
          new MouseEvent('mouseup', {
            clientX: event.touches[0].clientX,
            clientY: event.touches[0].clientY,
          })
        );
      }
      this.#isTouchPinching = true;
      this.#lastTouchDistance = this.getTouchDistance(event.touches);
      const center = this.getTouchCenter(event.touches);
      this.#touchStartFocus[0] = center.x;
      this.#touchStartFocus[1] = center.y;
    }
  }

  onTouchMove(event: TouchEvent) {
    event.preventDefault();
    this.cancelLongTouch();
    if (event.touches.length === 1 && !this.#isTouchPinching) {
      const touch = event.touches[0];
      const startScreenX = this.#startCursor[0] * this.#scale + this.#origin[0];
      const startScreenY = this.#startCursor[1] * this.#scale + this.#origin[1];

      const screenDist = Math.hypot(
        touch.clientX - startScreenX,
        touch.clientY - startScreenY
      );

      if (screenDist < 5) {
        return;
      }

      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0,
        buttons: 1,
      });
      this.onPressedMouseMove(mouseEvent);
    } else if (event.touches.length === 2) {
      const currentDistance = this.getTouchDistance(event.touches);
      const center = this.getTouchCenter(event.touches);

      // Zoom
      if (this.#lastTouchDistance > 0) {
        const zoomFactor = currentDistance / this.#lastTouchDistance;
        const newScale = this.#scale * zoomFactor;

        // Use the center between fingers as zoom focus
        this.applyZoom(newScale, center.x, center.y);

        this.#lastTouchDistance = currentDistance;
      }

      // Pan
      const deltaX = center.x - this.#touchStartFocus[0];
      const deltaY = center.y - this.#touchStartFocus[1];

      this.panBy(-deltaX, -deltaY);

      this.#touchStartFocus[0] = center.x;
      this.#touchStartFocus[1] = center.y;
    }
  }

  onTouchEnd(event: TouchEvent) {
    event.preventDefault();
    this.cancelLongTouch();
    if (event.touches.length === 0) {
      if (this.#isTouchPinching) {
        this.#isTouchPinching = false;
      } else {
        const touch = event.changedTouches[0];
        const mouseEvent = new MouseEvent('mouseup', {
          clientX: touch.clientX,
          clientY: touch.clientY,
          button: 0,
          buttons: 0,
        });
        this.onMouseUp(mouseEvent);
      }
    } else if (event.touches.length < 2) {
      this.#isTouchPinching = false;
    }
  }

  onTouchCancel(event: TouchEvent) {
    this.onTouchEnd(event);
  }

  showKeyboard() {
    this.hiddenInputRef.nativeElement.focus();
  }

  onInput(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    const value = textarea.value;
    if (value.length > 0) {
      const char = value.slice(-1);

      const keyEvent = new KeyboardEvent('keypress', {
        key: char,
      });
      this.onKeyPress(keyEvent);

      textarea.value = '';
    }
  }

  onInputBlur() {
    this.focusCanvas();
  }

  private getTouchDistance(touches: TouchList): number {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  }

  private getTouchCenter(touches: TouchList): { x: number; y: number } {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }

  onMouseDown = (event: MouseEvent) => {
    if (this.pressedMouseMoved) {
      return;
    }
    event.preventDefault();
    this.focusCanvas();
    this.#leftMouseDown = event.button == 0;
    this.#rightMouseDown = event.button == 2;
    this.changeToMouseDown();
    this.#dragStart[0] = event.clientX - this.#origin[0];
    this.#dragStart[1] = event.clientY - this.#origin[1];
    this.#prevCursor[0] = this.#cursor[0];
    this.#prevCursor[1] = this.#cursor[1];
    this.#cursor[0] = this.#dragStart[0] / this.#scale;
    this.#cursor[1] = this.#dragStart[1] / this.#scale;
    this.#startCursor[0] = this.#cursor[0];
    this.#startCursor[1] = this.#cursor[1];
    this.#firstMove = true;

    if (this.#leftMouseDown && event.ctrlKey) {
      this.#isPanning = true;
      this.#previousCursor = this.inputElementRef.nativeElement.style.cursor;
      this.changeCursor('grabbing');
      return;
    }

    this.#toolState.onMouseDown(event);

    this.renderCanvas({
      drawingsChanged: true,
      shapesChanged: true,
      shapesEdited: true,
    });
  };

  onHoveringMouseMove = (event: MouseEvent) => {
    if (this.#mouseDown) {
      return;
    }
    event.preventDefault();
    this.updateCursor(event.clientX, event.clientY);
    this.#toolState.onHoveringMouseMove(event);
  };

  onPressedMouseMove = (event: MouseEvent) => {
    event.preventDefault();
    if (this.#isPanning) {
      this.#origin[0] = event.clientX - this.#dragStart[0];
      this.#origin[1] = event.clientY - this.#dragStart[1];
      this.renderCanvas({ transformed: true });
      return;
    }
    this.#toolState.onPressedMouseMove(event);
    this.updateCursor(event.clientX, event.clientY);
    this.#firstMove = false;
    this.#pressedMouseMoved = true;
  };

  onMouseUp = (event: MouseEvent) => {
    event.preventDefault();
    if (this.#isPanning) {
      this.#isPanning = false;
      this.changeCursor(this.#previousCursor);
      this.#firstMove = false;
      this.#pressedMouseMoved = false;
      this.changeToHover();
      return;
    }
    this.#toolState.onMouseUp(event);
    this.#firstMove = false;
    this.#pressedMouseMoved = false;
    this.changeToHover();
  };

  onWindowBlur = () => {
    this.#firstMove = false;
    this.changeToHover();
  };

  private updateCursor(screenX: number, screenY: number) {
    this.#prevCursor[0] = this.#cursor[0];
    this.#prevCursor[1] = this.#cursor[1];
    this.#cursor[0] = (screenX - this.#origin[0]) / this.#scale;
    this.#cursor[1] = (screenY - this.#origin[1]) / this.#scale;
  }

  shapeInside(shape: Shape) {
    return this.rectsOverlap(shape.trueRect(), this.#trueRect);
  }

  private rectsOverlap(a: Rect, b: Rect): boolean {
    if (a[2] < b[0] || b[2] < a[0]) return false;
    if (a[3] < b[1] || b[3] < a[1]) return false;
    return true;
  }

  async loadCanvasData(
    shapes: SerializedShape[] = [],
    drawings: SerializedDrawing[] = [],
    origin: Point = [0, 0],
    scale = 1
  ): Promise<void> {
    this.#origin = origin;
    this.#scale = scale;

    this.#shapes = shapes.map(s => this.#shapeSerializer.deserialized(s));

    this.#drawings = drawings.map(d => this.#drawingSerializer.deserialized(d));

    this.renderCanvas({ transformed: true });
  }

  getCanvasData(): NoteContent {
    return new NoteContent({
      shapes: this.#shapes.map(shape =>
        this.#shapeSerializer.serialized(shape)
      ),
      drawings: this.#drawings.map(drawing =>
        this.#drawingSerializer.serialized(drawing)
      ),
      origin: this.#origin,
      scale: this.#scale,
    });
  }
}
