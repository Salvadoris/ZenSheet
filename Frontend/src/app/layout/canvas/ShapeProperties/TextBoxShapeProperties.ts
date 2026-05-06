import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { TextBoxStyle, TextBoxStyleType } from '../ShapeStyles/TextBoxStyle';

import {
  BaseSerializedShapeProperties,
  SerializedShapeProperties,
  ShapeProperties,
} from './ShapeProperties';

export interface TextIndex {
  line: number;
  char: number;
}

export interface TextLine {
  text: string;
  tabWidths: number[];
  maxChunkWidth: number;
  originalLineIndex: number;
}

export const tabSize = 2;

export type TextBoxShapeProperties = Partial<
  Omit<
    ShapeProperties,
    | FormPropertyName.id
    | FormPropertyName.style
    | FormPropertyName.text
    | FormPropertyName.wrap
    | FormPropertyName.originX
    | FormPropertyName.originY
  >
> & {
  [FormPropertyName.style]: TextBoxStyle;
} & Required<
    Pick<
      ShapeProperties,
      | FormPropertyName.id
      | FormPropertyName.text
      | FormPropertyName.wrap
      | FormPropertyName.originX
      | FormPropertyName.originY
      | FormPropertyName.edited
      | FormPropertyName.selected
    >
  >;

export type SerializedTextBoxShapeProperties = Omit<
  BaseSerializedShapeProperties,
  FormPropertyName.style
> & {
  [FormPropertyName.style]: TextBoxStyleType;
} & Required<
    Pick<
      SerializedShapeProperties,
      FormPropertyName.text | FormPropertyName.wrap | FormPropertyName.edited
    >
  >;
