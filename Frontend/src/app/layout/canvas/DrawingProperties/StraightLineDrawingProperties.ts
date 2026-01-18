import { StraightLineStyle } from '../ShapeStyles/StraightLineStyle';

import { BaseDrawingProperties, DrawingProperties } from './DrawingProperties';
import { DrawingPropertyName } from './DrawingPropertyName';

export type StraightLineDrawingProperties = Omit<
  BaseDrawingProperties,
  DrawingPropertyName.style
> & { [DrawingPropertyName.style]: StraightLineStyle } & Required<
    Pick<DrawingProperties, DrawingPropertyName.p0 | DrawingPropertyName.p1>
  >;
