import { GroupShapeStyle } from '../ShapeStyles/GroupShapeStyle';

import { SerializedShapeProperties, ShapeProperties } from './ShapeProperties';
import { ShapePropertyName } from './ShapePropertyName';

export type GroupShapeProperties = Partial<
  Omit<
    ShapeProperties,
    ShapePropertyName.id | ShapePropertyName.shapes | ShapePropertyName.style
  >
> & {
  [ShapePropertyName.style]?: GroupShapeStyle;
} & Required<
    Pick<
      ShapeProperties,
      | ShapePropertyName.id
      | ShapePropertyName.shapes
      | ShapePropertyName.edited
      | ShapePropertyName.selected
    >
  >;

export type SerializedGroupShapeProperties = Omit<
  SerializedShapeProperties,
  ShapePropertyName.shapes | ShapePropertyName.style
> & {
  [ShapePropertyName.style]: GroupShapeStyle;
} & Required<
    Pick<
      SerializedShapeProperties,
      ShapePropertyName.shapes | ShapePropertyName.edited
    >
  >;
