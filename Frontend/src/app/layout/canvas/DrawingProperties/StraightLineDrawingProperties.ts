import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { StraightLineStyle } from '../ShapeStyles/StraightLineStyle';

import {
  ChangableDrawingProperties,
  NonLineDrawingProperties,
} from './DrawingProperties';

export type StraightLineDrawingProperties = Omit<
  NonLineDrawingProperties,
  FormPropertyName.style
> & { [FormPropertyName.style]: StraightLineStyle };

export type ChangableStraightLineDrawingProperties = Partial<
  Pick<
    ChangableDrawingProperties,
    FormPropertyName.width | FormPropertyName.height
  >
>;
