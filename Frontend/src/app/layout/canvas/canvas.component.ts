import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener,
} from '@angular/core';

import { Mode } from '../toolbar/toolbar.component';

import { Drawing } from './Drawings/Drawing';
import { Point, Rect } from './Geometry';
import { Shape } from './Shapes/Shape';
import { FilledRectStyle } from './ShapeStyles/FilledRectStyle';
import { LineStyle } from './ShapeStyles/LineStyle';
import { StrokedRectStyle } from './ShapeStyles/StrokedRectStyle';
import { CanvasToolState } from './States/CanvasToolState';
import { FilledRectToolState } from './States/FilledRectToolState';
import { HandToolState } from './States/HandToolState';
import { PenToolState } from './States/PenToolState';
import { SelectToolState } from './States/SelectToolState';
import { StrokedRectToolState } from './States/StrokedRectToolState';

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

  #shapes: Shape[] = [];

  #drawings: Drawing[] = [];
  #currentDrawing: Drawing | null = null;

  #scale = 1;
  #prevScale = 1;
  #targetScale = 1;
  #minScale = 0.1;
  #maxScale = 5;

  #origin: Point = [0, 0];
  #prevOrigin: Point = [0, 0];
  #targetOrigin: Point = [0, 0];

  #cursor: Point = [0, 0];

  #prevCursor: Point = [0, 0];
  #startCursor: Point = [0, 0];

  #trueRect: Rect = [0, 0, 0, 0];

  #zoomFactor = 1.5;
  #isZooming = false;

  #moveFactor = 0.2;
  #moveSmoothFactor = 0.05;
  #isMovingHorizontally = false;
  #isMovingVertically = false;
  #moveEnabled = true;

  #dragStart: Point = [0, 0];

  #firstMove = false;
  #pressedMouseMoved = false;

  #mouseDown = false;
  #leftMouseDown = false;

  #lineStyle: LineStyle = { color: '#000', width: 8, cap: 'round' };
  #filledRectStyle: FilledRectStyle = { color: '#000' };
  #strokedRectStyle: StrokedRectStyle = {
    color: '#000',
    lineWidth: 8,
    cap: 'round',
  };

  #smoothLine = true;
  #smoothLineFactor = 4;

  ngAfterViewInit() {
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

  get lineStyle() {
    return this.#lineStyle;
  }

  get filledRectStyle() {
    return this.#filledRectStyle;
  }

  get strokedRectStyle() {
    return this.#strokedRectStyle;
  }

  get smoothLine() {
    return this.#smoothLine;
  }

  get smoothLineFactor() {
    return this.#smoothLineFactor;
  }

  changeMode(mode: Mode) {
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
    }
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

  private animateZoom() {
    this.#origin[0] +=
      (this.#targetOrigin[0] - this.#prevOrigin[0]) * this.#moveSmoothFactor;
    this.#origin[1] +=
      (this.#targetOrigin[1] - this.#prevOrigin[1]) * this.#moveSmoothFactor;
    this.#scale +=
      (this.#targetScale - this.#prevScale) * this.#moveSmoothFactor;
    this.renderCanvas(true, true);
    if (
      this.#isZooming &&
      (this.#targetScale - this.#prevScale) *
        (this.#scale - this.#targetScale) <
        0
    ) {
      requestAnimationFrame(() => this.animateZoom());
    } else {
      this.#isZooming = false;
    }
  }

  private animateMoveHorizontally(event: MouseEvent) {
    const prevOriginX = this.#origin[0];
    const prevOriginY = this.#origin[1];
    this.#origin[0] +=
      (this.#targetOrigin[0] - this.#prevOrigin[0]) * this.#moveSmoothFactor;
    if (this.#leftMouseDown) {
      this.updateCursor(
        this.#cursor[0] * this.#scale + prevOriginX,
        this.#cursor[1] * this.#scale + prevOriginY
      );
      this.#toolState.onPressedMouseMove(event);
    }
    this.renderCanvas(true, true);
    if (
      this.#isMovingHorizontally &&
      (this.#targetOrigin[0] - this.#prevOrigin[0]) *
        (this.#origin[0] - this.#targetOrigin[0]) <
        0
    ) {
      requestAnimationFrame(() => this.animateMoveHorizontally(event));
    } else {
      this.#isMovingHorizontally = false;
      if (!this.#mouseDown) {
        this.#toolState.onHoveringMouseMove(event);
      }
    }
  }

  private animateMoveVertically(event: MouseEvent) {
    const prevOriginX = this.#origin[0];
    const prevOriginY = this.#origin[1];
    this.#origin[1] +=
      (this.#targetOrigin[1] - this.#prevOrigin[1]) * this.#moveSmoothFactor;
    this.updateCursor(
      this.#cursor[0] * this.#scale + prevOriginX,
      this.#cursor[1] * this.#scale + prevOriginY
    );
    if (this.#leftMouseDown) {
      this.#toolState.onPressedMouseMove(event);
    }
    this.renderCanvas(true, true);
    if (
      this.#isMovingVertically &&
      (this.#targetOrigin[1] - this.#prevOrigin[1]) *
        (this.#origin[1] - this.#targetOrigin[1]) <
        0
    ) {
      requestAnimationFrame(() => this.animateMoveVertically(event));
    } else {
      this.#isMovingVertically = false;
      if (!this.#mouseDown) {
        this.#toolState.onHoveringMouseMove(event);
      }
    }
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
          shape.render(this.#mainCtx, this.#trueRect);
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

  private zoom(event: WheelEvent) {
    const delta = event.deltaY < 0 ? this.#zoomFactor : 1 / this.#zoomFactor;

    const newScale = this.#scale * delta;

    if (newScale < this.#minScale || newScale > this.#maxScale) {
      return;
    }

    this.#prevOrigin[0] = this.#origin[0];
    this.#prevOrigin[1] = this.#origin[1];
    this.#targetOrigin[0] =
      event.pageX - (event.pageX - this.#origin[0]) * (newScale / this.#scale);
    this.#targetOrigin[1] =
      event.pageY - (event.pageY - this.#origin[1]) * (newScale / this.#scale);

    this.#prevScale = this.#scale;
    this.#targetScale = newScale;

    if (!this.#isZooming) {
      this.#isZooming = true;
      this.animateZoom();
    }
  }

  private moveHorizontally(event: WheelEvent) {
    const delta = event.deltaY < 0 ? this.#moveFactor : -this.#moveFactor;
    this.#prevOrigin[0] = this.#origin[0];
    this.#targetOrigin[0] =
      this.#origin[0] + this.#mainCtx.canvas.height * delta;
    if (!this.#isMovingHorizontally) {
      this.#isMovingHorizontally = true;
      this.animateMoveHorizontally(event);
    }
  }

  private moveVertically(event: WheelEvent) {
    const delta = event.deltaY < 0 ? this.#moveFactor : -this.#moveFactor;
    this.#prevOrigin[1] = this.#origin[1];
    this.#targetOrigin[1] =
      this.#origin[1] + this.#mainCtx.canvas.height * delta;
    if (!this.#isMovingVertically) {
      this.#isMovingVertically = true;
      this.animateMoveVertically(event);
    }
  }

  onWheel = (event: WheelEvent) => {
    event.preventDefault();
    if (!this.#moveEnabled) {
      return;
    }
    if (event.ctrlKey) {
      this.zoom(event);
    } else if (event.shiftKey) {
      this.moveHorizontally(event);
    } else {
      this.moveVertically(event);
    }
  };

  onMouseDown = (event: MouseEvent) => {
    event.preventDefault();
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
