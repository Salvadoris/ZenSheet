import { FilledRectShapeProperties } from '../ShapeProperties/FilledRectShapeProperties';
import { GroupShapeProperties } from '../ShapeProperties/GroupShapeProperties';
import { ImageShapeProperties } from '../ShapeProperties/ImageShapeProperties';
import { LineShapeProperties } from '../ShapeProperties/LineShapeProperties';
import { SerializedShapeProperties } from '../ShapeProperties/ShapeProperties';
import { StrokedRectShapeProperties } from '../ShapeProperties/StrokedRectShapeProperties';
import { TextBoxShapeProperties } from '../ShapeProperties/TextBoxShapeProperties';
import { FilledRectShape } from '../Shapes/FilledRectShape';
import { GroupShape } from '../Shapes/GroupShape';
import { ImageShape } from '../Shapes/ImageShape';
import { LineShape } from '../Shapes/LineShape';
import { Shape } from '../Shapes/Shape';
import { StrokedRectShape } from '../Shapes/StrokedRectShape';
import { TextBoxShape } from '../Shapes/TextBoxShape';

import { ShapePropertiesSerializer } from './ShapePropertiesSerializer';

export enum ShapeType {
  FilledRect = 'FilledRect',
  StrokedRect = 'StrokedRect',
  Line = 'Line',
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
    if (shape instanceof FilledRectShape) {
      return {
        type: ShapeType.FilledRect,
        properties: this.#propertiesSerializer.serialized(
          ShapeType.FilledRect,
          shape.properties
        ),
      };
    } else if (shape instanceof StrokedRectShape) {
      return {
        type: ShapeType.StrokedRect,
        properties: this.#propertiesSerializer.serialized(
          ShapeType.StrokedRect,
          shape.properties
        ),
      };
    } else if (shape instanceof LineShape) {
      return {
        type: ShapeType.Line,
        properties: this.#propertiesSerializer.serialized(
          ShapeType.Line,
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
    const properties = this.#propertiesSerializer.deserialized(
      serializedShape.type,
      serializedShape.properties,
      ctx,
      copy
    );
    switch (serializedShape.type) {
      case ShapeType.FilledRect:
        return new FilledRectShape(
          properties as Required<FilledRectShapeProperties>,
          ctx
        );
      case ShapeType.StrokedRect:
        return new StrokedRectShape(
          properties as Required<StrokedRectShapeProperties>,
          ctx
        );
      case ShapeType.Line:
        return new LineShape(properties as Required<LineShapeProperties>, ctx);
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
