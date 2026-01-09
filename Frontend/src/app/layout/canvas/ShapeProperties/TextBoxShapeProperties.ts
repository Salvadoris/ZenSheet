import { TextBoxStyle } from '../ShapeStyles/TextBoxStyle';

import {
  BaseSerializedShapeProperties,
  SerializedShapeProperties,
  ShapeProperties,
} from './ShapeProperties';
import { ShapePropertyName } from './ShapePropertyName';

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
    | ShapePropertyName.id
    | ShapePropertyName.style
    | ShapePropertyName.text
    | ShapePropertyName.wrap
    | ShapePropertyName.originX
    | ShapePropertyName.originY
  >
> & {
  [ShapePropertyName.style]: TextBoxStyle;
} & Required<
    Pick<
      ShapeProperties,
      | ShapePropertyName.id
      | ShapePropertyName.text
      | ShapePropertyName.wrap
      | ShapePropertyName.originX
      | ShapePropertyName.originY
      | ShapePropertyName.edited
      | ShapePropertyName.selected
    >
  >;

export type SerializedTextBoxShapeProperties = Omit<
  BaseSerializedShapeProperties,
  ShapePropertyName.style
> & {
  [ShapePropertyName.style]: TextBoxStyle;
} & Required<
    Pick<
      SerializedShapeProperties,
      ShapePropertyName.text | ShapePropertyName.wrap | ShapePropertyName.edited
    >
  >;
