import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { EllipseStyle } from '../ShapeStyles/EllipseStyle';

import {
  ChangableDrawingProperties,
  NonLineDrawingProperties,
} from './DrawingProperties';

export type EllipseDrawingProperties = Omit<
  NonLineDrawingProperties,
  FormPropertyName.style
> & { [FormPropertyName.style]: EllipseStyle };

export type ChangableEllipseDrawingProperties = Partial<
  Pick<
    ChangableDrawingProperties,
    FormPropertyName.width | FormPropertyName.height
  >
>;
