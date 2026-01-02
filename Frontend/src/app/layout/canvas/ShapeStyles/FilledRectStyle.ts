import { ShapeStyle, ShapeStyleProperty } from './ShapeStyle';
import { StyleName } from './StyleName';

type FilledRectStyleType = Required<
  Pick<ShapeStyle, StyleName.Color | StyleName.Opacity>
>;

export class FilledRectStyle implements FilledRectStyleType {
  [StyleName.Color]: string;
  [StyleName.Opacity]: number;

  constructor(style: FilledRectStyleType) {
    this[StyleName.Color] = style[StyleName.Color];
    this[StyleName.Opacity] = style[StyleName.Opacity];
  }

  updateProperty(styleProperty: ShapeStyleProperty) {
    switch (styleProperty.name) {
      case StyleName.Color:
        this[StyleName.Color] = styleProperty.value;
        break;
      case StyleName.Opacity:
        this[StyleName.Opacity] = styleProperty.value;
        break;
    }
  }
}
