import { StrokedRectStyle } from '../ShapeStyles/StrokedRectStyle';

import {
  BaseSerializedShapeProperties,
  BaseShapeProperties,
} from './ShapeProperties';
import { ShapePropertyName } from './ShapePropertyName';

export type StrokedRectShapeProperties = Omit<
  BaseShapeProperties,
  ShapePropertyName.style
> & {
  [ShapePropertyName.style]: StrokedRectStyle;
};

export type SerializedStrokedRectShapeProperties = Omit<
  BaseSerializedShapeProperties,
  ShapePropertyName.style
> & {
  [ShapePropertyName.style]: StrokedRectStyle;
};
