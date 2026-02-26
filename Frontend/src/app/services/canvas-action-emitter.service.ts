import { Injectable, inject } from '@angular/core';

import { ActionType } from '../layout/canvas/Actions/ActionType';
import { CanvasAction } from '../layout/canvas/Actions/CanvasAction';
import { DrawingSerializer } from '../layout/canvas/Serializer/DrawingSerializer';
import { ShapeSerializer } from '../layout/canvas/Serializer/ShapeSerializer';

import { CanvasConnectionService } from './canvas-connection.service';

/**
 * Service to handle sending canvas actions from the frontend to the backend
 * Acts as a bridge between canvas components and the WebSocket connection
 * Uses existing serializers for consistent data formatting
 */
@Injectable({
  providedIn: 'root',
})
export class CanvasActionEmitterService {
  #canvasConnection = inject(CanvasConnectionService);
  #shapeSerializer = new ShapeSerializer();
  #drawingSerializer = new DrawingSerializer();

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
        [ActionType.ShapeToLocal]: 'ShapeToLocal',
        [ActionType.ChangeDrawingProperties]: 'ChangeDrawingProperties'
    };

    return typeMap[actionType] || 'UnknownAction';
  }

  #serializeAction(action: CanvasAction): { type: string; data: unknown } {
    const data = { ...action.data };

    if ('shapes' in data && Array.isArray(data['shapes'])) {
      data['shapes'] = data['shapes'].map((shape) => this.#shapeSerializer.serialized(shape));
    }

    if ('drawings' in data && Array.isArray(data['drawings'])) {
      data['drawings'] = data['drawings'].map((drawing) =>
        this.#drawingSerializer.serialized(drawing)
      );
    }

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
