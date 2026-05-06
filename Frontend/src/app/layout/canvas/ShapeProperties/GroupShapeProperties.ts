import { FormPropertyName } from '../FormProperties/FormPropertyName';
import {
  GroupShapeStyle,
  GroupShapeStyleType,
} from '../ShapeStyles/GroupShapeStyle';

import {
  BaseSerializedShapeProperties,
  BaseShapeProperties,
  SerializedShapeProperties,
  ShapeProperties,
} from './ShapeProperties';

export type GroupShapeProperties = Required<
  Pick<
    ShapeProperties,
    | FormPropertyName.id
    | FormPropertyName.shapes
    | FormPropertyName.edited
    | FormPropertyName.selected
  >
> & { [FormPropertyName.style]?: GroupShapeStyle } & Partial<
    Omit<
      BaseShapeProperties,
      | FormPropertyName.id
      | FormPropertyName.style
      | FormPropertyName.edited
      | FormPropertyName.selected
    >
  >;

export type SerializedGroupShapeProperties = Omit<
  BaseSerializedShapeProperties,
  FormPropertyName.style
> & { [FormPropertyName.style]: GroupShapeStyleType } & Required<
    Pick<SerializedShapeProperties, FormPropertyName.shapes>
  >;
