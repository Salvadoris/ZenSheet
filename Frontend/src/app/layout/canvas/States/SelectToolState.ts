import { signal } from '@angular/core';

import { ChangedShapeProperties } from '../Actions/ChangeShapesPropertiesAction';
import { CanvasComponent } from '../canvas.component';
import { CanvasContextMenuAction } from '../ContextMenus/canvas-context-menu/canvas-context-menu.component';
import { ShapeContextMenuAction } from '../ContextMenus/shape-context-menu/shape-context-menu.component';
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
    if (this.canvas.selectFrameCtx) {
      this.canvas.changeCursor('default');
    }
  }

  executeShapeContextMenuAction(action: ShapeContextMenuAction) {
    this.hideContextMenu();
    switch (action) {
      case ShapeContextMenuAction.Remove:
        this.removeSelectedShape();
        break;
      case ShapeContextMenuAction.Copy:
        this.copySelectedShape();
        break;
      case ShapeContextMenuAction.Paste:
        this.pasteShapeAtContextMenuPosition();
        break;
      case ShapeContextMenuAction.Duplicate:
        this.duplicateSelectedShape();
        break;
      case ShapeContextMenuAction.Group:
        this.groupShapes();
        break;
      case ShapeContextMenuAction.SplitGroup:
        this.splitGroupShape();
        break;
    }
  }

  executeCanvasContextMenuAction(action: CanvasContextMenuAction) {
    this.hideContextMenu();
    switch (action) {
      case CanvasContextMenuAction.Paste:
        this.pasteShapeAtContextMenuPosition();
        break;
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
      this.canvas.changeShapesProperties([
        {
          id: this.#selectedShape.shape.properties[ShapePropertyName.id],
          properties: properties,
        },
      ]);
      this.canvas.renderCanvas(true, false);
    }
  }

  override renderShapes(): void {
    if (this.#selectedShape) {
      this.#selectedShape.render(this.canvas.scale, this.canvas.selectFrameCtx);
    }
    if (this.#selectRect) {
      this.#selectRect.render(this.canvas.selectFrameCtx, this.canvas.scale);
      const shapes = this.shapesInsideSelectRect();
      this.#selectRect.renderShapeOutlines(
        this.canvas.selectFrameCtx,
        this.canvas.scale,
        shapes
      );
    }
  }

  selectedShapesToGlobal() {
    if (
      this.#selectedShape &&
      this.#selectedShape instanceof SelectedMultiShape
    ) {
      this.#selectedShape.shape.shapesToGlobal();
    }
  }

  selectedShapesToLocal() {
    if (
      this.#selectedShape &&
      this.#selectedShape instanceof SelectedMultiShape
    ) {
      this.#selectedShape.shape.shapesToLocal();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override renderDrawings() {}

  override remove(): void {
    this.unSelectShape();
    this.canvas.renderCanvas(true, false);
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
        this.canvas.changeShapesProperties(moveProperties);
      } else if (
        this.#selectedShape &&
        this.#selectedShape.resized != Resize.None
      ) {
        const resizeProperties = this.#selectedShape.resize([
          this.canvas.cursor[0],
          this.canvas.cursor[1],
        ]);
        this.canvas.changeShapesProperties(resizeProperties);
      } else if (this.canvas.firstMove) {
        this.#selectRect = new SelectRect(
          [this.canvas.startCursor[0], this.canvas.startCursor[1]],
          [this.canvas.cursor[0], this.canvas.cursor[1]]
        );
      } else if (this.#selectRect) {
        this.#selectRect.update(this.canvas.cursor[0], this.canvas.cursor[1]);
      }
      this.canvas.renderCanvas(true, false);
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
            this.canvas.shapeCtx,
            this.canvas.cursor[0],
            this.canvas.cursor[1]
          )
        ) {
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
          this.canvas.renderCanvas(true, false);
        }
      }
      if (this.#selectRect) {
        this.selectFromRect();
        this.canvas.renderCanvas(true, false);
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
      if (this.#selectedShape instanceof SelectedMultiShape) {
        this.canvas.removeShapes(
          this.#selectedShape.shape.shapes.map(
            s => s.properties[ShapePropertyName.id]
          )
        );
      } else {
        this.canvas.removeShapes([
          this.#selectedShape.shape.properties[ShapePropertyName.id],
        ]);
      }
      this.#selectedShape = null;
      this.canvas.renderCanvas(true, false);
      this.hoverSelectedShape();
    }
  }

  copySelectedShape() {
    if (this.#selectedShape) {
      this.#pastePosition = [
        this.#selectedShape.shape.horizontalInverted
          ? this.#selectedShape.shape.originX +
            this.#selectedShape.shape.width +
            20 / this.canvas.scale
          : this.#selectedShape.shape.originX + 20 / this.canvas.scale,
        this.#selectedShape.shape.verticallyInverted
          ? this.#selectedShape.shape.originY +
            this.#selectedShape.shape.height +
            20 / this.canvas.scale
          : this.#selectedShape.shape.originY + 20 / this.canvas.scale,
      ];
      let serializedShapes: SerializedShape[] = [];
      if (this.#selectedShape instanceof SelectedMultiShape) {
        serializedShapes = this.#selectedShape.shape.shapes.map(s => {
          const serializedShape = this.canvas.shapeSerializer.serialized(s);
          serializedShape.properties = {
            ...serializedShape.properties,
            ...(
              this.#selectedShape as SelectedMultiShape
            ).globalShapeTransformProperties(s),
          };
          return serializedShape;
        });
      } else {
        serializedShapes = [
          this.canvas.shapeSerializer.serialized(this.#selectedShape.shape),
        ];
      }
      return navigator.clipboard.writeText(JSON.stringify(serializedShapes));
    }
    return undefined;
  }

  pasteShapeAtContextMenuPosition() {
    this.pasteShapeFromClipBoard([
      (this.contextMenuPosition[0] - this.canvas.origin[0]) / this.canvas.scale,
      (this.contextMenuPosition[1] - this.canvas.origin[1]) / this.canvas.scale,
    ]).then(() => {
      this.canvas.renderCanvas(true, false);
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
      this.canvas.renderCanvas(true, false);
    });
  }

  duplicateSelectedShape() {
    if (this.#selectedShape) {
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
      this.canvas.addGroupShape(this.#selectedShape.shape);
      this.#selectedShape = new SelectedShape(this.#selectedShape.shape);
      this.canvas.renderCanvas(true, false);
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

      this.canvas.renderCanvas(true, false);
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
        this.canvas.shapeCtx,
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
        this.canvas.renderCanvas(true, false);
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
          this.canvas.shapeCtx,
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
          this.canvas.shapeCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      ) {
        this.#selectedShape.resized = Resize.Top;
        return true;
      }
      if (
        this.#selectedShape.pointOnBottomLine(
          this.canvas.shapeCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      ) {
        this.#selectedShape.resized = Resize.Bottom;
        return true;
      }
      if (
        this.#selectedShape.pointOnLeftLine(
          this.canvas.shapeCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      ) {
        this.#selectedShape.resized = Resize.Left;
        return true;
      }
      if (
        this.#selectedShape.pointOnRightLine(
          this.canvas.shapeCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      ) {
        this.#selectedShape.resized = Resize.Right;
        return true;
      }
      if (
        this.#selectedShape.pointOnTopLeftCorner(
          this.canvas.shapeCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      ) {
        this.#selectedShape.resized = Resize.TopLeft;
        return true;
      }
      if (
        this.#selectedShape.pointOnTopRightCorner(
          this.canvas.shapeCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      ) {
        this.#selectedShape.resized = Resize.TopRight;
        return true;
      }
      if (
        this.#selectedShape.pointOnBottomLeftCorner(
          this.canvas.shapeCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      ) {
        this.#selectedShape.resized = Resize.BottomLeft;
        return true;
      }
      if (
        this.#selectedShape.pointOnBottomRightCorner(
          this.canvas.shapeCtx,
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

  selectSingleShape(shape: Shape) {
    this.unSelectShape();
    this.#selectedShape = new SelectedShape(shape);
    this.changeShapesSelectedProperty([shape], true);
    this.canvas.changeStyle(this.#selectedShape.shape.style);
  }

  private selectAdditionalShape(shape: Shape) {
    if (
      this.#selectedShape &&
      this.#selectedShape instanceof SelectedMultiShape
    ) {
      this.#selectedShape.shape.addShape(shape);
      this.#selectedShape.shape.shapes.sort((a, b) => {
        return this.canvas.shapes.indexOf(a) - this.canvas.shapes.indexOf(b);
      });
      this.changeShapesSelectedProperty([shape], true);
      this.canvas.changeStyle(this.#selectedShape.shape.style);
    } else if (this.#selectedShape) {
      this.selectMultipleShapes([this.#selectedShape.shape, shape]);
      if (this.#selectedShape instanceof SelectedMultiShape) {
        this.#selectedShape.shape.shapes.sort((a, b) => {
          return this.canvas.shapes.indexOf(a) - this.canvas.shapes.indexOf(b);
        });
      }
    } else {
      this.selectSingleShape(shape);
    }
  }

  private selectMultipleShapes(shapes: Shape[]) {
    if (shapes.length > 0) {
      if (shapes.length == 1) {
        this.selectSingleShape(shapes[0]);
      } else {
        this.#selectedShape = new SelectedMultiShape(
          shapes,
          this.canvas.bufferCtx
        );
        this.changeShapesSelectedProperty(shapes, true);
        this.canvas.changeStyle(this.#selectedShape.shape.style);
      }
    }
  }

  private unSelectShape() {
    if (this.#selectedShape) {
      this.canvas.removeCurrentStyle();
      if (this.#selectedShape instanceof SelectedMultiShape) {
        this.#selectedShape.shape.shapesToGlobal();
        this.changeShapesSelectedProperty(
          this.#selectedShape.shape.shapes,
          false
        );
        this.#selectedShape.shape.clearShapes();
      } else {
        this.changeShapesSelectedProperty([this.#selectedShape.shape], false);
      }
      this.#selectedShape = null;
    }
  }

  private changeShapesSelectedProperty(shapes: Shape[], selected: boolean) {
    const properties: ChangedShapeProperties[] = [];
    for (const shape of shapes) {
      if (shape.properties[ShapePropertyName.edited] != selected) {
        properties.push({
          id: shape.properties[ShapePropertyName.id],
          properties: { [ShapePropertyName.edited]: selected },
        });
      }
      shape.properties[ShapePropertyName.edited] = selected;
      shape.properties[ShapePropertyName.selected] = selected;
    }
    return this.canvas.changeShapesProperties(properties);
  }

  private hoverSelectedShape() {
    if (
      this.#selectedShape &&
      this.#selectedShape.pointInside(
        this.canvas.shapeCtx,
        this.canvas.cursor[0],
        this.canvas.cursor[1]
      )
    ) {
      this.canvas.selectFrameCtx.canvas.style.cursor = 'move';
    } else if (
      this.#selectedShape &&
      (this.#selectedShape.pointOnTopLine(
        this.canvas.shapeCtx,
        this.canvas.cursor[0],
        this.canvas.cursor[1]
      ) ||
        this.#selectedShape.pointOnBottomLine(
          this.canvas.shapeCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        ))
    ) {
      this.canvas.selectFrameCtx.canvas.style.cursor = 'ns-resize';
    } else if (
      this.#selectedShape &&
      (this.#selectedShape.pointOnLeftLine(
        this.canvas.shapeCtx,
        this.canvas.cursor[0],
        this.canvas.cursor[1]
      ) ||
        this.#selectedShape.pointOnRightLine(
          this.canvas.shapeCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        ))
    ) {
      this.canvas.selectFrameCtx.canvas.style.cursor = 'ew-resize';
    } else if (
      this.#selectedShape &&
      (this.#selectedShape.pointOnTopLeftCorner(
        this.canvas.shapeCtx,
        this.canvas.cursor[0],
        this.canvas.cursor[1]
      ) ||
        this.#selectedShape.pointOnBottomRightCorner(
          this.canvas.shapeCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        ))
    ) {
      if (
        this.#selectedShape.shape.horizontalInverted !==
        this.#selectedShape.shape.verticallyInverted
      ) {
        this.canvas.selectFrameCtx.canvas.style.cursor = 'nesw-resize';
      } else {
        this.canvas.selectFrameCtx.canvas.style.cursor = 'nwse-resize';
      }
    } else if (
      this.#selectedShape &&
      (this.#selectedShape.pointOnTopRightCorner(
        this.canvas.shapeCtx,
        this.canvas.cursor[0],
        this.canvas.cursor[1]
      ) ||
        this.#selectedShape.pointOnBottomLeftCorner(
          this.canvas.shapeCtx,
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
    this.selectedShapesToGlobal();
    for (let i = this.canvas.shapes.length - 1; i >= 0; i--) {
      if (
        this.canvas.shapeInside(this.canvas.shapes[i]) &&
        this.canvas.shapes[i].pointInside(this.canvas.shapeCtx, p[0], p[1])
      ) {
        this.selectedShapesToLocal();
        return this.canvas.shapes[i];
      }
    }
    this.selectedShapesToLocal();
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
      this.canvas.bufferCtx
    );
  }

  private async pasteShapeFromClipBoard(position: Point): Promise<void> {
    return navigator.clipboard.readText().then(text => {
      if (text) {
        let isShapes = true;
        let copiedShapes: SerializedShape[] = [];
        try {
          copiedShapes = JSON.parse(text);
        } catch {
          isShapes = false;
        }

        if (isShapes) {
          const shapes = copiedShapes.map(s =>
            this.canvas.shapeSerializer.deserialized(s, true)
          );

          this.canvas.addShapes(shapes);
          if (shapes.length === 1) {
            this.selectSingleShape(shapes[0]);
          } else {
            this.unSelectShape();
            this.selectMultipleShapes(shapes);
          }
          this.#selectedShape?.moveTo(position[0], position[1]);
        } else {
          const shape = this.textToShape(text, position);
          this.canvas.addShapes([shape]);
          this.selectSingleShape(shape);
        }
      }
    });
  }
}
