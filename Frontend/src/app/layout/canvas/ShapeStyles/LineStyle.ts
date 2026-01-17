import { ShapeStyle, ShapeStyleProperty } from './ShapeStyle';
import { StyleName } from './StyleName';

export type LineStyleType = Required<
  Pick<
    ShapeStyle,
    | StyleName.Color
    | StyleName.LineWidth
    | StyleName.LineCap
    | StyleName.Opacity
  >
>;

export class LineStyle implements LineStyleType {
  [StyleName.Color]: string;
  [StyleName.LineWidth]: number;
  [StyleName.LineCap]: CanvasLineCap;
  [StyleName.Opacity]: number;

  constructor(style: LineStyleType) {
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
