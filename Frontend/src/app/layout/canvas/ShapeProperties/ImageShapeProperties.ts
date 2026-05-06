import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { ImageStyle, ImageStyleType } from '../ShapeStyles/ImageStyle';

import {
  BaseSerializedShapeProperties,
  BaseShapeProperties,
  SerializedShapeProperties,
  ShapeProperties,
} from './ShapeProperties';

export type ImageShapeProperties = Omit<
  BaseShapeProperties,
  FormPropertyName.style
> & {
  [FormPropertyName.style]: ImageStyle;
} & Required<Pick<ShapeProperties, FormPropertyName.src>>;

export type SerializedImageShapeProperties = Omit<
  BaseSerializedShapeProperties,
  FormPropertyName.style
> & {
  [FormPropertyName.style]: ImageStyleType;
} & Required<Pick<SerializedShapeProperties, FormPropertyName.src>>;
