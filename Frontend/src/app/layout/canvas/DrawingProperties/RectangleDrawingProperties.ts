import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { RectangleStyle } from '../ShapeStyles/RectangleStyle';

import {
  ChangableDrawingProperties,
  NonLineDrawingProperties,
} from './DrawingProperties';

export type RectangleDrawingProperties = Omit<
  NonLineDrawingProperties,
  FormPropertyName.style
> & { [FormPropertyName.style]: RectangleStyle };

export type ChangableRectangleDrawingProperties = Partial<
  Pick<
    ChangableDrawingProperties,
    FormPropertyName.width | FormPropertyName.height
  >
>;
