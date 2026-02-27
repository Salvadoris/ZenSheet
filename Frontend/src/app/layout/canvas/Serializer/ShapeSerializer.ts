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
  #bufferCtx: CanvasRenderingContext2D;

  constructor(bufferCtx: CanvasRenderingContext2D) {
    this.#propertiesSerializer = new ShapePropertiesSerializer(this);
    this.#bufferCtx = bufferCtx;
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
    copy = false
  ): Shape {
    if (!serializedShape) {
      throw new Error('Cannot deserialize empty shape');
    }
    const properties = this.#propertiesSerializer.deserialized(
      serializedShape.type,
      serializedShape.properties,
      copy
    );
    switch (serializedShape.type) {
      case ShapeType.Line:
        return new LineShape(
          properties as Required<LineShapeProperties>,
          this.#bufferCtx
        );
      case ShapeType.StraightLine:
        return new StraightLineShape(
          properties as Required<StraightLineShapeProperties>,
          this.#bufferCtx
        );
      case ShapeType.Rectangle:
        return new RectangleShape(
          properties as Required<RectangleShapeProperties>,
          this.#bufferCtx
        );
      case ShapeType.Ellipse:
        return new EllipseShape(
          properties as Required<EllipseShapeProperties>,
          this.#bufferCtx
        );
      case ShapeType.Image:
        return new ImageShape(
          properties as Required<ImageShapeProperties>,
          this.#bufferCtx
        );
      case ShapeType.Text:
        return new TextBoxShape(
          properties as Required<TextBoxShapeProperties>,
          this.#bufferCtx
        );
      case ShapeType.Group: {
        return new GroupShape(
          properties as Required<GroupShapeProperties>,
          this.#bufferCtx
        );
      }
      default:
        throw new Error(`Unknown shape type: ${serializedShape.type}`);
    }
  }
}
