import { LinePoints } from '../ShapeProperties/LineShapeProperties';
import { Shape } from '../Shapes/Shape';
import { NullableShapeStyle } from '../ShapeStyles/ShapeStyle';

import { FormPropertyName } from './FormPropertyName';

export interface FormProperties {
  [FormPropertyName.id]: string;
  [FormPropertyName.style]: NullableShapeStyle;
  [FormPropertyName.originX]: number;
  [FormPropertyName.originY]: number;
  [FormPropertyName.width]: number;
  [FormPropertyName.height]: number;
  [FormPropertyName.originalWidth]?: number;
  [FormPropertyName.originalHeight]?: number;
  [FormPropertyName.scaleX]?: number;
  [FormPropertyName.scaleY]?: number;
  [FormPropertyName.minWidth]?: number;
  [FormPropertyName.minHeight]?: number;
  [FormPropertyName.horizontallyInvertable]?: boolean;
  [FormPropertyName.verticallyInvertable]?: boolean;
  [FormPropertyName.horizontalInverted]?: boolean;
  [FormPropertyName.verticallyInverted]?: boolean;
  [FormPropertyName.edited]?: boolean;
  [FormPropertyName.selected]?: boolean;
  [FormPropertyName.shapes]?: Shape[];
  [FormPropertyName.src]?: string;
  [FormPropertyName.text]?: string;
  [FormPropertyName.wrap]?: boolean;
  [FormPropertyName.points]?: LinePoints;
}
