import { ImageStyle, ImageStyleType } from '../ShapeStyles/ImageStyle';

import {
  BaseSerializedShapeProperties,
  BaseShapeProperties,
  SerializedShapeProperties,
  ShapeProperties,
} from './ShapeProperties';
import { ShapePropertyName } from './ShapePropertyName';

export type ImageShapeProperties = Omit<
  BaseShapeProperties,
  ShapePropertyName.style
> & {
  [ShapePropertyName.style]: ImageStyle;
} & Required<Pick<ShapeProperties, ShapePropertyName.src>>;

export type SerializedImageShapeProperties = Omit<
  BaseSerializedShapeProperties,
  ShapePropertyName.style
> & {
  [ShapePropertyName.style]: ImageStyleType;
} & Required<Pick<SerializedShapeProperties, ShapePropertyName.src>>;
