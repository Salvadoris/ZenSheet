import {
  RectangleStyle,
  RectangleStyleType,
} from '../ShapeStyles/RectangleStyle';

import {
  BaseSerializedShapeProperties,
  BaseShapeProperties,
} from './ShapeProperties';
import { ShapePropertyName } from './ShapePropertyName';

export type RectangleShapeProperties = Omit<
  BaseShapeProperties,
  ShapePropertyName.style
> & {
  [ShapePropertyName.style]: RectangleStyle;
};

export type SerializedRectangleShapeProperties = Omit<
  BaseSerializedShapeProperties,
  ShapePropertyName.style
> & {
  [ShapePropertyName.style]: RectangleStyleType;
};
