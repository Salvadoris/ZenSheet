import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { RectangleStyle } from '../ShapeStyles/RectangleStyle';

import {
  BaseDrawingProperties,
  ChangableDrawingProperties,
} from './DrawingProperties';

export type RectangleDrawingProperties = Omit<
  BaseDrawingProperties,
  FormPropertyName.style
> & { [FormPropertyName.style]: RectangleStyle };

export type ChangableRectangleDrawingProperties = Partial<
  Pick<
    ChangableDrawingProperties,
    FormPropertyName.width | FormPropertyName.height
  >
>;
