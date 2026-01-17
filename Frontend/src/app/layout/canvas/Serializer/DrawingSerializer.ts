import { DrawingProperties } from '../DrawingProperties/DrawingProperties';
import { DrawingPropertyName } from '../DrawingProperties/DrawingPropertyName';
import { FilledRectDrawingProperties } from '../DrawingProperties/FilledRectDrawingProperties';
import { LineDrawingProperties } from '../DrawingProperties/LineDrawingProperties';
import { StraightLineDrawingProperties } from '../DrawingProperties/StraightLineDrawingProperties';
import { StrokedRectDrawingProperties } from '../DrawingProperties/StrokedRectDrawingProperties';
import { Drawing } from '../Drawings/Drawing';
import { FilledRectDrawing } from '../Drawings/FilledRectDrawing';
import { LineDrawing } from '../Drawings/LineDrawing';
import { StraightLineDrawing } from '../Drawings/StraightLineDrawing';
import { StrokedRectDrawing } from '../Drawings/StrokedRectDrawing';
import {
  FilledRectStyle,
  FilledRectStyleType,
} from '../ShapeStyles/FilledRectStyle';
import { LineStyle, LineStyleType } from '../ShapeStyles/LineStyle';
import { StraightLineStyleType } from '../ShapeStyles/StraightLineStyle';
import {
  StrokedRectStyle,
  StrokedRectStyleType,
} from '../ShapeStyles/StrokedRectStyle';

export enum DrawingType {
  FilledRect = 'FilledRect',
  StrokedRect = 'StrokedRect',
  Line = 'Line',
  StraightLine = 'StraightLine',
}

export interface SerializedDrawing {
  type: DrawingType;
  properties: DrawingProperties;
}

export class DrawingSerializer {
  serialized(drawing: Drawing): SerializedDrawing {
    if (drawing instanceof FilledRectDrawing) {
      return {
        type: DrawingType.FilledRect,
        properties: {
          ...drawing.properties,
          [DrawingPropertyName.style]: {
            ...drawing.properties[DrawingPropertyName.style],
          },
          [DrawingPropertyName.p1]: [
            drawing.properties[DrawingPropertyName.p1][0],
            drawing.properties[DrawingPropertyName.p1][1],
          ],
        },
      };
    } else if (drawing instanceof StrokedRectDrawing) {
      return {
        type: DrawingType.StrokedRect,
        properties: {
          ...drawing.properties,
          [DrawingPropertyName.style]: {
            ...drawing.properties[DrawingPropertyName.style],
          },
          [DrawingPropertyName.p1]: [
            drawing.properties[DrawingPropertyName.p1][0],
            drawing.properties[DrawingPropertyName.p1][1],
          ],
        },
      };
    } else if (drawing instanceof LineDrawing) {
      return {
        type: DrawingType.Line,
        properties: {
          ...drawing.properties,
          [DrawingPropertyName.style]: {
            ...drawing.properties[DrawingPropertyName.style],
          },
          [DrawingPropertyName.points]: [
            ...drawing.properties[DrawingPropertyName.points],
          ],
        },
      };
    } else if (drawing instanceof StraightLineDrawing) {
      return {
        type: DrawingType.StraightLine,
        properties: {
          ...drawing.properties,
          [DrawingPropertyName.style]: {
            ...drawing.properties[DrawingPropertyName.style],
          },
          [DrawingPropertyName.p1]: [
            drawing.properties[DrawingPropertyName.p1][0],
            drawing.properties[DrawingPropertyName.p1][1],
          ],
        },
      };
    }
    throw new Error(`Unknown drawing: ${drawing}`);
  }

  deserialized(serializedDrawing: SerializedDrawing): Drawing {
    switch (serializedDrawing.type) {
      case DrawingType.FilledRect:
        return new FilledRectDrawing({
          ...serializedDrawing.properties,
          [DrawingPropertyName.style]: new FilledRectStyle(
            serializedDrawing.properties[
              DrawingPropertyName.style
            ] as FilledRectStyleType
          ),
        } as FilledRectDrawingProperties);
      case DrawingType.StrokedRect:
        return new StrokedRectDrawing({
          ...serializedDrawing.properties,
          [DrawingPropertyName.style]: new StrokedRectStyle(
            serializedDrawing.properties[
              DrawingPropertyName.style
            ] as StrokedRectStyleType
          ),
        } as StrokedRectDrawingProperties);
      case DrawingType.Line:
        return new LineDrawing({
          ...serializedDrawing.properties,
          [DrawingPropertyName.style]: new LineStyle(
            serializedDrawing.properties[
              DrawingPropertyName.style
            ] as LineStyleType
          ),
        } as LineDrawingProperties);
      case DrawingType.StraightLine:
        return new StraightLineDrawing({
          ...serializedDrawing.properties,
          [DrawingPropertyName.style]: new StrokedRectStyle(
            serializedDrawing.properties[
              DrawingPropertyName.style
            ] as StraightLineStyleType
          ),
        } as StraightLineDrawingProperties);
      default:
        throw new Error(`Unknown drawing type: ${serializedDrawing.type}`);
    }
  }
}
