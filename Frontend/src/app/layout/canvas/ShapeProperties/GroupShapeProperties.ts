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
import { ShapePropertyName } from './ShapePropertyName';

export type GroupShapeProperties = Required<
  Pick<
    ShapeProperties,
    | ShapePropertyName.id
    | ShapePropertyName.shapes
    | ShapePropertyName.edited
    | ShapePropertyName.selected
  >
> & { [ShapePropertyName.style]?: GroupShapeStyle } & Partial<
    Omit<
      BaseShapeProperties,
      | ShapePropertyName.id
      | ShapePropertyName.style
      | ShapePropertyName.edited
      | ShapePropertyName.selected
    >
  >;

export type SerializedGroupShapeProperties = Omit<
  BaseSerializedShapeProperties,
  ShapePropertyName.style
> & { [ShapePropertyName.style]: GroupShapeStyleType } & Required<
    Pick<SerializedShapeProperties, ShapePropertyName.shapes>
  >;
