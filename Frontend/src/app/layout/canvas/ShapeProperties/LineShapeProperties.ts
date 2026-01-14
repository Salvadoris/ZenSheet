import { Point, Rect } from '../Geometry';
import { LineStyle, LineStyleType } from '../ShapeStyles/LineStyle';

import {
  BaseSerializedShapeProperties,
  SerializedShapeProperties,
  ShapeProperties,
} from './ShapeProperties';
import { ShapePropertyName } from './ShapePropertyName';

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

export type LineShapeProperties = Partial<
  Omit<
    ShapeProperties,
    ShapePropertyName.id | ShapePropertyName.style | ShapePropertyName.points
  >
> & { [ShapePropertyName.style]: LineStyle } & Required<
    Pick<
      ShapeProperties,
      | ShapePropertyName.id
      | ShapePropertyName.points
      | ShapePropertyName.edited
      | ShapePropertyName.selected
    >
  >;

export type SerializedLineShapeProperties = Omit<
  BaseSerializedShapeProperties,
  ShapePropertyName.style
> & {
  [ShapePropertyName.style]: LineStyleType;
} & Required<
    Pick<
      SerializedShapeProperties,
      ShapePropertyName.points | ShapePropertyName.edited
    >
  >;
