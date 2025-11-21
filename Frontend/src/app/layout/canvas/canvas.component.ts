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
import { FilledRectDrawing } from './Drawings/FilledRectDrawing';
import { LineDrawing, smoothLine } from './Drawings/LineDrawing';
import { StrokedRectDrawing } from './Drawings/StrokedRectDrawing';
import { Point, Rect } from './Geometry';
import { SelectedMultiShape } from './Selected/SelectedMultiShape';
import { SelectedShape, Resize } from './Selected/SelectedShape';
import { SelectRect } from './Selected/SelectRect';
import { Shape } from './Shapes/Shape';
import { FilledRectStyle } from './ShapeStyles/FilledRectStyle';
import { LineStyle } from './ShapeStyles/LineStyle';
import { StrokedRectStyle } from './ShapeStyles/StrokedRectStyle';

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
  mainCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tmpCanvas', { static: true })
  tmpCanvasRef!: ElementRef<HTMLCanvasElement>;
  private mainCtx!: CanvasRenderingContext2D;
  private tmpCtx!: CanvasRenderingContext2D;

  private mode!: Mode;

  private shapes: Shape[] = [];
  private drawings: Drawing[] = [];
  private currentDrawing: Drawing | null = null;

  private selectedShape: SelectedShape | SelectedMultiShape | null = null;
  private selectRect: SelectRect | null = null;
  private selectedAction = false;

  private scale = 1;
  private prevScale = 1;
  private targetScale = 1;
  private minScale = 0.1;
  private maxScale = 5;

  private origin: Point = [0, 0];
  private prevOrigin: Point = [0, 0];
  private targetOrigin: Point = [0, 0];

  private cursor: Point = [0, 0];
  private prevCursor: Point = [0, 0];
  private startCursor: Point = [0, 0];

  private trueRect: Rect = [0, 0, 0, 0];

  private zoomFactor = 1.5;
  private isZooming = false;

  private moveFactor = 0.2;
  private moveSmoothFactor = 0.05;
  private isMovingHorizontally = false;
  private isMovingVertically = false;
  private moveEnabled = true;

  private dragStart: Point = [0, 0];

  private firstMove = false;
  private pressedMouseMoved = false;

  private mouseDown = false;
  private leftMouseDown = false;

  private lineStyle: LineStyle = { color: '#000', width: 8, cap: 'round' };
  private filledRectStyle: FilledRectStyle = { color: '#000' };
  private strokedRectStyle: StrokedRectStyle = {
    color: '#000',
    lineWidth: 8,
    cap: 'round',
  };

  private smoothLine = true;
  private smoothLineFactor = 4;

  ngAfterViewInit() {
    const mainCanvas = this.mainCanvasRef.nativeElement;
    this.mainCtx = mainCanvas.getContext('2d')!;
    const tmpCanvas = this.tmpCanvasRef.nativeElement;
    this.tmpCtx = tmpCanvas.getContext('2d')!;

    this.changeToHover();
    this.cursorOnChangeMode();
    this.renderCanvas(true, true);
  }

  changeMode(mode: Mode) {
    this.mode = mode;
    this.unSelectShape();
    if (this.tmpCtx) {
      this.cursorOnChangeMode();
    }
  }

  selectSingleShape(shape: Shape) {
    this.unSelectShape();
    const idx = this.shapes.indexOf(shape);
    if (idx !== -1) {
      this.shapes.splice(idx, 1);
    }
    this.selectedShape = new SelectedShape(shape);
  }

  selectAdditionalShape(shape: Shape) {
    const idx = this.shapes.indexOf(shape);
    if (idx !== -1) {
      this.shapes.splice(idx, 1);
    }
    if (
      this.selectedShape &&
      this.selectedShape instanceof SelectedMultiShape
    ) {
      this.selectedShape.shape.addShape(shape);
    } else if (this.selectedShape) {
      const firstShape = this.selectedShape.shape;
      this.selectedShape = new SelectedMultiShape([firstShape, shape]);
    } else {
      this.selectedShape = new SelectedMultiShape([shape]);
    }
  }

  selectedMultipleShapes(shapes: Shape[]) {
    if (shapes.length > 0) {
      if (shapes.length == 1) {
        this.selectSingleShape(shapes[0]);
      } else {
        this.shapes = this.shapes.filter(shape => !shapes.includes(shape));
        this.selectedShape = new SelectedMultiShape(shapes);
      }
    }
  }

  unSelectShape() {
    if (this.selectedShape) {
      if (this.selectedShape instanceof SelectedMultiShape) {
        for (const shape of this.selectedShape.shape.shapes) {
          this.shapes.push(shape);
        }
        this.selectedShape.shape.removeAllShapes();
      } else {
        this.shapes.push(this.selectedShape.shape);
      }
      this.selectedShape = null;
    }
  }

  cursorOnChangeMode() {
    if (this.mode == Mode.Hand) {
      this.tmpCtx.canvas.style.cursor = 'grab';
    } else {
      this.tmpCtx.canvas.style.cursor = 'default';
    }
  }

  changeToHover() {
    this.mouseDown = false;
    this.leftMouseDown = false;
  }

  changeToMouseDown() {
    this.mouseDown = true;
  }

  @HostListener('window:mousemove', ['$event'])
  handleWindowMouseMove(event: MouseEvent) {
    if (!this.mouseDown) {
      return;
    }
    this.onPressedMouseMove(event);
  }

  @HostListener('window:mouseup', ['$event'])
  handleWindowMouseUp(event: MouseEvent) {
    if (!this.mouseDown) {
      return;
    }
    this.onMouseUp(event);
  }

  @HostListener('window:blur')
  handleWindowBlur() {
    this.onWindowBlur();
  }

  animateZoom() {
    this.origin[0] +=
      (this.targetOrigin[0] - this.prevOrigin[0]) * this.moveSmoothFactor;
    this.origin[1] +=
      (this.targetOrigin[1] - this.prevOrigin[1]) * this.moveSmoothFactor;
    this.scale += (this.targetScale - this.prevScale) * this.moveSmoothFactor;
    this.renderCanvas(true, true);
    if (
      this.isZooming &&
      (this.targetScale - this.prevScale) * (this.scale - this.targetScale) < 0
    ) {
      requestAnimationFrame(() => this.animateZoom());
    } else {
      this.isZooming = false;
    }
  }

  animateMoveHorizontally() {
    const prevOriginX = this.origin[0];
    const prevOriginY = this.origin[1];
    this.origin[0] +=
      (this.targetOrigin[0] - this.prevOrigin[0]) * this.moveSmoothFactor;
    if (this.leftMouseDown) {
      this.updateCursor(
        this.cursor[0] * this.scale + prevOriginX,
        this.cursor[1] * this.scale + prevOriginY
      );
      switch (this.mode) {
        case Mode.Select:
          this.mousePressSelectMode();
          break;
        case Mode.Pen:
        case Mode.FilledRect:
        case Mode.StrokedRect:
          this.mousePressDrawMode();
          break;
      }
    }
    this.renderCanvas(true, true);
    if (
      this.isMovingHorizontally &&
      (this.targetOrigin[0] - this.prevOrigin[0]) *
        (this.origin[0] - this.targetOrigin[0]) <
        0
    ) {
      requestAnimationFrame(() => this.animateMoveHorizontally());
    } else {
      this.isMovingHorizontally = false;
      if (this.mode == Mode.Select) {
        this.hoverSelectedShape();
      }
    }
  }

  animateMoveVertically() {
    const prevOriginX = this.origin[0];
    const prevOriginY = this.origin[1];
    this.origin[1] +=
      (this.targetOrigin[1] - this.prevOrigin[1]) * this.moveSmoothFactor;
    this.updateCursor(
      this.cursor[0] * this.scale + prevOriginX,
      this.cursor[1] * this.scale + prevOriginY
    );
    if (this.leftMouseDown) {
      switch (this.mode) {
        case Mode.Select:
          this.mousePressSelectMode();
          break;
        case Mode.Pen:
        case Mode.FilledRect:
        case Mode.StrokedRect:
          this.mousePressDrawMode();
          break;
      }
    }
    this.renderCanvas(true, true);
    if (
      this.isMovingVertically &&
      (this.targetOrigin[1] - this.prevOrigin[1]) *
        (this.origin[1] - this.targetOrigin[1]) <
        0
    ) {
      requestAnimationFrame(() => this.animateMoveVertically());
    } else {
      this.isMovingVertically = false;
      if (this.mode == Mode.Select) {
        this.hoverSelectedShape();
      }
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.renderCanvas(true, true);
  }

  renderCanvas(main: boolean, tmp: boolean) {
    const originX = -this.origin[0] / this.scale;
    const originY = -this.origin[1] / this.scale;
    const xMax = originX + window.innerWidth / this.scale;
    const yMax = originY + window.innerHeight / this.scale;
    this.trueRect = [originX, originY, xMax, yMax];

    if (main) {
      this.mainCtx.canvas.width = window.innerWidth;
      this.mainCtx.canvas.height = window.innerHeight;
      this.mainCtx.save();

      this.mainCtx.clearRect(
        0,
        0,
        this.mainCtx.canvas.width,
        this.mainCtx.canvas.height
      );

      this.mainCtx.translate(this.origin[0], this.origin[1]);
      this.mainCtx.scale(this.scale, this.scale);
      for (const shape of this.shapes) {
        if (this.shapeInside(shape)) {
          shape.render(this.mainCtx, this.trueRect);
        }
      }

      this.mainCtx.restore();
    }

    if (tmp) {
      this.tmpCtx.canvas.width = window.innerWidth;
      this.tmpCtx.canvas.height = window.innerHeight;
      this.tmpCtx.save();

      this.tmpCtx.clearRect(
        0,
        0,
        this.tmpCtx.canvas.width,
        this.tmpCtx.canvas.height
      );

      this.tmpCtx.translate(this.origin[0], this.origin[1]);
      this.tmpCtx.scale(this.scale, this.scale);

      for (const drawing of this.drawings) {
        drawing.render(this.tmpCtx);
      }
      if (this.selectedShape) {
        this.selectedShape.render(this.tmpCtx, this.scale, this.trueRect);
      }
      if (this.selectRect) {
        this.selectRect.render(this.tmpCtx, this.scale);
        const shapes = this.shapesInsideSelectRect();
        this.selectRect.renderShapeOutlines(this.tmpCtx, this.scale, shapes);
      }

      this.tmpCtx.restore();
    }
  }

  zoom(event: WheelEvent) {
    const delta = event.deltaY < 0 ? this.zoomFactor : 1 / this.zoomFactor;

    const newScale = this.scale * delta;

    if (newScale < this.minScale || newScale > this.maxScale) {
      return;
    }

    this.prevOrigin[0] = this.origin[0];
    this.prevOrigin[1] = this.origin[1];
    this.targetOrigin[0] =
      event.pageX - (event.pageX - this.origin[0]) * (newScale / this.scale);
    this.targetOrigin[1] =
      event.pageY - (event.pageY - this.origin[1]) * (newScale / this.scale);

    this.prevScale = this.scale;
    this.targetScale = newScale;

    if (!this.isZooming) {
      this.isZooming = true;
      this.animateZoom();
    }
  }

  moveHorizontally(event: WheelEvent) {
    const delta = event.deltaY < 0 ? this.moveFactor : -this.moveFactor;
    this.prevOrigin[0] = this.origin[0];
    this.targetOrigin[0] = this.origin[0] + this.mainCtx.canvas.height * delta;
    if (!this.isMovingHorizontally) {
      this.isMovingHorizontally = true;
      this.animateMoveHorizontally();
    }
  }

  moveVertically(event: WheelEvent) {
    const delta = event.deltaY < 0 ? this.moveFactor : -this.moveFactor;
    this.prevOrigin[1] = this.origin[1];
    this.targetOrigin[1] = this.origin[1] + this.mainCtx.canvas.height * delta;
    if (!this.isMovingVertically) {
      this.isMovingVertically = true;
      this.animateMoveVertically();
    }
  }

  onWheel = (event: WheelEvent) => {
    event.preventDefault();
    if (!this.moveEnabled) {
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
    this.leftMouseDown = event.button == 0 ? true : false;
    this.changeToMouseDown();
    this.dragStart[0] = event.clientX - this.origin[0];
    this.dragStart[1] = event.clientY - this.origin[1];
    this.prevCursor[0] = this.cursor[0];
    this.prevCursor[1] = this.cursor[1];
    this.cursor[0] = this.dragStart[0] / this.scale;
    this.cursor[1] = this.dragStart[1] / this.scale;
    this.startCursor[0] = this.cursor[0];
    this.startCursor[1] = this.cursor[1];
    this.firstMove = true;

    if (this.mode == Mode.Hand) {
      this.moveEnabled = false;
      this.tmpCtx.canvas.style.cursor = 'grabbing';
    }

    if (this.leftMouseDown && this.mode == Mode.Select) {
      const gotSelectedShape = this.mouseDownSelectedShape();
      if (!gotSelectedShape) {
        const shape = this.findSelectedShape(this.cursor);
        if (shape) {
          if (event.shiftKey && this.selectedShape) {
            this.selectAdditionalShape(shape);
          } else {
            this.selectSingleShape(shape);
          }
          if (this.selectedShape) {
            this.selectedShape.dragged = true;
          }
        } else {
          this.unSelectShape();
        }
        this.selectedAction = true;
      }
    }
    this.renderCanvas(true, true);
  };

  mouseDownSelectedShape(): boolean {
    if (this.selectedShape) {
      if (
        this.selectedShape.pointInside(
          this.mainCtx,
          this.cursor[0],
          this.cursor[1]
        )
      ) {
        this.selectedShape.dragged = true;
        return true;
      }
      if (
        this.selectedShape.pointOnTopLine(
          this.mainCtx,
          this.cursor[0],
          this.cursor[1]
        )
      ) {
        this.selectedShape.resized = Resize.Top;
        return true;
      }
      if (
        this.selectedShape.pointOnBottomLine(
          this.mainCtx,
          this.cursor[0],
          this.cursor[1]
        )
      ) {
        this.selectedShape.resized = Resize.Bottom;
        return true;
      }
      if (
        this.selectedShape.pointOnLeftLine(
          this.mainCtx,
          this.cursor[0],
          this.cursor[1]
        )
      ) {
        this.selectedShape.resized = Resize.Left;
        return true;
      }
      if (
        this.selectedShape.pointOnRightLine(
          this.mainCtx,
          this.cursor[0],
          this.cursor[1]
        )
      ) {
        this.selectedShape.resized = Resize.Right;
        return true;
      }
      if (
        this.selectedShape.pointOnTopLeftCorner(
          this.mainCtx,
          this.cursor[0],
          this.cursor[1]
        )
      ) {
        this.selectedShape.resized = Resize.TopLeft;
        return true;
      }
      if (
        this.selectedShape.pointOnTopRightCorner(
          this.mainCtx,
          this.cursor[0],
          this.cursor[1]
        )
      ) {
        this.selectedShape.resized = Resize.TopRight;
        return true;
      }
      if (
        this.selectedShape.pointOnBottomLeftCorner(
          this.mainCtx,
          this.cursor[0],
          this.cursor[1]
        )
      ) {
        this.selectedShape.resized = Resize.BottomLeft;
        return true;
      }
      if (
        this.selectedShape.pointOnBottomRightCorner(
          this.mainCtx,
          this.cursor[0],
          this.cursor[1]
        )
      ) {
        this.selectedShape.resized = Resize.BottomRight;
        return true;
      }
    }
    return false;
  }

  onHoveringMouseMove = (event: MouseEvent) => {
    if (!this.tmpCtx || this.mouseDown) {
      return;
    }
    event.preventDefault();
    this.updateCursor(event.clientX, event.clientY);
    if (this.mode == Mode.Select) {
      this.hoverSelectedShape();
    }
  };

  onPressedMouseMove = (event: MouseEvent) => {
    event.preventDefault();
    let main = false;
    let tmp = false;
    this.updateCursor(event.clientX, event.clientY);
    switch (this.mode) {
      case Mode.Hand:
        this.mousePressHandMode(event);
        main = true;
        break;
      case Mode.Pen:
      case Mode.FilledRect:
      case Mode.StrokedRect:
        this.mousePressDrawMode();
        tmp = true;
        break;
      case Mode.Select:
        this.mousePressSelectMode();
        tmp = true;
        break;
    }
    this.firstMove = false;
    this.pressedMouseMoved = true;
    this.renderCanvas(main, tmp);
  };

  onMouseUp = (event: MouseEvent) => {
    event.preventDefault();
    if (this.leftMouseDown) {
      if (this.currentDrawing) {
        if (this.smoothLine && this.currentDrawing instanceof LineDrawing) {
          this.currentDrawing.points = smoothLine(
            this.currentDrawing.points,
            this.smoothLineFactor
          );
        }
        this.shapes.push(this.currentDrawing.toShape());
        const idx = this.drawings.indexOf(this.currentDrawing);
        this.currentDrawing = null;
        if (idx !== -1) {
          this.drawings.splice(idx, 1);
        }
        this.renderCanvas(true, true);
      }
      if (this.mode == Mode.Select) {
        if (this.selectedShape) {
          this.selectedShape.dragged = false;
          this.selectedShape.resized = Resize.None;
        }
        if (!this.pressedMouseMoved) {
          if (
            this.selectedShape &&
            !this.selectedAction &&
            this.selectedShape.pointInside(
              this.tmpCtx,
              this.cursor[0],
              this.cursor[1]
            )
          ) {
            let insideShape = false;
            if (this.selectedShape instanceof SelectedMultiShape) {
              const localX = this.selectedShape.shape.toLocalX(this.cursor[0]);
              const localY = this.selectedShape.shape.toLocalY(this.cursor[1]);
              for (const shape of this.selectedShape.shape.shapes) {
                if (shape.pointInside(this.tmpCtx, localX, localY)) {
                  insideShape = true;
                  this.selectSingleShape(shape);
                  this.renderCanvas(true, true);
                  break;
                }
              }
            } else if (
              this.selectedShape.shape.pointInside(
                this.tmpCtx,
                this.cursor[0],
                this.cursor[1]
              )
            ) {
              insideShape = true;
            }

            if (!insideShape) {
              const shape = this.findSelectedShape(this.cursor);
              if (shape) {
                if (event.shiftKey) {
                  this.selectAdditionalShape(shape);
                } else {
                  this.selectSingleShape(shape);
                }
              } else {
                this.unSelectShape();
              }
              this.renderCanvas(true, true);
            }
          }
        }
        if (this.selectRect) {
          this.selectFromRect();
          this.renderCanvas(false, true);
        }
      }
      if (this.mode == Mode.Hand) {
        this.moveEnabled = true;
        this.tmpCtx.canvas.style.cursor = 'grab';
      }
    }
    this.firstMove = false;
    this.pressedMouseMoved = false;
    this.selectedAction = false;
    this.changeToHover();
  };

  onWindowBlur = () => {
    this.firstMove = false;
    this.changeToHover();
  };

  selectFromRect() {
    if (this.selectRect) {
      this.selectedMultipleShapes(this.shapesInsideSelectRect());
      this.selectRect = null;
    }
  }

  shapesInsideSelectRect() {
    const shapes: Shape[] = [];
    if (this.selectRect) {
      const trueSelectRect: Rect = [
        Math.min(this.selectRect.p0[0], this.selectRect.p1[0]),
        Math.min(this.selectRect.p0[1], this.selectRect.p1[1]),
        Math.max(this.selectRect.p0[0], this.selectRect.p1[0]),
        Math.max(this.selectRect.p0[1], this.selectRect.p1[1]),
      ];
      for (const shape of this.shapes) {
        const shapeTrueRect = shape.trueRect();
        if (
          this.shapeInside(shape) &&
          shapeTrueRect[0] >= trueSelectRect[0] &&
          shapeTrueRect[1] >= trueSelectRect[1] &&
          shapeTrueRect[2] <= trueSelectRect[2] &&
          shapeTrueRect[3] <= trueSelectRect[3]
        ) {
          shapes.push(shape);
        }
      }
    }
    return shapes;
  }

  findSelectedShape(p: Point): Shape | null {
    for (let i = this.shapes.length - 1; i >= 0; i--) {
      if (
        this.shapeInside(this.shapes[i]) &&
        this.shapes[i].pointInside(this.mainCtx, p[0], p[1])
      ) {
        return this.shapes[i];
      }
    }
    return null;
  }

  mousePressHandMode(event: MouseEvent) {
    this.origin[0] = event.clientX - this.dragStart[0];
    this.origin[1] = event.clientY - this.dragStart[1];
  }

  mousePressDrawMode() {
    switch (this.mode) {
      case Mode.Pen:
        if (this.firstMove) {
          this.currentDrawing = new LineDrawing(
            [
              [this.prevCursor[0], this.prevCursor[1]],
              [this.cursor[0], this.cursor[1]],
            ],
            this.lineStyle
          );
          this.drawings.push(this.currentDrawing);
        } else if (this.currentDrawing) {
          this.currentDrawing.update(this.cursor);
        }
        break;
      case Mode.FilledRect:
        if (this.firstMove) {
          this.currentDrawing = new FilledRectDrawing(
            this.startCursor,
            this.cursor,
            this.filledRectStyle
          );
          this.drawings.push(this.currentDrawing);
        }
        break;
      case Mode.StrokedRect:
        if (this.firstMove) {
          this.currentDrawing = new StrokedRectDrawing(
            this.startCursor,
            this.cursor,
            this.strokedRectStyle
          );
          this.drawings.push(this.currentDrawing);
        }
        break;
    }
  }

  mousePressSelectMode() {
    if (this.selectedShape && this.selectedShape.dragged) {
      const dx = this.cursor[0] - this.prevCursor[0];
      const dy = this.cursor[1] - this.prevCursor[1];
      this.selectedShape.move(dx, dy);
    } else if (
      this.selectedShape &&
      this.selectedShape.resized != Resize.None
    ) {
      this.selectedShape.resize(this.cursor);
    } else if (this.firstMove) {
      this.selectRect = new SelectRect(this.startCursor, this.cursor);
    }
  }

  hoverSelectedShape() {
    if (
      this.selectedShape &&
      this.selectedShape.pointInside(
        this.mainCtx,
        this.cursor[0],
        this.cursor[1]
      )
    ) {
      this.tmpCtx.canvas.style.cursor = 'move';
    } else if (
      this.selectedShape &&
      (this.selectedShape.pointOnTopLine(
        this.mainCtx,
        this.cursor[0],
        this.cursor[1]
      ) ||
        this.selectedShape.pointOnBottomLine(
          this.mainCtx,
          this.cursor[0],
          this.cursor[1]
        ))
    ) {
      this.tmpCtx.canvas.style.cursor = 'ns-resize';
    } else if (
      this.selectedShape &&
      (this.selectedShape.pointOnLeftLine(
        this.mainCtx,
        this.cursor[0],
        this.cursor[1]
      ) ||
        this.selectedShape.pointOnRightLine(
          this.mainCtx,
          this.cursor[0],
          this.cursor[1]
        ))
    ) {
      this.tmpCtx.canvas.style.cursor = 'ew-resize';
    } else if (
      this.selectedShape &&
      (this.selectedShape.pointOnTopLeftCorner(
        this.mainCtx,
        this.cursor[0],
        this.cursor[1]
      ) ||
        this.selectedShape.pointOnBottomRightCorner(
          this.mainCtx,
          this.cursor[0],
          this.cursor[1]
        ))
    ) {
      if (
        this.selectedShape.shape.horizontalInverted !==
        this.selectedShape.shape.verticallyInverted
      ) {
        this.tmpCtx.canvas.style.cursor = 'nesw-resize';
      } else {
        this.tmpCtx.canvas.style.cursor = 'nwse-resize';
      }
    } else if (
      this.selectedShape &&
      (this.selectedShape.pointOnTopRightCorner(
        this.mainCtx,
        this.cursor[0],
        this.cursor[1]
      ) ||
        this.selectedShape.pointOnBottomLeftCorner(
          this.mainCtx,
          this.cursor[0],
          this.cursor[1]
        ))
    ) {
      if (
        this.selectedShape.shape.horizontalInverted !==
        this.selectedShape.shape.verticallyInverted
      ) {
        this.tmpCtx.canvas.style.cursor = 'nwse-resize';
      } else {
        this.tmpCtx.canvas.style.cursor = 'nesw-resize';
      }
    } else if (this.mode == Mode.Select) {
      if (this.findSelectedShape(this.cursor)) {
        this.tmpCtx.canvas.style.cursor = 'move';
      } else {
        this.tmpCtx.canvas.style.cursor = 'default';
      }
    } else {
      this.tmpCtx.canvas.style.cursor = 'default';
    }
  }

  updateCursor(screenX: number, screenY: number) {
    this.prevCursor[0] = this.cursor[0];
    this.prevCursor[1] = this.cursor[1];
    this.cursor[0] = (screenX - this.origin[0]) / this.scale;
    this.cursor[1] = (screenY - this.origin[1]) / this.scale;
  }

  shapeInside(shape: Shape) {
    return this.rectsOverlap(shape.trueRect(), this.trueRect);
  }

  rectsOverlap(a: Rect, b: Rect): boolean {
    if (a[2] < b[0] || b[2] < a[0]) return false;
    if (a[3] < b[1] || b[3] < a[1]) return false;
    return true;
  }
}
