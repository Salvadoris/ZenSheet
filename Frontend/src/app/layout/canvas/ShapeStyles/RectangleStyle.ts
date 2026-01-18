import { ShapeStyle, ShapeStyleProperty } from './ShapeStyle';
import { StyleName } from './StyleName';

export type RectangleStyleType = Required<
  Pick<
    ShapeStyle,
    | StyleName.Color
    | StyleName.BackgroundColor
    | StyleName.LineWidth
    | StyleName.Opacity
  >
>;

export class RectangleStyle implements RectangleStyleType {
  [StyleName.Color]: string;
  [StyleName.BackgroundColor]: string;
  [StyleName.LineWidth]: number;
  [StyleName.Opacity]: number;

  constructor(style: RectangleStyleType) {
    this[StyleName.Color] = style[StyleName.Color];
    this[StyleName.BackgroundColor] = style[StyleName.BackgroundColor];
    this[StyleName.LineWidth] = style[StyleName.LineWidth];
    this[StyleName.Opacity] = style[StyleName.Opacity];
  }

  updateProperty(styleProperty: ShapeStyleProperty): boolean {
    switch (styleProperty.name) {
      case StyleName.Color:
        this[StyleName.Color] = styleProperty.value;
        return true;
      case StyleName.BackgroundColor:
        this[StyleName.BackgroundColor] = styleProperty.value;
        return true;
      case StyleName.LineWidth:
        this[StyleName.LineWidth] = styleProperty.value;
        return true;
      case StyleName.Opacity:
        this[StyleName.Opacity] = styleProperty.value;
        return true;
    }
    return false;
  }
}
