import { EllipseStyle } from '../ShapeStyles/EllipseStyle';

import { BaseDrawingProperties, DrawingProperties } from './DrawingProperties';
import { DrawingPropertyName } from './DrawingPropertyName';

export type EllipseDrawingProperties = Omit<
  BaseDrawingProperties,
  DrawingPropertyName.style
> & { [DrawingPropertyName.style]: EllipseStyle } & Required<
    Pick<DrawingProperties, DrawingPropertyName.p0 | DrawingPropertyName.p1>
  >;
