import { LineAlignment } from './LineAlignment';
import { ShapeStyle, ShapeStyleProperty } from './ShapeStyle';
import { FontStyleName, StyleName } from './StyleName';

type TextBoxStyleType = Required<
  Pick<ShapeStyle, StyleName.Color | StyleName.Opacity | FontStyleName>
>;

export class TextBoxStyle implements TextBoxStyleType {
  [StyleName.Color]: string;
  [StyleName.Opacity]: number;
  [StyleName.FontSize]: number;
  [StyleName.FontLineSpace]: number;
  [StyleName.FontName]: string;
  [StyleName.FontBold]: boolean;
  [StyleName.FontItalic]: boolean;
  [StyleName.FontAlignment]: LineAlignment;

  constructor(style: TextBoxStyleType) {
    this[StyleName.Color] = style[StyleName.Color];
    this[StyleName.Opacity] = style[StyleName.Opacity];
    this[StyleName.FontSize] = style[StyleName.FontSize];
    this[StyleName.FontLineSpace] = style[StyleName.FontLineSpace];
    this[StyleName.FontName] = style[StyleName.FontName];
    this[StyleName.FontBold] = style[StyleName.FontBold];
    this[StyleName.FontItalic] = style[StyleName.FontItalic];
    this[StyleName.FontAlignment] = style[StyleName.FontAlignment];
  }

  updateProperty(styleProperty: ShapeStyleProperty) {
    switch (styleProperty.name) {
      case StyleName.Color:
        this[StyleName.Color] = styleProperty.value;
        break;
      case StyleName.Opacity:
        this[StyleName.Opacity] = styleProperty.value;
        break;
      case StyleName.FontSize:
        this[StyleName.FontSize] = styleProperty.value;
        break;
      case StyleName.FontLineSpace:
        this[StyleName.FontLineSpace] = styleProperty.value;
        break;
      case StyleName.FontName:
        this[StyleName.FontName] = styleProperty.value;
        break;
      case StyleName.FontBold:
        this[StyleName.FontBold] = styleProperty.value;
        break;
      case StyleName.FontItalic:
        this[StyleName.FontItalic] = styleProperty.value;
        break;
      case StyleName.FontAlignment:
        this[StyleName.FontAlignment] = styleProperty.value;
        break;
    }
  }
}
