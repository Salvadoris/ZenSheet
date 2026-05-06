import { DrawingProperties } from '../DrawingProperties/DrawingProperties';
import { EllipseDrawingProperties } from '../DrawingProperties/EllipseDrawingProperties';
import { LineDrawingProperties } from '../DrawingProperties/LineDrawingProperties';
import { RectangleDrawingProperties } from '../DrawingProperties/RectangleDrawingProperties';
import { StraightLineDrawingProperties } from '../DrawingProperties/StraightLineDrawingProperties';
import { Drawing } from '../Drawings/Drawing';
import { EllipseDrawing } from '../Drawings/EllipseDrawing';
import { LineDrawing } from '../Drawings/LineDrawing';
import { RectangleDrawing } from '../Drawings/RectangleDrawing';
import { StraightLineDrawing } from '../Drawings/StraightLineDrawing';
import { FormPropertyName } from '../FormProperties/FormPropertyName';
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
  #bufferCtx: CanvasRenderingContext2D;

  constructor(bufferCtx: CanvasRenderingContext2D) {
    this.#bufferCtx = bufferCtx;
  }

  serialized(drawing: Drawing): SerializedDrawing {
    if (drawing instanceof LineDrawing) {
      return {
        type: DrawingType.Line,
        properties: {
          ...drawing.properties,
          [FormPropertyName.style]: {
            ...drawing.properties[FormPropertyName.style],
          },
          [FormPropertyName.points]: [
            ...drawing.properties[FormPropertyName.points],
          ],
        },
      };
    } else if (drawing instanceof StraightLineDrawing) {
      return {
        type: DrawingType.StraightLine,
        properties: {
          ...drawing.properties,
          [FormPropertyName.style]: {
            ...drawing.properties[FormPropertyName.style],
          },
        },
      };
    } else if (drawing instanceof RectangleDrawing) {
      return {
        type: DrawingType.Rectangle,
        properties: {
          ...drawing.properties,
          [FormPropertyName.style]: {
            ...drawing.properties[FormPropertyName.style],
          },
        },
      };
    } else if (drawing instanceof EllipseDrawing) {
      return {
        type: DrawingType.Ellipse,
        properties: {
          ...drawing.properties,
          [FormPropertyName.style]: {
            ...drawing.properties[FormPropertyName.style],
          },
        },
      };
    }
    throw new Error(`Unknown drawing: ${drawing}`);
  }

  deserialized(serializedDrawing: SerializedDrawing): Drawing {
    switch (serializedDrawing.type) {
      case DrawingType.Line:
        return new LineDrawing(
          {
            ...serializedDrawing.properties,
            [FormPropertyName.style]: new LineStyle(
              serializedDrawing.properties[
                FormPropertyName.style
              ] as LineStyleType
            ),
          } as LineDrawingProperties,
          this.#bufferCtx
        );
      case DrawingType.StraightLine:
        return new StraightLineDrawing(
          {
            ...serializedDrawing.properties,
            [FormPropertyName.style]: new StraightLineStyle(
              serializedDrawing.properties[
                FormPropertyName.style
              ] as StraightLineStyleType
            ),
          } as StraightLineDrawingProperties,
          this.#bufferCtx
        );
      case DrawingType.Rectangle:
        return new RectangleDrawing(
          {
            ...serializedDrawing.properties,
            [FormPropertyName.style]: new RectangleStyle(
              serializedDrawing.properties[
                FormPropertyName.style
              ] as RectangleStyleType
            ),
          } as RectangleDrawingProperties,
          this.#bufferCtx
        );
      case DrawingType.Ellipse:
        return new EllipseDrawing(
          {
            ...serializedDrawing.properties,
            [FormPropertyName.style]: new EllipseStyle(
              serializedDrawing.properties[
                FormPropertyName.style
              ] as EllipseStyleType
            ),
          } as EllipseDrawingProperties,
          this.#bufferCtx
        );
      default:
        throw new Error(`Unknown drawing type: ${serializedDrawing.type}`);
    }
  }
}
