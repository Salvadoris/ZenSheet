import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { Point, Rect } from '../Geometry';
import { LineStyle, LineStyleType } from '../ShapeStyles/LineStyle';

import {
  BaseSerializedShapeProperties,
  BaseShapeProperties,
  SerializedShapeProperties,
  ShapeProperties,
} from './ShapeProperties';

export type LinePoints =
  | [Point, Point, ...Point[]]
  | [Point, ...Point[], Point]
  | [...Point[], Point, Point];

export interface Chunk {
  rect: Rect;
  visible: boolean;
}

export interface Segment {
  points: Point[];
  chunkIndex: number;
}

export type LineShapeProperties = Omit<
  BaseShapeProperties,
  FormPropertyName.style
> & { [FormPropertyName.style]: LineStyle } & Required<
    Pick<ShapeProperties, FormPropertyName.points>
  >;

export type SerializedLineShapeProperties = Omit<
  BaseSerializedShapeProperties,
  FormPropertyName.style
> & {
  [FormPropertyName.style]: LineStyleType;
} & Required<
    Pick<
      SerializedShapeProperties,
      FormPropertyName.points | FormPropertyName.edited
    >
  >;
