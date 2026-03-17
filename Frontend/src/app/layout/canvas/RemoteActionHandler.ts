import { effect } from '@angular/core';

import {
  CanvasConnectionService,
  CursorPosition,
  CursorUpdate,
} from '../../services/canvas-connection.service';

import { CanvasAction } from './Actions/CanvasAction';
import { CanvasComponent } from './canvas.component';
import { Rect } from './Geometry';
import {
  getClientLabel,
  getColorFromClientId,
  RemoteCursor,
  renderOffScreenIndicator,
  renderRemoteCursor,
} from './RemoteCursor';
import { ShapePropertyName } from './ShapeProperties/ShapePropertyName';
import { GroupShape } from './Shapes/GroupShape';

export class RemoteActionHandler {
  #remoteCursors = new Map<string, RemoteCursor>();
  #remoteSelections = new Map<string, string[]>();
  #lastCursorSendTime = 0;
  #cursorThrottleMs = 30;
  #animationFrameId: number | null = null;
  #currentNoteId: string | null = null;

  constructor(
    private canvas: CanvasComponent,
    private canvasConnection: CanvasConnectionService
  ) {
    this.#watchCursorUpdates();
    this.#watchInitialCursors();
    this.#watchClientLeft();
    this.#watchCursorRemoved();
    this.#watchSelectionUpdates();
    this.#watchPresenceUpdates();
    this.#startAnimationLoop();
  }

  setNoteId(noteId: string) {
    this.#currentNoteId = noteId;
    this.#remoteCursors.clear();
  }

  get currentNoteId(): string | null {
    return this.#currentNoteId;
  }

  get remoteCursors() {
    return this.#remoteCursors;
  }

  get remoteSelections() {
    return this.#remoteSelections;
  }

