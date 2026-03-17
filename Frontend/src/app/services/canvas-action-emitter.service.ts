import { Injectable, inject } from '@angular/core';

import { ActionType } from '../layout/canvas/Actions/ActionType';
import { CanvasAction } from '../layout/canvas/Actions/CanvasAction';

import { CanvasConnectionService } from './canvas-connection.service';

@Injectable({
  providedIn: 'root',
})
export class CanvasActionEmitterService {
  #canvasConnection = inject(CanvasConnectionService);

  async emitAction(noteId: string, action: CanvasAction): Promise<void> {
    if (!noteId) {
      console.warn('Cannot emit action: no noteId');
      return;
    }

    try {
      const actionType = this.#mapActionType(action.type);
      const payload = this.#serializeAction(action);

      await this.#canvasConnection.sendAction(noteId, actionType, payload);
    } catch (error) {
      console.error('Failed to emit canvas action:', error);
      throw error;
    }
  }

  #mapActionType(actionType: ActionType): string {
    const typeMap: Record<ActionType, string> = {
        [ActionType.AddShapes]: 'AddShapes',
        [ActionType.RemoveShapes]: 'RemoveShapes',
        [ActionType.ChangeShapesProperties]: 'ChangeShapesProperties',
        [ActionType.AddGroupShape]: 'AddGroupShape',
        [ActionType.RemoveGroupShape]: 'RemoveGroupShape',
        [ActionType.AddDrawings]: 'AddDrawings',
        [ActionType.RemoveDrawings]: 'RemoveDrawings',
        [ActionType.DrawingToShape]: 'DrawingToShape',
        [ActionType.ChangeShapesLayer]: 'ChangeShapesLayer',
        [ActionType.ChangeDrawingProperties]: 'ChangeDrawingProperties'
    };

    return typeMap[actionType] || 'UnknownAction';
  }

  #serializeAction(action: CanvasAction): { type: string; data: unknown } {
    const data = { ...action.data };

    return {
      type: action.type,
      data: this.#deepSerialize(data),
    };
  }

  #deepSerialize(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;

    if (obj instanceof Date) return obj.toISOString();
    if (obj instanceof Array) return obj.map((item) => this.#deepSerialize(item));

    if (typeof obj === 'object') {
      const serialized: Record<string, unknown> = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          serialized[key] = this.#deepSerialize((obj as Record<string, unknown>)[key]);
        }
      }
      return serialized;
    }

    return obj;
  }
}
