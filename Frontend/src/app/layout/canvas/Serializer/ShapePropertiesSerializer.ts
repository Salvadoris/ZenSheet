import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { generateUuid } from '../../../utils/uuid';
import {
  EllipseShapeProperties,
  SerializedEllipseShapeProperties,
} from '../ShapeProperties/EllipseShapeProperties';
import {
  GroupShapeProperties,
  SerializedGroupShapeProperties,
} from '../ShapeProperties/GroupShapeProperties';
import {
  ImageShapeProperties,
  SerializedImageShapeProperties,
} from '../ShapeProperties/ImageShapeProperties';
import {
  LineShapeProperties,
  SerializedLineShapeProperties,
} from '../ShapeProperties/LineShapeProperties';
import {
  RectangleShapeProperties,
  SerializedRectangleShapeProperties,
} from '../ShapeProperties/RectangleShapeProperties';
import {
  SerializedShapeProperties,
  ShapeProperties,
} from '../ShapeProperties/ShapeProperties';
import {
  SerializedStraightLineShapeProperties,
  StraightLineShapeProperties,
} from '../ShapeProperties/StraightLineShapeProperties';
import {
  SerializedTextBoxShapeProperties,
  TextBoxShapeProperties,
} from '../ShapeProperties/TextBoxShapeProperties';
import { Shape } from '../Shapes/Shape';
import { EllipseStyle, EllipseStyleType } from '../ShapeStyles/EllipseStyle';
import {
  GroupShapeStyle,
  GroupShapeStyleType,
} from '../ShapeStyles/GroupShapeStyle';
import { ImageStyle, ImageStyleType } from '../ShapeStyles/ImageStyle';
import { LineStyle, LineStyleType } from '../ShapeStyles/LineStyle';
import {
  RectangleStyle,
  RectangleStyleType,
} from '../ShapeStyles/RectangleStyle';
import {
  StraightLineStyle,
  StraightLineStyleType,
} from '../ShapeStyles/StraightLineStyle';
import { TextBoxStyle, TextBoxStyleType } from '../ShapeStyles/TextBoxStyle';

import { SerializedShape, ShapeSerializer, ShapeType } from './ShapeSerializer';

export class ShapePropertiesSerializer {
  constructor(private shapeSerializer: ShapeSerializer) {}

  serialized(
    type: ShapeType,
    properties: ShapeProperties
  ): SerializedShapeProperties {
    switch (type) {
      case ShapeType.Line:
        return {
          ...(properties as LineShapeProperties),
          [FormPropertyName.style]: {
            ...properties[FormPropertyName.style],
          },
          [FormPropertyName.points]: [
            ...(properties as LineShapeProperties)[FormPropertyName.points],
          ],
        } as SerializedLineShapeProperties;
      case ShapeType.StraightLine:
        return {
          ...(properties as StraightLineShapeProperties),
          [FormPropertyName.style]: {
            ...properties[FormPropertyName.style],
          },
        } as SerializedStraightLineShapeProperties;
      case ShapeType.Rectangle:
        return {
          ...(properties as RectangleShapeProperties),
          [FormPropertyName.style]: {
            ...properties[FormPropertyName.style],
          },
        } as SerializedRectangleShapeProperties;
      case ShapeType.Ellipse:
        return {
          ...(properties as EllipseShapeProperties),
          [FormPropertyName.style]: {
            ...properties[FormPropertyName.style],
          },
        } as SerializedEllipseShapeProperties;
      case ShapeType.Image:
        return {
          ...(properties as ImageShapeProperties),
          [FormPropertyName.style]: {
            ...properties[FormPropertyName.style],
          },
        } as SerializedImageShapeProperties;
      case ShapeType.Text:
        return {
          ...(properties as TextBoxShapeProperties),
          [FormPropertyName.style]: {
            ...properties[FormPropertyName.style],
          },
        } as SerializedTextBoxShapeProperties;
      case ShapeType.Group: {
        return {
          ...(properties as GroupShapeProperties),
          [FormPropertyName.style]: {
            ...properties[FormPropertyName.style],
          },
          [FormPropertyName.shapes]: (properties as GroupShapeProperties)[
            FormPropertyName.shapes
          ].map(s => this.shapeSerializer.serialized(s)),
        } as SerializedGroupShapeProperties;
      }
      default:
        throw new Error(`Unknown shape type: ${type}`);
    }
  }

