import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener,
  output,
} from '@angular/core';

import { Mode } from '../toolbar/toolbar.component';

import { Drawing } from './Drawings/Drawing';
import { Point, Rect } from './Geometry';
import { DrawingSerializer } from './Serializer/DrawingSerializer';
import { ShapeSerializer } from './Serializer/ShapeSerializer';
import { Shape } from './Shapes/Shape';
import { TextBoxShape } from './Shapes/TextBoxShape';
import { CanvasStyle } from './ShapeStyles/CanvasStyle';
import { LineAlignment } from './ShapeStyles/LineAlignment';
import {
  NullableShapeStyle,
  ShapeStyle,
  ShapeStyleProperty,
} from './ShapeStyles/ShapeStyle';
import { StyleName } from './ShapeStyles/StyleName';
import { TextBoxStyle } from './ShapeStyles/TextBoxStyle';
import { CanvasToolState } from './States/CanvasToolState';
import { FilledRectToolState } from './States/FilledRectToolState';
import { HandToolState } from './States/HandToolState';
import { PenToolState } from './States/PenToolState';
import { SelectToolState } from './States/SelectToolState';
import { StrokedRectToolState } from './States/StrokedRectToolState';
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

@Component({
  selector: 'app-canvas',
  imports: [],
  template: `<div class="relative">
    <canvas #mainCanvas class="absolute top-0 left-0"></canvas>
    <canvas
      #tmpCanvas
      (mousedown)="onMouseDown($event)"
      (mousemove)="onHoveringMouseMove($event)"
      (wheel)="onWheel($event)"
      (keypress)="onKeyPress($event)"
      (keydown)="onKeyDown($event)"
      (dblclick)="onDoubleClick($event)"
      tabindex="0"
      class="absolute top-0 left-0"></canvas>
  </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasComponent implements AfterViewInit {
  @ViewChild('mainCanvas', { static: true })
  private mainCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tmpCanvas', { static: true })
  private tmpCanvasRef!: ElementRef<HTMLCanvasElement>;
  #mainCtx!: CanvasRenderingContext2D;
  #tmpCtx!: CanvasRenderingContext2D;

  #toolState!: CanvasToolState;
  modeChange = output<Mode>();

  #shapeSerializer!: ShapeSerializer;
  #drawingSerializer!: DrawingSerializer;

  #shapes: Shape[] = [];

  #drawings: Drawing[] = [];
  #currentDrawing: Drawing | null = null;

  #scale = 1;
  #minScale = 0.1;
  #maxScale = 5;

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

  #dragStart: Point = [0, 0];

  #firstMove = false;
  #pressedMouseMoved = false;

  #mouseDown = false;
  #leftMouseDown = false;

  #style = new CanvasStyle({
    [StyleName.Color]: '#000000',
    [StyleName.LineWidth]: 10,
    [StyleName.LineCap]: 'round',
    [StyleName.Opacity]: 255,
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
    this.#shapeSerializer = new ShapeSerializer();
    this.#drawingSerializer = new DrawingSerializer();

    const mainCanvas = this.mainCanvasRef.nativeElement;
    this.#mainCtx = mainCanvas.getContext('2d')!;
    const tmpCanvas = this.tmpCanvasRef.nativeElement;
    this.#tmpCtx = tmpCanvas.getContext('2d')!;

    this.changeToHover();
    this.renderCanvas(true, true);
  }

  get mainCtx() {
    return this.#mainCtx;
  }

  get tmpCtx() {
    return this.#tmpCtx;
  }

  get shapeSerializer() {
    return this.#shapeSerializer;
  }

  get drawingSerializer() {
    return this.#drawingSerializer;
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

  get currentDrawing() {
    return this.#currentDrawing;
  }

  set currentDrawing(currentDrawing: Drawing | null) {
    this.#currentDrawing = currentDrawing;
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

  get style() {
    return this.#style;
  }

  get smoothLine() {
    return this.#smoothLine;
  }

  get smoothLineFactor() {
    return this.#smoothLineFactor;
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
      this.renderCanvas(false, true);
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
      case Mode.FilledRect:
        this.#toolState = new FilledRectToolState(this);
        break;
      case Mode.StrokedRect:
        this.#toolState = new StrokedRectToolState(this);
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
    this.tmpCanvasRef.nativeElement.focus();
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
    this.#tmpCtx.canvas.style.cursor = cursor;
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

    this.renderCanvas(true, true);
  }

  private panBy(deltaX: number, deltaY: number) {
    if (deltaX === 0 && deltaY === 0) {
      return;
    }

    this.#origin[0] -= deltaX;
    this.#origin[1] -= deltaY;

    this.renderCanvas(true, true);
  }

  @HostListener('window:resize')
  onResize() {
    this.renderCanvas(true, true);
  }

  renderCanvas(main: boolean, tmp: boolean) {
    const originX = -this.#origin[0] / this.#scale;
    const originY = -this.#origin[1] / this.#scale;
    const xMax = originX + window.innerWidth / this.#scale;
    const yMax = originY + window.innerHeight / this.#scale;
    this.#trueRect = [originX, originY, xMax, yMax];

    if (main) {
      this.#mainCtx.canvas.width = window.innerWidth;
      this.#mainCtx.canvas.height = window.innerHeight;
      this.#mainCtx.save();

      this.#mainCtx.clearRect(
        0,
        0,
        this.#mainCtx.canvas.width,
        this.#mainCtx.canvas.height
      );

      this.#mainCtx.translate(this.#origin[0], this.#origin[1]);
      this.#mainCtx.scale(this.#scale, this.#scale);
      for (const shape of this.#shapes) {
        if (this.shapeInside(shape)) {
          shape.render(this.#trueRect);
        }
      }

      this.#toolState.renderMain();

      this.#mainCtx.restore();
    }

    if (tmp) {
      this.#tmpCtx.canvas.width = window.innerWidth;
      this.#tmpCtx.canvas.height = window.innerHeight;
      this.#tmpCtx.save();

      this.#tmpCtx.clearRect(
        0,
        0,
        this.#tmpCtx.canvas.width,
        this.#tmpCtx.canvas.height
      );

      this.#tmpCtx.translate(this.#origin[0], this.#origin[1]);
      this.#tmpCtx.scale(this.#scale, this.#scale);

      for (const drawing of this.#drawings) {
        drawing.render(this.#tmpCtx);
      }
      this.#toolState.renderTmp();

      this.#tmpCtx.restore();
    }
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

  onMouseDown = (event: MouseEvent) => {
    event.preventDefault();
    this.focusCanvas();
    this.#leftMouseDown = event.button == 0 ? true : false;
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

    this.#toolState.onMouseDown(event);

    this.renderCanvas(true, true);
  };

  onHoveringMouseMove = (event: MouseEvent) => {
    if (!this.#tmpCtx || this.#mouseDown) {
      return;
    }
    event.preventDefault();
    this.updateCursor(event.clientX, event.clientY);
    this.#toolState.onHoveringMouseMove(event);
  };

  onPressedMouseMove = (event: MouseEvent) => {
    event.preventDefault();
    this.#toolState.onPressedMouseMove(event);
    this.updateCursor(event.clientX, event.clientY);
    this.#firstMove = false;
    this.#pressedMouseMoved = true;
  };

  onMouseUp = (event: MouseEvent) => {
    event.preventDefault();
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
}
