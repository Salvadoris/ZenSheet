import { SerializedShape } from '../Serializer/ShapeSerializer';
import { Shape } from '../Shapes/Shape';
import { NullableShapeStyle } from '../ShapeStyles/ShapeStyle';

import { LinePoints } from './LineShapeProperties';
import { ShapePropertyName } from './ShapePropertyName';

export interface ShapeProperties {
  [ShapePropertyName.id]: string;
  [ShapePropertyName.style]: NullableShapeStyle;
  [ShapePropertyName.originX]: number;
  [ShapePropertyName.originY]: number;
  [ShapePropertyName.originalWidth]: number;
  [ShapePropertyName.originalHeight]: number;
  [ShapePropertyName.width]: number;
  [ShapePropertyName.height]: number;
  [ShapePropertyName.scaleX]: number;
  [ShapePropertyName.scaleY]: number;
  [ShapePropertyName.minWidth]: number;
  [ShapePropertyName.minHeight]: number;
  [ShapePropertyName.invertable]: boolean;
  [ShapePropertyName.horizontalInverted]: boolean;
  [ShapePropertyName.verticallyInverted]: boolean;
  [ShapePropertyName.edited]: boolean;
  [ShapePropertyName.selected]: boolean;
  [ShapePropertyName.shapes]?: Shape[];
  [ShapePropertyName.src]?: string;
  [ShapePropertyName.text]?: string;
  [ShapePropertyName.wrap]?: boolean;
  [ShapePropertyName.points]?: LinePoints;
}

export type BaseShapeProperties = Required<
  Pick<
    ShapeProperties,
    | ShapePropertyName.id
    | ShapePropertyName.style
    | ShapePropertyName.originX
    | ShapePropertyName.originY
    | ShapePropertyName.originalWidth
    | ShapePropertyName.originalHeight
    | ShapePropertyName.edited
    | ShapePropertyName.selected
  >
> &
  Partial<
    Pick<
      ShapeProperties,
      | ShapePropertyName.width
      | ShapePropertyName.height
      | ShapePropertyName.scaleX
      | ShapePropertyName.scaleY
      | ShapePropertyName.minWidth
      | ShapePropertyName.minHeight
      | ShapePropertyName.invertable
      | ShapePropertyName.horizontalInverted
      | ShapePropertyName.verticallyInverted
    >
  >;

export type ChangableShapeProperties = Partial<
  Pick<
    ShapeProperties,
    | ShapePropertyName.style
    | ShapePropertyName.originX
    | ShapePropertyName.originY
    | ShapePropertyName.width
    | ShapePropertyName.height
    | ShapePropertyName.shapes
    | ShapePropertyName.src
    | ShapePropertyName.text
    | ShapePropertyName.wrap
    | ShapePropertyName.points
  >
>;

export type BaseSerializedShapeProperties = Required<
  Pick<
    ShapeProperties,
    | ShapePropertyName.id
    | ShapePropertyName.style
    | ShapePropertyName.originX
    | ShapePropertyName.originY
    | ShapePropertyName.originalWidth
    | ShapePropertyName.originalHeight
    | ShapePropertyName.width
    | ShapePropertyName.height
    | ShapePropertyName.minWidth
    | ShapePropertyName.minHeight
    | ShapePropertyName.invertable
    | ShapePropertyName.edited
  >
>;

export type SerializedShapeProperties = BaseSerializedShapeProperties & {
  [ShapePropertyName.shapes]?: SerializedShape[];
} & Partial<
    Pick<
      ShapeProperties,
      | ShapePropertyName.src
      | ShapePropertyName.text
      | ShapePropertyName.wrap
      | ShapePropertyName.points
    >
  >;

export type RelocateSerializedShapeProperties = Required<
  Pick<
    SerializedShapeProperties,
    | ShapePropertyName.id
    | ShapePropertyName.originX
    | ShapePropertyName.originY
    | ShapePropertyName.width
    | ShapePropertyName.height
  >
>;

export type ChangableBaseSerializedShapeProperties = Partial<
  Pick<
    SerializedShapeProperties,
    | ShapePropertyName.style
    | ShapePropertyName.originX
    | ShapePropertyName.originY
    | ShapePropertyName.width
    | ShapePropertyName.height
    | ShapePropertyName.minWidth
    | ShapePropertyName.edited
  >
>;

export type ChangableSerializedShapeProperties =
  ChangableBaseSerializedShapeProperties &
    Partial<
      Pick<
        SerializedShapeProperties,
        ShapePropertyName.src | ShapePropertyName.wrap
      >
    > & {
      [ShapePropertyName.text]?: {
        startIndex: number;
        endIndex: number;
        text: string;
      };
      [ShapePropertyName.shapes]?: {
        [ShapePropertyName.id]: string;
        properties: ChangableSerializedShapeProperties;
      }[];
    };
