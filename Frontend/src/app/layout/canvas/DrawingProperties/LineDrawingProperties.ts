import { LineStyle } from '../ShapeStyles/LineStyle';

import { BaseDrawingProperties, DrawingProperties } from './DrawingProperties';
import { DrawingPropertyName } from './DrawingPropertyName';

export type LineDrawingProperties = Omit<
  BaseDrawingProperties,
  DrawingPropertyName.style
> & { [DrawingPropertyName.style]: LineStyle } & Required<
    Pick<DrawingProperties, DrawingPropertyName.points>
  >;
