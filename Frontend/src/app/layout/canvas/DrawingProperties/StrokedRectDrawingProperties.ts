import { StrokedRectStyle } from '../ShapeStyles/StrokedRectStyle';

import { BaseDrawingProperties, DrawingProperties } from './DrawingProperties';
import { DrawingPropertyName } from './DrawingPropertyName';

export type StrokedRectDrawingProperties = Omit<
  BaseDrawingProperties,
  DrawingPropertyName.style
> & { [DrawingPropertyName.style]: StrokedRectStyle } & Required<
    Pick<DrawingProperties, DrawingPropertyName.p0 | DrawingPropertyName.p1>
  >;
