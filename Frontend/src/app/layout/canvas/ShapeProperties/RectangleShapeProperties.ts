import { FormPropertyName } from '../FormProperties/FormPropertyName';
import {
  RectangleStyle,
  RectangleStyleType,
} from '../ShapeStyles/RectangleStyle';

import {
  BaseSerializedShapeProperties,
  BaseShapeProperties,
} from './ShapeProperties';

export type RectangleShapeProperties = Omit<
  BaseShapeProperties,
  FormPropertyName.style
> & {
  [FormPropertyName.style]: RectangleStyle;
};

export type SerializedRectangleShapeProperties = Omit<
  BaseSerializedShapeProperties,
  FormPropertyName.style
> & {
  [FormPropertyName.style]: RectangleStyleType;
};
