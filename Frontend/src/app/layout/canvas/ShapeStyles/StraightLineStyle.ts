import { ShapeStyle, ShapeStyleProperty } from './ShapeStyle';
import { StyleName } from './StyleName';

export type StraightLineStyleType = Required<
  Pick<
    ShapeStyle,
    | StyleName.Color
    | StyleName.LineWidth
    | StyleName.LineCap
    | StyleName.Opacity
  >
>;

export class StraightLineStyle implements StraightLineStyleType {
  [StyleName.Color]: string;
  [StyleName.LineWidth]: number;
  [StyleName.LineCap]: CanvasLineCap;
  [StyleName.Opacity]: number;

  constructor(style: StraightLineStyleType) {
    this[StyleName.Color] = style[StyleName.Color];
    this[StyleName.LineWidth] = style[StyleName.LineWidth];
    this[StyleName.LineCap] = style[StyleName.LineCap];
    this[StyleName.Opacity] = style[StyleName.Opacity];
  }

  updateProperty(styleProperty: ShapeStyleProperty): boolean {
    switch (styleProperty.name) {
      case StyleName.Color:
        this[StyleName.Color] = styleProperty.value;
        return true;
      case StyleName.LineWidth:
        this[StyleName.LineWidth] = styleProperty.value;
        return true;
      case StyleName.LineCap:
        this[StyleName.LineCap] = styleProperty.value;
        return true;
      case StyleName.Opacity:
        this[StyleName.Opacity] = styleProperty.value;
        return true;
    }
    return false;
  }
}
