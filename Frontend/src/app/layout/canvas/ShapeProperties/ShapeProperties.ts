import { FormProperties } from '../FormProperties/FormProperties';
import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { SerializedShape } from '../Serializer/ShapeSerializer';

export type ShapeProperties = Required<BaseShapeProperties> &
  Partial<
    Pick<
      FormProperties,
      | FormPropertyName.shapes
      | FormPropertyName.src
      | FormPropertyName.text
      | FormPropertyName.wrap
      | FormPropertyName.points
    >
  >;

export type BaseShapeProperties = Required<
  Pick<
    FormProperties,
    | FormPropertyName.id
    | FormPropertyName.style
    | FormPropertyName.originX
    | FormPropertyName.originY
    | FormPropertyName.originalWidth
    | FormPropertyName.originalHeight
    | FormPropertyName.edited
    | FormPropertyName.selected
  >
> &
  Partial<
    Pick<
      FormProperties,
      | FormPropertyName.width
      | FormPropertyName.height
      | FormPropertyName.scaleX
      | FormPropertyName.scaleY
      | FormPropertyName.minWidth
      | FormPropertyName.minHeight
      | FormPropertyName.horizontallyInvertable
      | FormPropertyName.verticallyInvertable
      | FormPropertyName.horizontalInverted
      | FormPropertyName.verticallyInverted
    >
  >;

export type ChangableShapeProperties = Partial<
  Pick<
    ShapeProperties,
    | FormPropertyName.style
    | FormPropertyName.originX
    | FormPropertyName.originY
    | FormPropertyName.width
    | FormPropertyName.height
    | FormPropertyName.shapes
    | FormPropertyName.src
    | FormPropertyName.text
    | FormPropertyName.wrap
    | FormPropertyName.points
  >
>;

export type BaseSerializedShapeProperties = Required<
  Pick<
    ShapeProperties,
    | FormPropertyName.id
    | FormPropertyName.style
    | FormPropertyName.originX
    | FormPropertyName.originY
    | FormPropertyName.originalWidth
    | FormPropertyName.originalHeight
    | FormPropertyName.width
    | FormPropertyName.height
    | FormPropertyName.minWidth
    | FormPropertyName.minHeight
    | FormPropertyName.horizontallyInvertable
    | FormPropertyName.verticallyInvertable
    | FormPropertyName.edited
  >
>;

export type SerializedShapeProperties = BaseSerializedShapeProperties & {
  [FormPropertyName.shapes]?: SerializedShape[];
} & Partial<
    Pick<
      ShapeProperties,
      | FormPropertyName.src
      | FormPropertyName.text
      | FormPropertyName.wrap
      | FormPropertyName.points
    >
  >;

export type RelocateSerializedShapeProperties = Required<
  Pick<
    SerializedShapeProperties,
    | FormPropertyName.id
    | FormPropertyName.originX
    | FormPropertyName.originY
    | FormPropertyName.width
    | FormPropertyName.height
  >
>;

export type ChangableBaseSerializedShapeProperties = Partial<
  Pick<
    SerializedShapeProperties,
    | FormPropertyName.style
    | FormPropertyName.originX
    | FormPropertyName.originY
    | FormPropertyName.width
    | FormPropertyName.height
    | FormPropertyName.minWidth
    | FormPropertyName.edited
  >
>;

export interface ChangableSerializedShape {
  [FormPropertyName.id]: string;
  properties: ChangableSerializedShapeProperties;
}

export type ChangableSerializedShapeProperties =
  ChangableBaseSerializedShapeProperties &
    Partial<
      Pick<
        SerializedShapeProperties,
        FormPropertyName.src | FormPropertyName.wrap
      >
    > & {
      [FormPropertyName.text]?: {
        startIndex: number;
        endIndex: number;
        text: string;
      };
      [FormPropertyName.shapes]?: ChangableSerializedShape[];
    };
