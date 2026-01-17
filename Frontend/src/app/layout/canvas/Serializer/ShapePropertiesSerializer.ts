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
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
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
          [ShapePropertyName.style]: {
            ...properties[ShapePropertyName.style],
          },
          [ShapePropertyName.points]: [
            ...(properties as LineShapeProperties)[ShapePropertyName.points],
          ],
        } as SerializedLineShapeProperties;
      case ShapeType.StraightLine:
        return {
          ...(properties as StraightLineShapeProperties),
          [ShapePropertyName.style]: {
            ...properties[ShapePropertyName.style],
          },
        } as SerializedStraightLineShapeProperties;
      case ShapeType.Rectangle:
        return {
          ...(properties as RectangleShapeProperties),
          [ShapePropertyName.style]: {
            ...properties[ShapePropertyName.style],
          },
        } as SerializedRectangleShapeProperties;
      case ShapeType.Ellipse:
        return {
          ...(properties as EllipseShapeProperties),
          [ShapePropertyName.style]: {
            ...properties[ShapePropertyName.style],
          },
        } as SerializedEllipseShapeProperties;
      case ShapeType.Image:
        return {
          ...(properties as ImageShapeProperties),
          [ShapePropertyName.style]: {
            ...properties[ShapePropertyName.style],
          },
        } as SerializedImageShapeProperties;
      case ShapeType.Text:
        return {
          ...(properties as TextBoxShapeProperties),
          [ShapePropertyName.style]: {
            ...properties[ShapePropertyName.style],
          },
        } as SerializedTextBoxShapeProperties;
      case ShapeType.Group: {
        return {
          ...(properties as GroupShapeProperties),
          [ShapePropertyName.style]: {
            ...properties[ShapePropertyName.style],
          },
          [ShapePropertyName.shapes]: (properties as GroupShapeProperties)[
            ShapePropertyName.shapes
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
    ctx: CanvasRenderingContext2D,
    copy = false
  ): ShapeProperties {
    const properties = {
      [ShapePropertyName.scaleX]:
        serializedProperties[ShapePropertyName.width] /
        serializedProperties[ShapePropertyName.originalWidth],
      [ShapePropertyName.scaleY]:
        serializedProperties[ShapePropertyName.height] /
        serializedProperties[ShapePropertyName.originalHeight],
      [ShapePropertyName.horizontalInverted]:
        serializedProperties[ShapePropertyName.width] < 0,
      [ShapePropertyName.verticallyInverted]:
        serializedProperties[ShapePropertyName.height] < 0,
    };
    switch (type) {
      case ShapeType.Line:
        return {
          ...(serializedProperties as SerializedLineShapeProperties),
          ...properties,
          [ShapePropertyName.style]: new LineStyle(
            serializedProperties[ShapePropertyName.style] as LineStyleType
          ),
          [ShapePropertyName.id]: copy
            ? crypto.randomUUID()
            : serializedProperties[ShapePropertyName.id],
        } as Required<LineShapeProperties>;
      case ShapeType.StraightLine:
        return {
          ...(serializedProperties as SerializedStraightLineShapeProperties),
          ...properties,
          [ShapePropertyName.style]: new StraightLineStyle(
            serializedProperties[
              ShapePropertyName.style
            ] as StraightLineStyleType
          ),
          [ShapePropertyName.id]: copy
            ? crypto.randomUUID()
            : serializedProperties[ShapePropertyName.id],
        } as Required<StraightLineShapeProperties>;
      case ShapeType.Rectangle:
        return {
          ...(serializedProperties as SerializedRectangleShapeProperties),
          ...properties,
          [ShapePropertyName.style]: new RectangleStyle(
            serializedProperties[ShapePropertyName.style] as RectangleStyleType
          ),
          [ShapePropertyName.id]: copy
            ? crypto.randomUUID()
            : serializedProperties[ShapePropertyName.id],
        } as Required<RectangleShapeProperties>;
      case ShapeType.Ellipse:
        return {
          ...(serializedProperties as SerializedEllipseShapeProperties),
          ...properties,
          [ShapePropertyName.style]: new EllipseStyle(
            serializedProperties[ShapePropertyName.style] as EllipseStyleType
          ),
          [ShapePropertyName.id]: copy
            ? crypto.randomUUID()
            : serializedProperties[ShapePropertyName.id],
        } as Required<EllipseShapeProperties>;
      case ShapeType.Image:
        return {
          ...(serializedProperties as SerializedImageShapeProperties),
          ...properties,
          [ShapePropertyName.style]: new ImageStyle(
            serializedProperties[ShapePropertyName.style] as ImageStyleType
          ),
          [ShapePropertyName.id]: copy
            ? crypto.randomUUID()
            : serializedProperties[ShapePropertyName.id],
        } as Required<ImageShapeProperties>;
      case ShapeType.Text:
        return {
          ...(serializedProperties as SerializedTextBoxShapeProperties),
          ...properties,
          [ShapePropertyName.style]: new TextBoxStyle(
            serializedProperties[ShapePropertyName.style] as TextBoxStyleType
          ),
          [ShapePropertyName.id]: copy
            ? crypto.randomUUID()
            : serializedProperties[ShapePropertyName.id],
        } as Required<TextBoxShapeProperties>;
      case ShapeType.Group: {
        const style = new GroupShapeStyle([
          serializedProperties[ShapePropertyName.style] as GroupShapeStyleType,
        ]);
        const nonNullStyle = Object.fromEntries(
          Object.entries(style).filter(([, value]) => value != null)
        );
        let shapes: Shape[] = [];
        if (
          (serializedProperties as SerializedGroupShapeProperties)[
            ShapePropertyName.shapes
          ] !== undefined
        ) {
          shapes = (
            (serializedProperties as SerializedGroupShapeProperties)[
              ShapePropertyName.shapes
            ] as SerializedShape[]
          ).map(s => this.shapeSerializer.deserialized(s, ctx, copy));
          shapes.forEach(s => {
            s.properties[ShapePropertyName.style] = {
              ...s.properties[ShapePropertyName.style],
              ...nonNullStyle,
            };
          });
        }
        return {
          ...(serializedProperties as SerializedGroupShapeProperties),
          ...properties,
          [ShapePropertyName.style]: style,
          [ShapePropertyName.id]: copy
            ? crypto.randomUUID()
            : serializedProperties[ShapePropertyName.id],
          [ShapePropertyName.shapes]: shapes,
        } as Required<GroupShapeProperties>;
      }
      default:
        throw new Error(`Unknown shape type: ${type}`);
    }
  }
}
