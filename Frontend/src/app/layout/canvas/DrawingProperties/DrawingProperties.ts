import { Point } from '../Geometry';
import { LinePoints } from '../ShapeProperties/LineShapeProperties';
import { ShapeStyle } from '../ShapeStyles/ShapeStyle';

import { DrawingPropertyName } from './DrawingPropertyName';

export interface DrawingProperties {
  [DrawingPropertyName.id]: string;
  [DrawingPropertyName.style]: ShapeStyle;
  [DrawingPropertyName.p0]?: Point;
  [DrawingPropertyName.p1]?: Point;
  [DrawingPropertyName.points]?: LinePoints;
}

export type BaseDrawingProperties = Required<
  Pick<DrawingProperties, DrawingPropertyName.id | DrawingPropertyName.style>
>;

export type ChangableDrawingProperties = Partial<
  Pick<DrawingProperties, DrawingPropertyName.p1>
> & { [DrawingPropertyName.points]?: { lastPoint: Point } };
