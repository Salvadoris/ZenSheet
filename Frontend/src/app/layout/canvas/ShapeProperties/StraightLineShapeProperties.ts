import {
  StraightLineStyle,
  StraightLineStyleType,
} from '../ShapeStyles/StraightLineStyle';

import {
  BaseSerializedShapeProperties,
  BaseShapeProperties,
} from './ShapeProperties';
import { ShapePropertyName } from './ShapePropertyName';

export type StraightLineShapeProperties = Omit<
  BaseShapeProperties,
  ShapePropertyName.style
> & {
  [ShapePropertyName.style]: StraightLineStyle;
};

export type SerializedStraightLineShapeProperties = Omit<
  BaseSerializedShapeProperties,
  ShapePropertyName.style
> & {
  [ShapePropertyName.style]: StraightLineStyleType;
};
