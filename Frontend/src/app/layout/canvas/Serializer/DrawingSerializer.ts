import { DrawingProperties } from '../DrawingProperties/DrawingProperties';
import { DrawingPropertyName } from '../DrawingProperties/DrawingPropertyName';
import { EllipseDrawingProperties } from '../DrawingProperties/EllipseDrawingProperties';
import { LineDrawingProperties } from '../DrawingProperties/LineDrawingProperties';
import { RectangleDrawingProperties } from '../DrawingProperties/RectangleDrawingProperties';
import { StraightLineDrawingProperties } from '../DrawingProperties/StraightLineDrawingProperties';
import { Drawing } from '../Drawings/Drawing';
import { EllipseDrawing } from '../Drawings/EllipseDrawing';
import { LineDrawing } from '../Drawings/LineDrawing';
import { RectangleDrawing } from '../Drawings/RectangleDrawing';
import { StraightLineDrawing } from '../Drawings/StraightLineDrawing';
import { EllipseStyle, EllipseStyleType } from '../ShapeStyles/EllipseStyle';
import { LineStyle, LineStyleType } from '../ShapeStyles/LineStyle';
import {
  RectangleStyle,
  RectangleStyleType,
} from '../ShapeStyles/RectangleStyle';
import {
  StraightLineStyle,
  StraightLineStyleType,
} from '../ShapeStyles/StraightLineStyle';

export enum DrawingType {
  Line = 'Line',
  StraightLine = 'StraightLine',
  Rectangle = 'Rectangle',
  Ellipse = 'Ellipse',
}

export interface SerializedDrawing {
  type: DrawingType;
  properties: DrawingProperties;
}

export class DrawingSerializer {
  serialized(drawing: Drawing): SerializedDrawing {
    if (drawing instanceof LineDrawing) {
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
    } else if (drawing instanceof RectangleDrawing) {
      return {
        type: DrawingType.Rectangle,
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
    } else if (drawing instanceof EllipseDrawing) {
      return {
        type: DrawingType.Ellipse,
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
          [DrawingPropertyName.style]: new StraightLineStyle(
            serializedDrawing.properties[
              DrawingPropertyName.style
            ] as StraightLineStyleType
          ),
        } as StraightLineDrawingProperties);
      case DrawingType.Rectangle:
        return new RectangleDrawing({
          ...serializedDrawing.properties,
          [DrawingPropertyName.style]: new RectangleStyle(
            serializedDrawing.properties[
              DrawingPropertyName.style
            ] as RectangleStyleType
          ),
        } as RectangleDrawingProperties);
      case DrawingType.Ellipse:
        return new EllipseDrawing({
          ...serializedDrawing.properties,
          [DrawingPropertyName.style]: new EllipseStyle(
            serializedDrawing.properties[
              DrawingPropertyName.style
            ] as EllipseStyleType
          ),
        } as EllipseDrawingProperties);
      default:
        throw new Error(`Unknown drawing type: ${serializedDrawing.type}`);
    }
  }
}
