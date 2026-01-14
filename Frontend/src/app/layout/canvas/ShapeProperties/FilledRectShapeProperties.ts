import {
  FilledRectStyle,
  FilledRectStyleType,
} from '../ShapeStyles/FilledRectStyle';

import {
  BaseSerializedShapeProperties,
  BaseShapeProperties,
} from './ShapeProperties';
import { ShapePropertyName } from './ShapePropertyName';

export type FilledRectShapeProperties = Omit<
  BaseShapeProperties,
  ShapePropertyName.style
> & {
  [ShapePropertyName.style]: FilledRectStyle;
};

export type SerializedFilledRectShapeProperties = Omit<
  BaseSerializedShapeProperties,
  ShapePropertyName.style
> & {
  [ShapePropertyName.style]: FilledRectStyleType;
};
