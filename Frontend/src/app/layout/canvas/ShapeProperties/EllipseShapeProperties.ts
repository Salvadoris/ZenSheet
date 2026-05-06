import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { EllipseStyle, EllipseStyleType } from '../ShapeStyles/EllipseStyle';

import {
  BaseSerializedShapeProperties,
  BaseShapeProperties,
} from './ShapeProperties';

export type EllipseShapeProperties = Omit<
  BaseShapeProperties,
  FormPropertyName.style
> & {
  [FormPropertyName.style]: EllipseStyle;
};

export type SerializedEllipseShapeProperties = Omit<
  BaseSerializedShapeProperties,
  FormPropertyName.style
> & {
  [FormPropertyName.style]: EllipseStyleType;
};
