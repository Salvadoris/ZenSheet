import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { LineStyle } from '../ShapeStyles/LineStyle';

import {
  BaseDrawingProperties,
  ChangableDrawingProperties,
  DrawingProperties,
} from './DrawingProperties';

export type LineDrawingProperties = Omit<
  BaseDrawingProperties,
  FormPropertyName.style
> & { [FormPropertyName.style]: LineStyle } & Required<
    Pick<DrawingProperties, FormPropertyName.points>
  >;

export type ChangableLineDrawingProperties = Required<
  Pick<ChangableDrawingProperties, FormPropertyName.points>
> &
  Partial<
    Pick<
      ChangableDrawingProperties,
      | FormPropertyName.originX
      | FormPropertyName.originY
      | FormPropertyName.width
      | FormPropertyName.height
    >
  >;