  destroy() {
    this.#remoteCursors.clear();
    if (this.#animationFrameId !== null) {
      cancelAnimationFrame(this.#animationFrameId);
    }
  }

  #handleCursorUpdate(update: CursorUpdate) {
    const existing = this.#remoteCursors.get(update.clientId);
    if (existing) {
      existing.targetCursorPosition.x = update.cursorPosition.x;
      existing.targetCursorPosition.y = update.cursorPosition.y;
      if (update.username) {
        existing.label = update.username;
      }
    } else {
      this.#remoteCursors.set(update.clientId, {
        clientId: update.clientId,
        cursorPosition: { ...update.cursorPosition },
        targetCursorPosition: { ...update.cursorPosition },
        color: getColorFromClientId(update.clientId),
        label: update.username || getClientLabel(update.clientId),
      });
      this.canvas.renderCanvas({ presenceChanged: true });
    }
  }

  #startAnimationLoop() {
    const loop = () => {
      let needsRender = false;
      const lerpFactor = 0.5;

      for (const cursor of this.#remoteCursors.values()) {
        const dx = cursor.targetCursorPosition.x - cursor.cursorPosition.x;
        const dy = cursor.targetCursorPosition.y - cursor.cursorPosition.y;

        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
          cursor.cursorPosition.x += dx * lerpFactor;
          cursor.cursorPosition.y += dy * lerpFactor;
          needsRender = true;
        }

        const trackedId = this.canvasConnection.trackedClientId();
        if (trackedId === cursor.clientId) {
          this.canvas.origin[0] =
            window.innerWidth / 2 - cursor.cursorPosition.x * this.canvas.scale;
          this.canvas.origin[1] =
            window.innerHeight / 2 - cursor.cursorPosition.y * this.canvas.scale;
          needsRender = true;
        }
      }

      if (needsRender) {
        this.canvas.renderCanvas({ transformed: true });
      }

      this.#animationFrameId = requestAnimationFrame(loop);
    };
    this.#animationFrameId = requestAnimationFrame(loop);
  }

  sendCursorPosition(cursorPosition: CursorPosition) {
    if (!this.#currentNoteId) return;

    const now = Date.now();
    if (now - this.#lastCursorSendTime < this.#cursorThrottleMs) {
      return;
    }

    this.#lastCursorSendTime = now;
    this.canvasConnection.sendCursorPosition(
      this.#currentNoteId,
      cursorPosition
    );
  }

  renderRemoteCursors(ctx: CanvasRenderingContext2D, scale: number) {
    for (const cursor of this.#remoteCursors.values()) {
      renderRemoteCursor(ctx, cursor, scale);
    }
  }

  renderOffScreenIndicators(ctx: CanvasRenderingContext2D, origin: [number, number], scale: number, width: number, height: number) {
    for (const cursor of this.#remoteCursors.values()) {
      renderOffScreenIndicator(ctx, cursor, origin, scale, width, height);
    }
  }

  renderRemoteSelections(ctx: CanvasRenderingContext2D, scale: number) {
    for (const [clientId, shapeIds] of this.#remoteSelections.entries()) {
      if (clientId === this.canvasConnection.clientId()) continue;

      const color = getColorFromClientId(clientId);
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3 / scale;
      ctx.lineCap = 'butt';
      ctx.setLineDash([5 / scale, 5 / scale]);

      const selectedShapesWithRects: { id: string; rect: Rect }[] = [];

      for (const shapeId of shapeIds) {
        const shape = this.canvas.shapes.find(
          s => s.properties[ShapePropertyName.id] === shapeId
        );
        if (shape) {
          const rect = shape.offsetRect();
          ctx.strokeRect(
            rect[0],
            rect[1],
            rect[2] - rect[0],
            rect[3] - rect[1]
          );
          selectedShapesWithRects.push({ id: shapeId, rect });
        }
      }

      const label = this.#remoteCursors.get(clientId)?.label || getClientLabel(clientId);
      const fontSize = 15 / scale;
      ctx.font = `600 ${fontSize}px "Inter", "Segoe UI", sans-serif`;
      const textMetrics = ctx.measureText(label);
      const paddingX = 6 / scale;
      const paddingY = 3 / scale;
      const rectW = textMetrics.width + paddingX * 2;
      const rectH = fontSize + paddingY * 2;
      const radius = 4 / scale;

      for (const current of selectedShapesWithRects) {
        let isContained = false;
        for (const other of selectedShapesWithRects) {
          if (current.id === other.id) continue;

          const c = current.rect;
          const o = other.rect;

          const inside =
            c[0] >= o[0] &&
            c[1] >= o[1] &&
            c[2] <= o[2] &&
            c[3] <= o[3];

          if (inside) {
            if (
              c[0] === o[0] &&
              c[1] === o[1] &&
              c[2] === o[2] &&
              c[3] === o[3]
            ) {
              if (current.id > other.id) {
                isContained = true;
                break;
              }
            } else {
              isContained = true;
              break;
            }
          }
        }

        if (!isContained) {
          const labelX = current.rect[0];
          const labelY = current.rect[1] - rectH - 4 / scale;

          ctx.beginPath();
          ctx.roundRect(labelX, labelY, rectW, rectH, radius);
          ctx.fillStyle = color;
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, labelX + paddingX, labelY + rectH / 2 + 0.5 / scale);
        }
      }
      ctx.restore();
    }
  }

  isShapeLocked(shapeId: string): boolean {
    const isLocked = (id: string): boolean => {
      for (const [clientId, shapeIds] of this.#remoteSelections.entries()) {
        if (clientId !== this.canvasConnection.clientId() && shapeIds.includes(id)) {
          return true;
        }
      }
      return false;
    };

    if (isLocked(shapeId)) {
      return true;
    }

    const shape = this.canvas.shapes.find(s => s.properties[ShapePropertyName.id] === shapeId);
    if (shape instanceof GroupShape) {
      return shape.shapes.some(child => this.isShapeLocked(child.properties[ShapePropertyName.id]));
    }

    return false;
  }

  applyRemoteAction(action: CanvasAction) {
    this.canvas.actionHandler.executeAction(action);
    this.canvas.renderCanvas({ transformed: true });
  }

  emitAction(action: CanvasAction) {
    this.canvas.actionReceived.emit(action);
  }

  #watchCursorUpdates() {
    effect(() => {
      const update = this.canvasConnection.cursorUpdate();
      if (
        update &&
        update.noteId === this.#currentNoteId &&
        update.clientId !== this.canvasConnection.clientId()
      ) {
        this.#handleCursorUpdate(update);
      }
    });
  }

  #watchInitialCursors() {
    effect(() => {
      const cursors = this.canvasConnection.initialCursors();
      if (cursors) {
        cursors.forEach(cursor => this.#handleCursorUpdate(cursor));
      }
    });
  }

  #watchClientLeft() {
    effect(() => {
      const clientLeft = this.canvasConnection.clientLeft();
      if (clientLeft) {
        this.#remoteCursors.delete(clientLeft.clientId);
        this.canvas.renderCanvas({ presenceChanged: true });
      }
    });
  }

  #watchCursorRemoved() {
    effect(() => {
      const removedClientId = this.canvasConnection.cursorRemoved();
      if (removedClientId) {
        this.#remoteCursors.delete(removedClientId);
        this.#remoteSelections.delete(removedClientId);
        this.canvas.renderCanvas({ presenceChanged: true });
      }
    });
  }

  #watchSelectionUpdates() {
    effect(() => {
      const update = this.canvasConnection.selectionUpdate();
      if (update) {
        if (update.shapeIdList.length === 0) {
          this.#remoteSelections.delete(update.clientId);
        } else {
          this.#remoteSelections.set(update.clientId, update.shapeIdList);
        }
        this.canvas.renderCanvas({ presenceChanged: true });
      }
    });
  }

  #watchPresenceUpdates() {
    effect(() => {
      const presenceList = this.canvasConnection.presenceList();
      let changed = false;
      
      for (const presence of presenceList) {
        const cursor = this.#remoteCursors.get(presence.clientId);
        if (cursor && cursor.label !== presence.username) {
          cursor.label = presence.username;
          changed = true;
        }
      }

      if (changed) {
        this.canvas.renderCanvas({ presenceChanged: true });
      }
    });
  }
}
