import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { StraightLineStyle } from '../ShapeStyles/StraightLineStyle';

import {
  BaseDrawingProperties,
  ChangableDrawingProperties,
} from './DrawingProperties';

export type StraightLineDrawingProperties = Omit<
  BaseDrawingProperties,
  FormPropertyName.style
> & { [FormPropertyName.style]: StraightLineStyle };

export type ChangableStraightLineDrawingProperties = Partial<
  Pick<
    ChangableDrawingProperties,
    FormPropertyName.width | FormPropertyName.height
  >
>;
