import { signal } from '@angular/core';

import { CanvasConnectionService } from '../../../services/canvas-connection.service';
import { ShapeLayerMove } from '../Actions/ChangeShapesLayerAction';
import { ChangedShapeProperties } from '../Actions/ChangeShapesPropertiesAction';
import { CanvasComponent } from '../canvas.component';
import { CanvasContextMenuAction } from '../ContextMenus/canvas-context-menu/canvas-context-menu.component';
import { ShapeContextMenuAction } from '../ContextMenus/shape-context-menu/shape-context-menu.component';
import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { Point, Rect } from '../Geometry';
import { SelectedMultiShape } from '../Selected/SelectedMultiShape';
import { Resize, SelectedShape } from '../Selected/SelectedShape';
import { SelectedStraightLineShape } from '../Selected/SelectedStraightLineShape';
import { SelectRect } from '../Selected/SelectRect';
import { SerializedShape } from '../Serializer/ShapeSerializer';
import { GroupShape } from '../Shapes/GroupShape';
import { Shape } from '../Shapes/Shape';
import { StraightLineShape } from '../Shapes/StraightLineShape';
import { TextBoxShape } from '../Shapes/TextBoxShape';
import { ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';
import { TextBoxStyle } from '../ShapeStyles/TextBoxStyle';

import { CanvasToolState } from './CanvasToolState';

export class SelectToolState extends CanvasToolState {
  #selectedShape: SelectedShape | SelectedMultiShape | null = null;
  #pastePosition: Point | null = null;
  #selectRect: SelectRect | null = null;
  #selectedAction = false;
  #canvasConnection: CanvasConnectionService;

  contextMenuPosition: Point = [0, 0];

  selectedShapeChange = signal<SelectedShape | undefined>(undefined);
  shapeContextMenuVisible = false;

  canvasContextMenuVisible = false;

  constructor(
    canvas: CanvasComponent,
    canvasConnection: CanvasConnectionService
  ) {
    super(canvas);
    this.#canvasConnection = canvasConnection;
    this.canvas.removeCurrentStyle();
    this.canvas.changeCursor('default');
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
      case ShapeContextMenuAction.MoveForward:
        this.moveSelectedShapeForward();
        break;
      case ShapeContextMenuAction.MoveBackwards:
        this.moveSelectedShapeBackwards();
        break;
      case ShapeContextMenuAction.MoveToFront:
        this.moveSelectedShapeToFront();
        break;
      case ShapeContextMenuAction.MoveToBack:
        this.moveSelectedShapeToBack();
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
      const properties = this.#selectedShape.setStyleProperty(styleProperty);
      this.canvas.changeShapesProperties([
        {
          id: this.#selectedShape.shape.properties[FormPropertyName.id],
          properties: properties,
        },
      ]);
      // TODO
      // this.canvas.renderCanvas({ shapesChanged: true, shapesEdited: true });
    }
  }

  renderSelectedFrame(): void {
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

  override remove(): void {
    this.unSelectShape();
    // TODO
    // this.canvas.renderCanvas({ shapesChanged: true, shapesEdited: true });
  }

  override onMouseDown(event: MouseEvent): void {
    this.hideContextMenu();
    if (this.canvas.leftmouseDown) {
      const gotSelectedShape = this.mouseDownSelectedShape();
      if (!gotSelectedShape) {
        const shape = this.findSelectedShape(this.canvas.cursor);
        if (shape) {
          if (
            this.canvas.isShapeLocked(shape.properties[FormPropertyName.id])
          ) {
            return;
          }
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
        this.moveSelectedShape();
      } else if (
        this.#selectedShape &&
        this.#selectedShape.resized != Resize.None
      ) {
        const resizeProperties = this.#selectedShape.resize(
          this.canvas.pointToGrid([
            this.canvas.cursor[0] + this.#selectedShape.originFromCursor[0],
            this.canvas.cursor[1] + this.#selectedShape.originFromCursor[1],
          ])
        );
        if (resizeProperties.length > 0) {
          this.canvas.changeShapesProperties(resizeProperties);
        }
      } else if (this.canvas.firstMove) {
        this.#selectRect = new SelectRect(
          [this.canvas.startCursor[0], this.canvas.startCursor[1]],
          [this.canvas.cursor[0], this.canvas.cursor[1]]
        );
      } else if (this.#selectRect) {
        this.#selectRect.update(this.canvas.cursor[0], this.canvas.cursor[1]);
      }
      // TODO
      // this.canvas.renderCanvas({ shapesChanged: true, shapesEdited: true });
    }
  }

  private moveSelectedShape() {
    if (this.#selectedShape) {
      const p1: Point = [
        this.canvas.cursor[0] + this.#selectedShape.originFromCursor[0],
        this.canvas.cursor[1] + this.#selectedShape.originFromCursor[1],
      ];
      const p2: Point = [
        p1[0] + this.#selectedShape.shape.width,
        p1[1] + this.#selectedShape.shape.height,
      ];

      const p1ToGrid = this.canvas.pointToGrid(p1);
      const p2ToGrid = this.canvas.pointToGrid(p2);
      const p2ToGridOrigin: Point = [
        p2ToGrid[0] - this.#selectedShape.shape.width,
        p2ToGrid[1] - this.#selectedShape.shape.height,
      ];

      const pX =
        Math.abs(p1[0] - p1ToGrid[0]) < Math.abs(p1[0] - p2ToGridOrigin[0])
          ? p1ToGrid[0]
          : p2ToGridOrigin[0];
      const pY =
        Math.abs(p1[1] - p1ToGrid[1]) < Math.abs(p1[1] - p2ToGridOrigin[1])
          ? p1ToGrid[1]
          : p2ToGridOrigin[1];

      const moveProperties = this.#selectedShape.moveTo([pX, pY]);
      if (moveProperties.length > 0) {
        this.canvas.changeShapesProperties(moveProperties);
      }
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
          let insideShape = false;
          if (this.#selectedShape instanceof SelectedMultiShape) {
            const localX = this.#selectedShape.shape.toLocalX(
              this.canvas.cursor[0]
            );
            const localY = this.#selectedShape.shape.toLocalY(
              this.canvas.cursor[1]
            );
            for (const shape of this.#selectedShape.shape.shapes) {
              if (shape.pointInside(this.canvas.shapeCtx, localX, localY)) {
                insideShape = true;
                this.selectSingleShape(shape);
                this.canvas.renderCanvas({
                  shapesChanged: true,
                  shapesEdited: true,
                });
                break;
              }
            }
          } else if (
            this.#selectedShape.shape.pointInside(
              this.canvas.shapeCtx,
              this.canvas.cursor[0],
              this.canvas.cursor[1]
            )
          ) {
            insideShape = true;
          }

          if (!insideShape) {
            const shape = this.findSelectedShape(this.canvas.cursor);
            if (shape) {
              if (
                this.canvas.isShapeLocked(shape.properties[FormPropertyName.id])
              ) {
                return;
              }
              if (event.shiftKey) {
                this.selectAdditionalShape(shape);
              } else {
                this.selectSingleShape(shape);
              }
            } else {
              this.unSelectShape();
            }
          } else {
            this.unSelectShape();
          }
          // TODO
          // this.canvas.renderCanvas({ shapesChanged: true, shapesEdited: true });
        }
      }
      if (this.#selectRect) {
        this.selectFromRect();
        // TODO
        // this.canvas.renderCanvas({ shapesChanged: true, shapesEdited: true });
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
            s => s.properties[FormPropertyName.id]
          )
        );
      } else {
        this.canvas.removeShapes([
          this.#selectedShape.shape.properties[FormPropertyName.id],
        ]);
      }
      this.#selectedShape = null;
      // TODO
      // this.canvas.renderCanvas({ shapesChanged: true, shapesEdited: true });
      this.hoverSelectedShape();
    }
  }

  copySelectedShape() {
    if (this.#selectedShape) {
      this.#pastePosition = [
        this.#selectedShape.shape.originX + 20 / this.canvas.scale,
        this.#selectedShape.shape.originY + 20 / this.canvas.scale,
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
      // TODO
      // this.canvas.renderCanvas({ shapesChanged: true, shapesEdited: true });
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
      // TODO
      // this.canvas.renderCanvas({ shapesChanged: true, shapesEdited: true });
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
      // TODO
      // this.canvas.renderCanvas({ shapesChanged: true, shapesEdited: true });
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
      // TODO
      // this.canvas.renderCanvas({ shapesChanged: true, shapesEdited: true });
    }
  }

  moveSelectedShapeForward() {
    if (this.#selectedShape) {
      if (this.#selectedShape instanceof SelectedMultiShape) {
        const shapesLength = this.#selectedShape.shape.shapes.length;
        const shapeLayerMoves: ShapeLayerMove[] = [];
        for (let i = this.#selectedShape.shape.shapes.length - 1; i >= 0; i--) {
          const shape = this.#selectedShape.shape.shapes[i];
          const idx = this.canvas.shapes.indexOf(shape);
          if (idx !== -1) {
            if (idx < this.canvas.shapes.length - 1 - (shapesLength - 1 - i)) {
              this.canvas.shapes[idx] = this.canvas.shapes[idx + 1];
              this.canvas.shapes[idx + 1] = shape;
              shapeLayerMoves.push({
                id: shape.properties[FormPropertyName.id],
                newIndex: idx + 1,
              });
            }
          }
        }
        this.canvas.changeShapesLayer(shapeLayerMoves);
      } else {
        const idx = this.canvas.shapes.indexOf(this.#selectedShape.shape);
        if (idx < this.canvas.shapes.length - 1) {
          this.canvas.shapes[idx] = this.canvas.shapes[idx + 1];
          this.canvas.shapes[idx + 1] = this.#selectedShape.shape;
          this.canvas.changeShapesLayer([
            {
              id: this.#selectedShape.shape.properties[FormPropertyName.id],
              newIndex: idx + 1,
            },
          ]);
        }
      }
      // TODO
      // this.canvas.renderCanvas({ shapesChanged: true, shapesEdited: true });
    }
  }

  moveSelectedShapeBackwards() {
    if (this.#selectedShape) {
      if (this.#selectedShape instanceof SelectedMultiShape) {
        const shapeLayerMoves: ShapeLayerMove[] = [];
        this.#selectedShape.shape.shapes.forEach((shape, i) => {
          const idx = this.canvas.shapes.indexOf(shape);
          if (idx > i) {
            this.canvas.shapes[idx] = this.canvas.shapes[idx - 1];
            this.canvas.shapes[idx - 1] = shape;
            shapeLayerMoves.push({
              id: shape.properties[FormPropertyName.id],
              newIndex: idx - 1,
            });
          }
        });
        this.canvas.changeShapesLayer(shapeLayerMoves);
      } else {
        const idx = this.canvas.shapes.indexOf(this.#selectedShape.shape);
        if (idx > 0) {
          this.canvas.shapes[idx] = this.canvas.shapes[idx - 1];
          this.canvas.shapes[idx - 1] = this.#selectedShape.shape;
          this.canvas.changeShapesLayer([
            {
              id: this.#selectedShape.shape.properties[FormPropertyName.id],
              newIndex: idx - 1,
            },
          ]);
        }
      }
      // TODO
      // this.canvas.renderCanvas({ shapesChanged: true, shapesEdited: true });
    }
  }

  moveSelectedShapeToFront() {
    if (this.#selectedShape) {
      if (this.#selectedShape instanceof SelectedMultiShape) {
        const shapeIdList = this.#selectedShape.shape.shapes.map(
          s => s.properties[FormPropertyName.id]
        );
        this.canvas.shapes = [
          ...this.canvas.shapes.filter(
            shape =>
              !shapeIdList.includes(shape.properties[FormPropertyName.id])
          ),
          ...this.canvas.shapes.filter(shape =>
            shapeIdList.includes(shape.properties[FormPropertyName.id])
          ),
        ];
        const shapeLayerMoves = shapeIdList.map((id, i): ShapeLayerMove => {
          return {
            id: id,
            newIndex: this.canvas.shapes.length - (shapeIdList.length - i),
          };
        });
        this.canvas.changeShapesLayer(shapeLayerMoves);
      } else {
        const idx = this.canvas.shapes.indexOf(this.#selectedShape.shape);
        if (idx !== -1 && idx < this.canvas.shapes.length - 1) {
          this.canvas.shapes.push(this.canvas.shapes.splice(idx, 1)[0]);
          this.canvas.changeShapesLayer([
            {
              id: this.#selectedShape.shape.properties[FormPropertyName.id],
              newIndex: this.canvas.shapes.length - 1,
            },
          ]);
        }
      }
      // TODO
      // this.canvas.renderCanvas({ shapesChanged: true, shapesEdited: true });
    }
  }

  moveSelectedShapeToBack() {
    if (this.#selectedShape) {
      if (this.#selectedShape instanceof SelectedMultiShape) {
        const shapeIdList = this.#selectedShape.shape.shapes.map(
          s => s.properties[FormPropertyName.id]
        );
        this.canvas.shapes = [
          ...this.canvas.shapes.filter(shape =>
            shapeIdList.includes(shape.properties[FormPropertyName.id])
          ),
          ...this.canvas.shapes.filter(
            shape =>
              !shapeIdList.includes(shape.properties[FormPropertyName.id])
          ),
        ];
        const shapeLayerMoves = shapeIdList.map((id, i): ShapeLayerMove => {
          return {
            id: id,
            newIndex: i,
          };
        });
        this.canvas.changeShapesLayer(shapeLayerMoves);
      } else {
        const idx = this.canvas.shapes.indexOf(this.#selectedShape.shape);
        if (idx > 0) {
          this.canvas.shapes.unshift(this.canvas.shapes.splice(idx, 1)[0]);
          this.canvas.changeShapesLayer([
            {
              id: this.#selectedShape.shape.properties[FormPropertyName.id],
              newIndex: 0,
            },
          ]);
        }
      }
      // TODO
      // this.canvas.renderCanvas({ shapesChanged: true, shapesEdited: true });
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
      if (
        this.canvas.isShapeLocked(
          this.#selectedShape.shape.properties[FormPropertyName.id]
        )
      ) {
        return;
      }
      this.showShapeContextMenu(screenX, screenY);
      return;
    }
    const shape = this.findSelectedShape(this.canvas.cursor);
    if (shape) {
      if (this.canvas.isShapeLocked(shape.properties[FormPropertyName.id])) {
        return;
      }
      if (
        !(
          this.#selectedShape &&
          shape.properties[FormPropertyName.id] ===
            this.#selectedShape.shape.properties[FormPropertyName.id]
        )
      ) {
        this.selectSingleShape(shape);
        // TODO
        // this.canvas.renderCanvas({ shapesChanged: true, shapesEdited: true });
      }
      this.showShapeContextMenu(screenX, screenY);
    } else {
      this.showCanvasContextMenu(screenX, screenY);
    }
  }

  private mouseDownSelectedShape(): boolean {
    if (this.#selectedShape) {
      if (
        this.canvas.isShapeLocked(
          this.#selectedShape.shape.properties[FormPropertyName.id]
        )
      ) {
        return false;
      }
      if (
        this.#selectedShape instanceof SelectedStraightLineShape &&
        this.#selectedShape.pointOnFirstPoint(
          this.canvas.selectFrameCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      ) {
        this.#selectedShape.resized = Resize.StraightLineFirstPoint;
        this.#selectedShape.originFromCursor = [
          this.#selectedShape.shape.originX - this.canvas.startCursor[0],
          this.#selectedShape.shape.originY - this.canvas.startCursor[1],
        ];
        return true;
      }
      if (
        this.#selectedShape instanceof SelectedStraightLineShape &&
        this.#selectedShape.pointOnSecondPoint(
          this.canvas.selectFrameCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      ) {
        this.#selectedShape.resized = Resize.StraightLineLastPoint;
        this.#selectedShape.originFromCursor = [
          this.#selectedShape.shape.originX +
            this.#selectedShape.shape.width -
            this.canvas.startCursor[0],
          this.#selectedShape.shape.originY +
            this.#selectedShape.shape.height -
            this.canvas.startCursor[1],
        ];
        return true;
      }
      if (
        this.#selectedShape.pointOnTopLeftCorner(
          this.canvas.selectFrameCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      ) {
        this.#selectedShape.resized = Resize.TopLeft;
        this.#selectedShape.originFromCursor = [
          this.#selectedShape.shape.originX - this.canvas.startCursor[0],
          this.#selectedShape.shape.originY - this.canvas.startCursor[1],
        ];
        return true;
      }
      if (
        this.#selectedShape.pointOnTopRightCorner(
          this.canvas.selectFrameCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      ) {
        this.#selectedShape.resized = Resize.TopRight;
        this.#selectedShape.originFromCursor = [
          this.#selectedShape.shape.originX +
            this.#selectedShape.shape.width -
            this.canvas.startCursor[0],
          this.#selectedShape.shape.originY - this.canvas.startCursor[1],
        ];
        return true;
      }
      if (
        this.#selectedShape.pointOnBottomLeftCorner(
          this.canvas.selectFrameCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      ) {
        this.#selectedShape.resized = Resize.BottomLeft;
        this.#selectedShape.originFromCursor = [
          this.#selectedShape.shape.originX - this.canvas.startCursor[0],
          this.#selectedShape.shape.originY +
            this.#selectedShape.shape.height -
            this.canvas.startCursor[1],
        ];
        return true;
      }
      if (
        this.#selectedShape.pointOnBottomRightCorner(
          this.canvas.selectFrameCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      ) {
        this.#selectedShape.resized = Resize.BottomRight;
        this.#selectedShape.originFromCursor = [
          this.#selectedShape.shape.originX +
            this.#selectedShape.shape.width -
            this.canvas.startCursor[0],
          this.#selectedShape.shape.originY +
            this.#selectedShape.shape.height -
            this.canvas.startCursor[1],
        ];
        return true;
      }
      if (
        this.#selectedShape.pointOnTopLine(
          this.canvas.selectFrameCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      ) {
        this.#selectedShape.resized = Resize.Top;
        this.#selectedShape.originFromCursor[1] =
          this.#selectedShape.shape.originY - this.canvas.startCursor[1];
        return true;
      }
      if (
        this.#selectedShape.pointOnBottomLine(
          this.canvas.selectFrameCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      ) {
        this.#selectedShape.resized = Resize.Bottom;
        this.#selectedShape.originFromCursor[1] =
          this.#selectedShape.shape.originY +
          this.#selectedShape.shape.height -
          this.canvas.startCursor[1];
        return true;
      }
      if (
        this.#selectedShape.pointOnLeftLine(
          this.canvas.selectFrameCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      ) {
        this.#selectedShape.resized = Resize.Left;
        this.#selectedShape.originFromCursor[0] =
          this.#selectedShape.shape.originX - this.canvas.startCursor[0];
        return true;
      }
      if (
        this.#selectedShape.pointOnRightLine(
          this.canvas.selectFrameCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      ) {
        this.#selectedShape.resized = Resize.Right;
        this.#selectedShape.originFromCursor[0] =
          this.#selectedShape.shape.originX +
          this.#selectedShape.shape.width -
          this.canvas.startCursor[0];
        return true;
      }
      if (
        this.#selectedShape.pointInside(
          this.canvas.selectFrameCtx,
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
        // if shape inside canvas and shape inside selectrect
        // then:
        // shapes.push(shape);

        // if (
        //   this.canvas.shapeInside(shape) &&
        //   !this.canvas.isShapeLocked(shape.properties[FormPropertyName.id]) &&
        //   shapeTrueRect[0] >= trueSelectRect[0] &&
        //   shapeTrueRect[1] >= trueSelectRect[1] &&
        //   shapeTrueRect[2] <= trueSelectRect[2] &&
        //   shapeTrueRect[3] <= trueSelectRect[3]
        // ) {
        //   shapes.push(shape);
        // }
      }
    }
    return shapes;
  }

  selectSingleShape(shape: Shape) {
    this.unSelectShape();
    this.#selectedShape =
      shape instanceof StraightLineShape
        ? new SelectedStraightLineShape(shape)
        : new SelectedShape(shape);
    this.changeShapesSelectedProperty([shape], true);
    this.canvas.changeStyle({ ...this.#selectedShape.shape.style });

    if (this.canvas.currentNoteId) {
      this.#canvasConnection.sendSelection(this.canvas.currentNoteId, [
        shape.properties[FormPropertyName.id],
      ]);
    }
  }

  private selectAdditionalShape(shape: Shape) {
    if (
      this.#selectedShape &&
      this.#selectedShape instanceof SelectedMultiShape
    ) {
      this.#selectedShape.addShape(shape);
      this.#selectedShape.shape.shapes.sort((a, b) => {
        return this.canvas.shapes.indexOf(a) - this.canvas.shapes.indexOf(b);
      });
      this.changeShapesSelectedProperty([shape], true);
      this.canvas.changeStyle({ ...this.#selectedShape.shape.style });

      if (this.canvas.currentNoteId) {
        const ids = this.#selectedShape.shape.shapes.map(
          s => s.properties[FormPropertyName.id]
        );
        ids.push(this.#selectedShape.shape.properties[FormPropertyName.id]);
        this.#canvasConnection.sendSelection(this.canvas.currentNoteId, ids);
      }
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
        this.canvas.changeStyle({ ...this.#selectedShape.shape.style });

        if (this.canvas.currentNoteId) {
          const ids = shapes.map(s => s.properties[FormPropertyName.id]);
          ids.push(this.#selectedShape.shape.properties[FormPropertyName.id]);
          this.#canvasConnection.sendSelection(this.canvas.currentNoteId, ids);
        }
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

      if (this.canvas.currentNoteId) {
        this.#canvasConnection.sendSelection(this.canvas.currentNoteId, []);
      }

      this.#selectedShape = null;
    }
  }

  private changeShapesSelectedProperty(shapes: Shape[], selected: boolean) {
    const properties: ChangedShapeProperties[] = [];
    for (const shape of shapes) {
      if (shape.properties[FormPropertyName.edited] != selected) {
        properties.push({
          id: shape.properties[FormPropertyName.id],
          properties: { [FormPropertyName.edited]: selected },
        });
      }
      shape.properties[FormPropertyName.edited] = selected;
      shape.properties[FormPropertyName.selected] = selected;
    }
    return this.canvas.changeShapesProperties(properties);
  }

  private hoverSelectedShape() {
    if (
      this.#selectedShape &&
      (this.#selectedShape.pointOnTopLeftCorner(
        this.canvas.selectFrameCtx,
        this.canvas.cursor[0],
        this.canvas.cursor[1]
      ) ||
        this.#selectedShape.pointOnBottomRightCorner(
          this.canvas.selectFrameCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        ) ||
        (this.#selectedShape instanceof SelectedStraightLineShape &&
          (this.#selectedShape.pointOnFirstPoint(
            this.canvas.selectFrameCtx,
            this.canvas.cursor[0],
            this.canvas.cursor[1]
          ) ||
            this.#selectedShape.pointOnSecondPoint(
              this.canvas.selectFrameCtx,
              this.canvas.cursor[0],
              this.canvas.cursor[1]
            ))))
    ) {
      if (
        this.#selectedShape.shape.horizontalInverted !==
        this.#selectedShape.shape.verticallyInverted
      ) {
        this.canvas.changeCursor('nesw-resize');
      } else {
        this.canvas.changeCursor('nwse-resize');
      }
    } else if (
      this.#selectedShape &&
      (this.#selectedShape.pointOnTopRightCorner(
        this.canvas.selectFrameCtx,
        this.canvas.cursor[0],
        this.canvas.cursor[1]
      ) ||
        this.#selectedShape.pointOnBottomLeftCorner(
          this.canvas.selectFrameCtx,
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
    } else if (
      this.#selectedShape &&
      (this.#selectedShape.pointOnTopLine(
        this.canvas.selectFrameCtx,
        this.canvas.cursor[0],
        this.canvas.cursor[1]
      ) ||
        this.#selectedShape.pointOnBottomLine(
          this.canvas.selectFrameCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        ))
    ) {
      this.canvas.changeCursor('ns-resize');
    } else if (
      this.#selectedShape &&
      (this.#selectedShape.pointOnLeftLine(
        this.canvas.selectFrameCtx,
        this.canvas.cursor[0],
        this.canvas.cursor[1]
      ) ||
        this.#selectedShape.pointOnRightLine(
          this.canvas.selectFrameCtx,
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        ))
    ) {
      this.canvas.changeCursor('ew-resize');
    } else if (
      this.#selectedShape &&
      this.#selectedShape.pointInside(
        this.canvas.selectFrameCtx,
        this.canvas.cursor[0],
        this.canvas.cursor[1]
      )
    ) {
      this.canvas.changeCursor('move');
    } else {
      const shape = this.findSelectedShape(this.canvas.cursor);
      if (
        (this.#selectedShape && shape && shape !== this.#selectedShape.shape) ||
        (shape && !this.#selectedShape)
      ) {
        this.canvas.changeCursor('move');
      } else {
        this.canvas.changeCursor('default');
      }
    }
  }

  private findSelectedShape(p: Point): Shape | null {
    this.selectedShapesToGlobal();
    for (let i = this.canvas.shapes.length - 1; i >= 0; i--) {
      // if shape inside canvas and point inside shape
      // then:
      // this.selectedShapesToLocal();
      //   return this.canvas.shapes[i];
    }
    this.selectedShapesToLocal();
    return null;
  }

  private textToShape(text: string, position: Point): TextBoxShape {
    return new TextBoxShape(
      {
        [FormPropertyName.id]: crypto.randomUUID(),
        [FormPropertyName.text]: text,
        [FormPropertyName.style]: new TextBoxStyle(this.canvas.style),
        [FormPropertyName.wrap]: false,
        [FormPropertyName.originX]: position[0],
        [FormPropertyName.originY]: position[1],
        [FormPropertyName.edited]: true,
        [FormPropertyName.selected]: false,
        [FormPropertyName.horizontallyInvertable]: false,
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
          this.#selectedShape?.moveTo([position[0], position[1]]);
        } else {
          const shape = this.textToShape(text, position);
          this.canvas.addShapes([shape]);
          this.selectSingleShape(shape);
        }
      }
    });
  }

  get selectedShape() {
    return this.#selectedShape;
  }
}
