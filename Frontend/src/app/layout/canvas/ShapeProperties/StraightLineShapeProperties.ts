import { FormPropertyName } from '../FormProperties/FormPropertyName';
import {
  StraightLineStyle,
  StraightLineStyleType,
} from '../ShapeStyles/StraightLineStyle';

import {
  BaseSerializedShapeProperties,
  BaseShapeProperties,
} from './ShapeProperties';

export type StraightLineShapeProperties = Omit<
  BaseShapeProperties,
  FormPropertyName.style
> & {
  [FormPropertyName.style]: StraightLineStyle;
};

export type SerializedStraightLineShapeProperties = Omit<
  BaseSerializedShapeProperties,
  FormPropertyName.style
> & {
  [FormPropertyName.style]: StraightLineStyleType;
};
