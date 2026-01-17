import { FilledRectStyle } from '../ShapeStyles/FilledRectStyle';

import { BaseDrawingProperties, DrawingProperties } from './DrawingProperties';
import { DrawingPropertyName } from './DrawingPropertyName';

export type FilledRectDrawingProperties = Omit<
  BaseDrawingProperties,
  DrawingPropertyName.style
> & { [DrawingPropertyName.style]: FilledRectStyle } & Required<
    Pick<DrawingProperties, DrawingPropertyName.p0 | DrawingPropertyName.p1>
  >;
