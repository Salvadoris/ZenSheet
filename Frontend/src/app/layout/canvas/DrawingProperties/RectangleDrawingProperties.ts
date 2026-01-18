import { RectangleStyle } from '../ShapeStyles/RectangleStyle';

import { BaseDrawingProperties, DrawingProperties } from './DrawingProperties';
import { DrawingPropertyName } from './DrawingPropertyName';

export type RectangleDrawingProperties = Omit<
  BaseDrawingProperties,
  DrawingPropertyName.style
> & { [DrawingPropertyName.style]: RectangleStyle } & Required<
    Pick<DrawingProperties, DrawingPropertyName.p0 | DrawingPropertyName.p1>
  >;
