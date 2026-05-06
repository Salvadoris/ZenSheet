import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { EllipseStyle } from '../ShapeStyles/EllipseStyle';

import {
  BaseDrawingProperties,
  ChangableDrawingProperties,
} from './DrawingProperties';

export type EllipseDrawingProperties = Omit<
  BaseDrawingProperties,
  FormPropertyName.style
> & { [FormPropertyName.style]: EllipseStyle };

export type ChangableEllipseDrawingProperties = Partial<
  Pick<
    ChangableDrawingProperties,
    FormPropertyName.width | FormPropertyName.height
  >
>;
