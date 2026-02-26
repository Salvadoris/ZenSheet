import { EllipseShapeProperties } from '../ShapeProperties/EllipseShapeProperties';
import { GroupShapeProperties } from '../ShapeProperties/GroupShapeProperties';
import { ImageShapeProperties } from '../ShapeProperties/ImageShapeProperties';
import { LineShapeProperties } from '../ShapeProperties/LineShapeProperties';
import { RectangleShapeProperties } from '../ShapeProperties/RectangleShapeProperties';
import { SerializedShapeProperties } from '../ShapeProperties/ShapeProperties';
import { StraightLineShapeProperties } from '../ShapeProperties/StraightLineShapeProperties';
import { TextBoxShapeProperties } from '../ShapeProperties/TextBoxShapeProperties';
import { EllipseShape } from '../Shapes/EllipseShape';
import { GroupShape } from '../Shapes/GroupShape';
import { ImageShape } from '../Shapes/ImageShape';
import { LineShape } from '../Shapes/LineShape';
import { RectangleShape } from '../Shapes/RectangleShape';
import { Shape } from '../Shapes/Shape';
import { StraightLineShape } from '../Shapes/StraightLineShape';
import { TextBoxShape } from '../Shapes/TextBoxShape';

import { ShapePropertiesSerializer } from './ShapePropertiesSerializer';

export enum ShapeType {
  Line = 'Line',
  StraightLine = 'StraightLine',
  Rectangle = 'Rectangle',
  Ellipse = 'Ellipse',
  Image = 'Image',
  Text = 'Text',
  Group = 'Group',
}

export interface SerializedShape {
  type: ShapeType;
  properties: SerializedShapeProperties;
}

export class ShapeSerializer {
  #propertiesSerializer: ShapePropertiesSerializer;

  constructor() {
    this.#propertiesSerializer = new ShapePropertiesSerializer(this);
  }

  get propertiesSerializer() {
    return this.#propertiesSerializer;
  }

  serialized(shape: Shape): SerializedShape {
    if (shape instanceof LineShape) {
      return {
        type: ShapeType.Line,
        properties: this.#propertiesSerializer.serialized(
          ShapeType.Line,
          shape.properties
        ),
      };
    } else if (shape instanceof StraightLineShape) {
      return {
        type: ShapeType.StraightLine,
        properties: this.#propertiesSerializer.serialized(
          ShapeType.StraightLine,
          shape.properties
        ),
      };
    } else if (shape instanceof RectangleShape) {
      return {
        type: ShapeType.Rectangle,
        properties: this.#propertiesSerializer.serialized(
          ShapeType.Rectangle,
          shape.properties
        ),
      };
    } else if (shape instanceof EllipseShape) {
      return {
        type: ShapeType.Ellipse,
        properties: this.#propertiesSerializer.serialized(
          ShapeType.Ellipse,
          shape.properties
        ),
      };
    } else if (shape instanceof ImageShape) {
      return {
        type: ShapeType.Image,
        properties: this.#propertiesSerializer.serialized(
          ShapeType.Image,
          shape.properties
        ),
      };
    } else if (shape instanceof TextBoxShape) {
      return {
        type: ShapeType.Text,
        properties: this.#propertiesSerializer.serialized(
          ShapeType.Text,
          shape.properties
        ),
      };
    } else if (shape instanceof GroupShape) {
      return {
        type: ShapeType.Group,
        properties: this.#propertiesSerializer.serialized(
          ShapeType.Group,
          shape.properties
        ),
      };
    }
    throw new Error(`Unknown shape: ${shape}`);
  }

  deserialized(
    serializedShape: SerializedShape,
    ctx: CanvasRenderingContext2D,
    copy = false
  ): Shape {
    if (!serializedShape) {
      throw new Error('Cannot deserialize empty shape');
    }
    const properties = this.#propertiesSerializer.deserialized(
      serializedShape.type,
      serializedShape.properties,
      ctx,
      copy
    );
    switch (serializedShape.type) {
      case ShapeType.Line:
        return new LineShape(properties as Required<LineShapeProperties>, ctx);
      case ShapeType.StraightLine:
        return new StraightLineShape(
          properties as Required<StraightLineShapeProperties>,
          ctx
        );
      case ShapeType.Rectangle:
        return new RectangleShape(
          properties as Required<RectangleShapeProperties>,
          ctx
        );
      case ShapeType.Ellipse:
        return new EllipseShape(
          properties as Required<EllipseShapeProperties>,
          ctx
        );
      case ShapeType.Image:
        return new ImageShape(
          properties as Required<ImageShapeProperties>,
          ctx
        );
      case ShapeType.Text:
        return new TextBoxShape(
          properties as Required<TextBoxShapeProperties>,
          ctx
        );
      case ShapeType.Group: {
        return new GroupShape(
          properties as Required<GroupShapeProperties>,
          ctx
        );
      }
      default:
        throw new Error(`Unknown shape type: ${serializedShape.type}`);
    }
  }
}