  deserialized(
    type: ShapeType,
    serializedProperties: SerializedShapeProperties,
    copy = false
  ): ShapeProperties {
    const properties = {
      [FormPropertyName.scaleX]:
        serializedProperties[FormPropertyName.width] /
        serializedProperties[FormPropertyName.originalWidth],
      [FormPropertyName.scaleY]:
        serializedProperties[FormPropertyName.height] /
        serializedProperties[FormPropertyName.originalHeight],
      [FormPropertyName.horizontalInverted]:
        serializedProperties[FormPropertyName.width] < 0,
      [FormPropertyName.verticallyInverted]:
        serializedProperties[FormPropertyName.height] < 0,
    };
    switch (type) {
      case ShapeType.Line:
        return {
          ...(serializedProperties as SerializedLineShapeProperties),
          ...properties,
          [FormPropertyName.style]: new LineStyle(
            serializedProperties[FormPropertyName.style] as LineStyleType
          ),
          [FormPropertyName.id]: copy
            ? generateUuid()
            : serializedProperties[FormPropertyName.id],
        } as Required<LineShapeProperties>;
      case ShapeType.StraightLine:
        return {
          ...(serializedProperties as SerializedStraightLineShapeProperties),
          ...properties,
          [FormPropertyName.style]: new StraightLineStyle(
            serializedProperties[
              FormPropertyName.style
            ] as StraightLineStyleType
          ),
          [FormPropertyName.id]: copy
            ? generateUuid()
            : serializedProperties[FormPropertyName.id],
        } as Required<StraightLineShapeProperties>;
      case ShapeType.Rectangle:
        return {
          ...(serializedProperties as SerializedRectangleShapeProperties),
          ...properties,
          [FormPropertyName.style]: new RectangleStyle(
            serializedProperties[FormPropertyName.style] as RectangleStyleType
          ),
          [FormPropertyName.id]: copy
            ? generateUuid()
            : serializedProperties[FormPropertyName.id],
        } as Required<RectangleShapeProperties>;
      case ShapeType.Ellipse:
        return {
          ...(serializedProperties as SerializedEllipseShapeProperties),
          ...properties,
          [FormPropertyName.style]: new EllipseStyle(
            serializedProperties[FormPropertyName.style] as EllipseStyleType
          ),
          [FormPropertyName.id]: copy
            ? generateUuid()
            : serializedProperties[FormPropertyName.id],
        } as Required<EllipseShapeProperties>;
      case ShapeType.Image:
        return {
          ...(serializedProperties as SerializedImageShapeProperties),
          ...properties,
          [FormPropertyName.style]: new ImageStyle(
            serializedProperties[FormPropertyName.style] as ImageStyleType
          ),
          [FormPropertyName.id]: copy
            ? generateUuid()
            : serializedProperties[FormPropertyName.id],
        } as Required<ImageShapeProperties>;
      case ShapeType.Text:
        return {
          ...(serializedProperties as SerializedTextBoxShapeProperties),
          ...properties,
          [FormPropertyName.style]: new TextBoxStyle(
            serializedProperties[FormPropertyName.style] as TextBoxStyleType
          ),
          [FormPropertyName.id]: copy
            ? generateUuid()
            : serializedProperties[FormPropertyName.id],
        } as Required<TextBoxShapeProperties>;
      case ShapeType.Group: {
        const style = new GroupShapeStyle([
          serializedProperties[FormPropertyName.style] as GroupShapeStyleType,
        ]);
        let shapes: Shape[] = [];
        if (
          (serializedProperties as SerializedGroupShapeProperties)[
            FormPropertyName.shapes
          ] !== undefined
        ) {
          shapes = (
            (serializedProperties as SerializedGroupShapeProperties)[
              FormPropertyName.shapes
            ] as SerializedShape[]
          ).map(s => this.shapeSerializer.deserialized(s, copy));
        }
        return {
          ...(serializedProperties as SerializedGroupShapeProperties),
          ...properties,
          [FormPropertyName.style]: style,
          [FormPropertyName.id]: copy
            ? generateUuid()
            : serializedProperties[FormPropertyName.id],
          [FormPropertyName.shapes]: shapes,
        } as Required<GroupShapeProperties>;
      }
      default:
        throw new Error(`Unknown shape type: ${type}`);
    }
  }
}
