import { FormProperties } from '../FormProperties/FormProperties';
import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { Point } from '../Geometry';

export type DrawingProperties = BaseDrawingProperties &
  Partial<Pick<FormProperties, FormPropertyName.points>>;

export type BaseDrawingProperties = Required<
  Pick<
    FormProperties,
    | FormPropertyName.id
    | FormPropertyName.style
    | FormPropertyName.originX
    | FormPropertyName.originY
    | FormPropertyName.width
    | FormPropertyName.height
  >
>;

export type ChangableDrawingProperties = Partial<
  Pick<
    DrawingProperties,
    | FormPropertyName.originX
    | FormPropertyName.originY
    | FormPropertyName.width
    | FormPropertyName.height
  >
> & { [FormPropertyName.points]?: { lastPoint: Point } };

export type NonLineDrawingProperties = Required<
  Pick<
    DrawingProperties,
    | FormPropertyName.id
    | FormPropertyName.style
    | FormPropertyName.originX
    | FormPropertyName.originY
    | FormPropertyName.width
    | FormPropertyName.height
  >
>;
