import { ShapeStyle, ShapeStyleProperty } from './ShapeStyle';
import { StyleName } from './StyleName';

export type ImageStyleType = Required<Pick<ShapeStyle, StyleName.Opacity>>;

export class ImageStyle implements ImageStyleType {
  [StyleName.Opacity]: number;

  constructor(style: ImageStyleType) {
    this[StyleName.Opacity] = style[StyleName.Opacity];
  }

  updateProperty(styleProperty: ShapeStyleProperty): boolean {
    switch (styleProperty.name) {
      case StyleName.Opacity:
        this[StyleName.Opacity] = styleProperty.value;
        return true;
    }
    return false;
  }
}
