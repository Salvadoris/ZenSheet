import { signal } from '@angular/core';

import { CanvasComponent } from '../canvas.component';
import { Point, Rect } from '../Geometry';
import { SelectedMultiShape } from '../Selected/SelectedMultiShape';
import { Resize, SelectedShape } from '../Selected/SelectedShape';
import { SelectRect } from '../Selected/SelectRect';
import { SerializedShape } from '../Serializer/ShapeSerializer';
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
import { GroupShape } from '../Shapes/GroupShape';
import { Shape } from '../Shapes/Shape';
import { TextBoxShape } from '../Shapes/TextBoxShape';
import { ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';
import { TextBoxStyle } from '../ShapeStyles/TextBoxStyle';

import { CanvasToolState } from './CanvasToolState';

export interface CopiedShape {
  type: CopyShapeType;
  shape: SerializedShape;
}

enum CopyShapeType {
  MultiShape = 'MultiShape',
  Shape = 'Shape',
}

export class SelectToolState extends CanvasToolState {
  #selectedShape: SelectedShape | SelectedMultiShape | null = null;
  #pastePosition: Point | null = null;
  #selectRect: SelectRect | null = null;
  #selectedAction = false;

  contextMenuPosition: Point = [0, 0];

  selectedShapeChange = signal<SelectedShape | undefined>(undefined);
  shapeContextMenuVisible = false;

  canvasContextMenuVisible = false;

  constructor(canvas: CanvasComponent) {
    super(canvas);
    this.canvas.removeCurrentStyle();
    if (this.canvas.tmpCtx) {
      this.canvas.changeCursor('default');
    }
  }

  showShapeContextMenu(x: number, y: number) {
    if (this.#selectedShape) {
      this.selectedShapeChange.set(this.#selectedShape);
      this.contextMenuPosition = [x, y];
      this.shapeContextMenuVisible = true;
    }
  }

  showCanvasContextMenu(x: number, y: number) {
    this.contextMenuPosition = [x, y];
    this.canvasContextMenuVisible = true;
  }

  hideContextMenu() {
    if (this.shapeContextMenuVisible) {
      this.selectedShapeChange.set(undefined);
      this.shapeContextMenuVisible = false;
    }
    if (this.canvasContextMenuVisible) {
      this.canvasContextMenuVisible = false;
    }
  }

  override setStyleProperty(styleProperty: ShapeStyleProperty): void {
    if (this.#selectedShape) {
      const properties =
        this.#selectedShape.shape.setStyleProperty(styleProperty);
      this.canvas.changeShapesProperties(
        [this.#selectedShape.shape.properties[ShapePropertyName.id]],
        properties
      );
      this.canvas.renderCanvas(true, true);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override renderMain(): void {}

  override renderTmp() {
    if (this.#selectedShape) {
      this.#selectedShape.render(this.canvas.scale, this.canvas.trueRect);
    }
    if (this.#selectRect) {
      this.#selectRect.render(this.canvas.tmpCtx, this.canvas.scale);
      const shapes = this.shapesInsideSelectRect();
      this.#selectRect.renderShapeOutlines(
        this.canvas.tmpCtx,
        this.canvas.scale,
        shapes
      );
    }
  }

  override remove(): void {
    this.unSelectShape();
    this.canvas.renderCanvas(true, true);
  }

  override onMouseDown(event: MouseEvent): void {
    this.hideContextMenu();
    if (this.canvas.leftmouseDown) {
      const gotSelectedShape = this.mouseDownSelectedShape();
      if (!gotSelectedShape) {
        const shape = this.findSelectedShape(this.canvas.cursor);
        if (shape) {
          if (event.shiftKey && this.#selectedShape) {
            this.selectAdditionalShape(shape);
          } else {
            this.selectSingleShape(shape);
          }
          if (this.#selectedShape) {
            this.#selectedShape.dragged = true;
            this.#selectedShape.originFromCursor = [
              this.#selectedShape.shape.originX - this.canvas.startCursor[0],
              this.#selectedShape.shape.originY - this.canvas.startCursor[1],
            ];
          }
        } else {
          this.unSelectShape();
        }
        this.#selectedAction = true;
      }
    }
  }

  override onPressedMouseMove(_event: MouseEvent): void {
    if (this.canvas.leftmouseDown) {
      if (this.#selectedShape && this.#selectedShape.dragged) {
        const moveProperties = this.#selectedShape.moveTo(
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        );
        this.canvas.changeShapesProperties(
          [this.#selectedShape.shape.properties[ShapePropertyName.id]],
          moveProperties
        );
      } else if (
        this.#selectedShape &&
        this.#selectedShape.resized != Resize.None
      ) {
        const resizeProperties = this.#selectedShape.resize([
          this.canvas.cursor[0],
          this.canvas.cursor[1],
        ]);
        this.canvas.changeShapesProperties(
          [this.#selectedShape.shape.properties[ShapePropertyName.id]],
          resizeProperties
        );
      } else if (this.canvas.firstMove) {
        this.#selectRect = new SelectRect(
          [this.canvas.startCursor[0], this.canvas.startCursor[1]],
          [this.canvas.cursor[0], this.canvas.cursor[1]]
        );
      } else if (this.#selectRect) {
        this.#selectRect.update(this.canvas.cursor[0], this.canvas.cursor[1]);
      }
      this.canvas.renderCanvas(false, true);
    }
  }

  override onHoveringMouseMove(_event: MouseEvent): void {
    this.hoverSelectedShape();
  }

  override onMouseUp(event: MouseEvent): void {
    if (this.canvas.leftmouseDown) {
      if (this.#selectedShape) {
        this.#selectedShape.dragged = false;
        this.#selectedShape.resized = Resize.None;
      }
      if (!this.canvas.pressedMouseMoved && !this.shapeContextMenuVisible) {
        if (
          this.#selectedShape &&
          !this.#selectedAction &&
          this.#selectedShape.pointInside(
            this.canvas.tmpCtx,
            this.canvas.cursor[0],
            this.canvas.cursor[1]
          )
        ) {
          let insideShape = false;
          if (this.#selectedShape instanceof SelectedMultiShape) {
            const localX = this.#selectedShape.shape.toLocalX(
              this.canvas.cursor[0]
            );
            const localY = this.#selectedShape.shape.toLocalY(
              this.canvas.cursor[1]
            );
            for (const shape of this.#selectedShape.shape.shapes) {
              if (shape.pointInside(localX, localY)) {
                insideShape = true;
                this.selectSingleShape(shape);
                this.canvas.renderCanvas(true, true);
                break;
              }
            }
          } else if (
            this.#selectedShape.shape.pointInside(
              this.canvas.cursor[0],
              this.canvas.cursor[1]
            )
          ) {
            insideShape = true;
          }

          if (!insideShape) {
            const shape = this.findSelectedShape(this.canvas.cursor);
            if (shape) {
              if (event.shiftKey) {
                this.selectAdditionalShape(shape);
              } else {
                this.selectSingleShape(shape);
              }
            } else {
              this.unSelectShape();
            }
            this.canvas.renderCanvas(true, true);
          }
        }
      }
      if (this.#selectRect) {
        this.selectFromRect();
        this.canvas.renderCanvas(false, true);
      }
      this.#selectedAction = false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onKeyPress(_event: KeyboardEvent): void {}

  override onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'c':
        event.preventDefault();
        if (event.ctrlKey) {
          this.copySelectedShape();
        }
        break;
      case 'v':
        event.preventDefault();
        if (event.ctrlKey) {
          this.pasteWithOffset();
        }
        break;
      case 'Delete':
        event.preventDefault();
        this.removeSelectedShape();
        break;
    }
  }

  removeSelectedShape() {
    if (this.#selectedShape) {
      this.canvas.removeShapes([
        this.#selectedShape.shape.properties[ShapePropertyName.id],
      ]);
      this.#selectedShape = null;
      this.canvas.renderCanvas(true, true);
      this.hideContextMenu();
      this.hoverSelectedShape();
    }
  }

  copySelectedShape() {
    if (this.#selectedShape) {
      this.#pastePosition = [
        this.#selectedShape.shape.properties[ShapePropertyName.originX] +
          20 / this.canvas.scale,
        this.#selectedShape.shape.properties[ShapePropertyName.originY] +
          20 / this.canvas.scale,
      ];
      this.hideContextMenu();
      return navigator.clipboard.writeText(
        JSON.stringify({
          type:
            this.#selectedShape instanceof SelectedMultiShape
              ? CopyShapeType.MultiShape
              : CopyShapeType.Shape,
          shape: this.canvas.shapeSerializer.serialized(
            this.#selectedShape.shape
          ),
        } as CopiedShape)
      );
    }
    return undefined;
  }

  pasteShapeAtContextMenuPosition() {
    this.hideContextMenu();
    this.pasteShapeFromClipBoard([
      (this.contextMenuPosition[0] - this.canvas.origin[0]) / this.canvas.scale,
      (this.contextMenuPosition[1] - this.canvas.origin[1]) / this.canvas.scale,
    ]).then(() => {
      this.canvas.renderCanvas(true, true);
    });
  }

  private pasteWithOffset() {
    if (this.#pastePosition === null) {
      return;
    }
    this.pasteShapeFromClipBoard(this.#pastePosition).then(() => {
      if (this.#pastePosition === null) {
        return;
      }
      this.#pastePosition[0] += 20 / this.canvas.scale;
      this.#pastePosition[1] += 20 / this.canvas.scale;
      this.canvas.renderCanvas(true, true);
    });
  }

  duplicateSelectedShape() {
    if (this.#selectedShape) {
      this.hideContextMenu();
      this.copySelectedShape()?.then(() => {
        this.pasteWithOffset();
      });
    }
  }

  groupShapes() {
    if (
      this.#selectedShape &&
      this.#selectedShape instanceof SelectedMultiShape
    ) {
      this.#selectedShape = new SelectedShape(this.#selectedShape.shape);
      this.hideContextMenu();
      this.canvas.renderCanvas(false, true);
    }
  }

  splitGroupShape() {
    if (
      this.#selectedShape &&
      this.#selectedShape.shape instanceof GroupShape
    ) {
      const shapes = this.#selectedShape.shape.shapes;

      this.#selectedShape.shape.shapesToGlobal();
      this.canvas.removeGroupShape(this.#selectedShape.shape);
      this.selectMultipleShapes(shapes);

      this.hideContextMenu();
      this.canvas.renderCanvas(false, true);
    }
  }

  override onDoubleClick(event: MouseEvent): void {
    if (
      this.#selectedShape &&
      this.#selectedShape.shape instanceof TextBoxShape
    ) {
      this.canvas.changeToEditedTextState(event);
    }
  }

  onContextMenu(screenX: number, screenY: number): void {
    if (
      this.#selectedShape &&
      this.#selectedShape.pointInside(
        this.canvas.tmpCtx,
        this.canvas.cursor[0],
        this.canvas.cursor[1]
      )
    ) {
      this.showShapeContextMenu(screenX, screenY);
      return;
    }
    const shape = this.findSelectedShape(this.canvas.cursor);
    if (shape) {
      if (
        !(
          this.#selectedShape &&
          shape.properties[ShapePropertyName.id] ===
            this.#selectedShape.shape.properties[ShapePropertyName.id]
        )
      ) {
        this.selectSingleShape(shape);
        this.canvas.renderCanvas(true, true);
      }
      this.showShapeContextMenu(screenX, screenY);
    } else {
      this.showCanvasContextMenu(screenX, screenY);
    }
  }

  private mouseDownSelectedShape(): boolean {
    if (this.#selectedShape) {
      if (
        this.#selectedShape.pointInside(
          this.canvas.mainCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      ) {
        this.#selectedShape.dragged = true;
        this.#selectedShape.originFromCursor = [
          this.#selectedShape.shape.originX - this.canvas.startCursor[0],
          this.#selectedShape.shape.originY - this.canvas.startCursor[1],
        ];
        return true;
      }
      if (
        this.#selectedShape.pointOnTopLine(
          this.canvas.mainCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      ) {
        this.#selectedShape.resized = Resize.Top;
        return true;
      }
      if (
        this.#selectedShape.pointOnBottomLine(
          this.canvas.mainCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      ) {
        this.#selectedShape.resized = Resize.Bottom;
        return true;
      }
      if (
        this.#selectedShape.pointOnLeftLine(
          this.canvas.mainCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      ) {
        this.#selectedShape.resized = Resize.Left;
        return true;
      }
      if (
        this.#selectedShape.pointOnRightLine(
          this.canvas.mainCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      ) {
        this.#selectedShape.resized = Resize.Right;
        return true;
      }
      if (
        this.#selectedShape.pointOnTopLeftCorner(
          this.canvas.mainCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      ) {
        this.#selectedShape.resized = Resize.TopLeft;
        return true;
      }
      if (
        this.#selectedShape.pointOnTopRightCorner(
          this.canvas.mainCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      ) {
        this.#selectedShape.resized = Resize.TopRight;
        return true;
      }
      if (
        this.#selectedShape.pointOnBottomLeftCorner(
          this.canvas.mainCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      ) {
        this.#selectedShape.resized = Resize.BottomLeft;
        return true;
      }
      if (
        this.#selectedShape.pointOnBottomRightCorner(
          this.canvas.mainCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      ) {
        this.#selectedShape.resized = Resize.BottomRight;
        return true;
      }
    }
    return false;
  }

  private selectFromRect() {
    if (this.#selectRect) {
      this.selectMultipleShapes(this.shapesInsideSelectRect());
      this.#selectRect = null;
    }
  }

  private shapesInsideSelectRect() {
    const shapes: Shape[] = [];
    if (this.#selectRect) {
      const trueSelectRect: Rect = [
        Math.min(this.#selectRect.p0[0], this.#selectRect.p1[0]),
        Math.min(this.#selectRect.p0[1], this.#selectRect.p1[1]),
        Math.max(this.#selectRect.p0[0], this.#selectRect.p1[0]),
        Math.max(this.#selectRect.p0[1], this.#selectRect.p1[1]),
      ];
      for (const shape of this.canvas.shapes) {
        const shapeTrueRect = shape.trueRect();
        if (
          this.canvas.shapeInside(shape) &&
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

  private setTmpCtx(shape: Shape) {
    shape.ctx = this.canvas.tmpCtx;
    if (shape instanceof GroupShape) {
      shape.shapes.forEach(s => this.setTmpCtx(s));
    }
  }

  private setMainCtx(shape: Shape) {
    shape.ctx = this.canvas.mainCtx;
    if (shape instanceof GroupShape) {
      shape.shapes.forEach(s => this.setMainCtx(s));
    }
  }

  selectSingleShape(shape: Shape) {
    this.unSelectShape();
    this.canvas.shapes.push(
      this.canvas.shapes.splice(this.canvas.shapes.indexOf(shape), 1)[0]
    );
    this.#selectedShape = new SelectedShape(shape);
    this.setTmpCtx(shape);
    shape.properties[ShapePropertyName.edited] = true;
    shape.properties[ShapePropertyName.selected] = true;
    this.canvas.changeShapesProperties(
      [shape.properties[ShapePropertyName.id]],
      { [ShapePropertyName.edited]: true }
    );
    this.canvas.changeStyle(this.#selectedShape.shape.style);
  }

  private selectAdditionalShape(shape: Shape) {
    if (
      this.#selectedShape &&
      this.#selectedShape instanceof SelectedMultiShape
    ) {
      this.canvas.shapes.push(
        this.canvas.shapes.splice(this.canvas.shapes.indexOf(shape), 1)[0]
      );
      this.canvas.shapeToLocal(this.#selectedShape.shape, shape);
      this.#selectedShape.shape.addShape(shape);
      this.canvas.changeStyle(this.#selectedShape.shape.style);
      this.setTmpCtx(shape);
    } else if (this.#selectedShape) {
      const firstShape = this.#selectedShape.shape;
      this.unSelectShape();
      this.selectMultipleShapes([firstShape, shape]);
    } else {
      this.selectSingleShape(shape);
    }
  }

  private selectMultipleShapes(shapes: Shape[]) {
    if (shapes.length > 0) {
      if (shapes.length == 1) {
        this.selectSingleShape(shapes[0]);
      } else {
        this.canvas.shapes = this.canvas.shapes.filter(
          s => !shapes.includes(s)
        );
        this.canvas.shapes = this.canvas.shapes.concat(shapes);

        for (const shape of shapes) {
          this.setTmpCtx(shape);
        }
        this.#selectedShape = new SelectedMultiShape(
          shapes,
          this.canvas.tmpCtx
        );
        this.canvas.addGroupShape(this.#selectedShape.shape as GroupShape);
        this.canvas.changeStyle(this.#selectedShape.shape.style);
      }
    }
  }

  private selectMultipleNewShapes(shapes: Shape[]) {
    this.canvas.shapes = this.canvas.shapes.filter(s => !shapes.includes(s));
    this.canvas.shapes = this.canvas.shapes.concat(shapes);
    for (const shape of shapes) {
      this.setTmpCtx(shape);
    }
    this.#selectedShape = new SelectedMultiShape(shapes, this.canvas.tmpCtx);
    this.canvas.addShapes([this.#selectedShape.shape]);
    this.canvas.changeStyle(this.#selectedShape.shape.style);
  }

  private unSelectShape() {
    if (this.#selectedShape) {
      this.canvas.removeCurrentStyle();
      if (this.#selectedShape instanceof SelectedMultiShape) {
        this.setMainCtx(this.#selectedShape.shape);
        this.#selectedShape.shape.shapesToGlobal();
        this.canvas.removeGroupShape(this.#selectedShape.shape);
        this.#selectedShape.shape.clearShapes();
      } else {
        this.setMainCtx(this.#selectedShape.shape);
        this.#selectedShape.shape.properties[ShapePropertyName.edited] = false;
        this.#selectedShape.shape.properties[ShapePropertyName.selected] =
          false;
        this.canvas.changeShapesProperties(
          [this.#selectedShape.shape.properties[ShapePropertyName.id]],
          { [ShapePropertyName.edited]: false }
        );
      }
      this.#selectedShape = null;
    }
  }

  private hoverSelectedShape() {
    if (
      this.#selectedShape &&
      this.#selectedShape.pointInside(
        this.canvas.mainCtx,
        this.canvas.cursor[0],
        this.canvas.cursor[1]
      )
    ) {
      this.canvas.tmpCtx.canvas.style.cursor = 'move';
    } else if (
      this.#selectedShape &&
      (this.#selectedShape.pointOnTopLine(
        this.canvas.mainCtx,
        this.canvas.cursor[0],
        this.canvas.cursor[1]
      ) ||
        this.#selectedShape.pointOnBottomLine(
          this.canvas.mainCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        ))
    ) {
      this.canvas.tmpCtx.canvas.style.cursor = 'ns-resize';
    } else if (
      this.#selectedShape &&
      (this.#selectedShape.pointOnLeftLine(
        this.canvas.mainCtx,
        this.canvas.cursor[0],
        this.canvas.cursor[1]
      ) ||
        this.#selectedShape.pointOnRightLine(
          this.canvas.mainCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        ))
    ) {
      this.canvas.tmpCtx.canvas.style.cursor = 'ew-resize';
    } else if (
      this.#selectedShape &&
      (this.#selectedShape.pointOnTopLeftCorner(
        this.canvas.mainCtx,
        this.canvas.cursor[0],
        this.canvas.cursor[1]
      ) ||
        this.#selectedShape.pointOnBottomRightCorner(
          this.canvas.mainCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        ))
    ) {
      if (
        this.#selectedShape.shape.horizontalInverted !==
        this.#selectedShape.shape.verticallyInverted
      ) {
        this.canvas.tmpCtx.canvas.style.cursor = 'nesw-resize';
      } else {
        this.canvas.tmpCtx.canvas.style.cursor = 'nwse-resize';
      }
    } else if (
      this.#selectedShape &&
      (this.#selectedShape.pointOnTopRightCorner(
        this.canvas.mainCtx,
        this.canvas.cursor[0],
        this.canvas.cursor[1]
      ) ||
        this.#selectedShape.pointOnBottomLeftCorner(
          this.canvas.mainCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        ))
    ) {
      if (
        this.#selectedShape.shape.horizontalInverted !==
        this.#selectedShape.shape.verticallyInverted
      ) {
        this.canvas.changeCursor('nwse-resize');
      } else {
        this.canvas.changeCursor('nesw-resize');
      }
    } else if (this.findSelectedShape(this.canvas.cursor)) {
      this.canvas.changeCursor('move');
    } else {
      this.canvas.changeCursor('default');
    }
  }

  private findSelectedShape(p: Point): Shape | null {
    for (let i = this.canvas.shapes.length - 1; i >= 0; i--) {
      if (
        this.canvas.shapeInside(this.canvas.shapes[i]) &&
        this.canvas.shapes[i].pointInside(p[0], p[1])
      ) {
        return this.canvas.shapes[i];
      }
    }
    return null;
  }

  private textToShape(text: string, position: Point): TextBoxShape {
    return new TextBoxShape(
      {
        [ShapePropertyName.id]: crypto.randomUUID(),
        [ShapePropertyName.text]: text,
        [ShapePropertyName.style]: new TextBoxStyle(this.canvas.style),
        [ShapePropertyName.wrap]: false,
        [ShapePropertyName.originX]: position[0],
        [ShapePropertyName.originY]: position[1],
        [ShapePropertyName.edited]: true,
        [ShapePropertyName.selected]: false,
        [ShapePropertyName.horizontallyInvertable]: false,
      },
      this.canvas.tmpCtx
    );
  }

  private async pasteShapeFromClipBoard(position: Point): Promise<void> {
    return navigator.clipboard.readText().then(text => {
      if (text) {
        let isShape = true;
        try {
          JSON.parse(text) as CopiedShape;
        } catch {
          isShape = false;
        }

        if (isShape) {
          const copiedShape: CopiedShape = JSON.parse(text);
          copiedShape.shape.properties[ShapePropertyName.originX] = position[0];
          copiedShape.shape.properties[ShapePropertyName.originY] = position[1];
          const shape = this.canvas.shapeSerializer.deserialized(
            copiedShape.shape,
            this.canvas.tmpCtx,
            true
          );

          if (
            copiedShape.type === CopyShapeType.MultiShape &&
            shape instanceof GroupShape
          ) {
            shape.shapesToGlobal();
            this.unSelectShape();
            this.selectMultipleNewShapes(shape.shapes);
            shape.clearShapes();
          } else {
            this.canvas.addShapes([shape]);
            this.selectSingleShape(shape);
          }
        } else {
          const shape = this.textToShape(text, position);
          this.canvas.addShapes([shape]);
          this.selectSingleShape(shape);
        }
      }
    });
  }
}
