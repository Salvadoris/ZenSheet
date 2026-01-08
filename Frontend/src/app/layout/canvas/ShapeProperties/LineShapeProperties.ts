import { Point, Rect } from '../Geometry';
import { LineStyle } from '../ShapeStyles/LineStyle';

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
      SerializedShapeProperties,
      ShapePropertyName.id | ShapePropertyName.points
    >
  >;

export type SerializedLineShapeProperties = Omit<
  BaseSerializedShapeProperties,
  ShapePropertyName.style
> & {
  [ShapePropertyName.style]: LineStyle;
} & Required<Pick<SerializedShapeProperties, ShapePropertyName.points>>;
