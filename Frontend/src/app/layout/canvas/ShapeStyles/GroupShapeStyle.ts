import { LineAlignment } from './LineAlignment';
import { NullableShapeStyle, ShapeStyleProperty } from './ShapeStyle';
import { StyleName } from './StyleName';

export type GroupShapeStyleType = NullableShapeStyle;

export class GroupShapeStyle implements NullableShapeStyle {
  [StyleName.Color]?: string | null;
  [StyleName.BackgroundColor]?: string | null;
  [StyleName.LineWidth]?: number | null;
  [StyleName.LineCap]?: CanvasLineCap | null;
  [StyleName.Opacity]?: number | null;
  [StyleName.FontSize]?: number | null;
  [StyleName.FontLineSpace]?: number | null;
  [StyleName.FontName]?: string | null;
  [StyleName.FontBold]?: boolean | null;
  [StyleName.FontItalic]?: boolean | null;
  [StyleName.FontAlignment]?: LineAlignment | null;

  constructor(styles: NullableShapeStyle[]) {
    this[StyleName.Color] = this.checkStyleProperty<string>(
      StyleName.Color,
      styles
    );
    this[StyleName.BackgroundColor] = this.checkStyleProperty<string>(
      StyleName.BackgroundColor,
      styles
    );
    this[StyleName.LineWidth] = this.checkStyleProperty<number>(
      StyleName.LineWidth,
      styles
    );
    this[StyleName.LineCap] = this.checkStyleProperty<CanvasLineCap>(
      StyleName.LineCap,
      styles
    );
    this[StyleName.Opacity] = this.checkStyleProperty<number>(
      StyleName.Opacity,
      styles
    );
    this[StyleName.FontSize] = this.checkStyleProperty<number>(
      StyleName.FontSize,
      styles
    );
    this[StyleName.FontLineSpace] = this.checkStyleProperty<number>(
      StyleName.FontLineSpace,
      styles
    );
    this[StyleName.FontName] = this.checkStyleProperty<string>(
      StyleName.FontName,
      styles
    );
    this[StyleName.FontBold] = this.checkStyleProperty<boolean>(
      StyleName.FontBold,
      styles
    );
    this[StyleName.FontItalic] = this.checkStyleProperty<boolean>(
      StyleName.FontItalic,
      styles
    );
    this[StyleName.FontAlignment] = this.checkStyleProperty<LineAlignment>(
      StyleName.FontAlignment,
      styles
    );
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
      case StyleName.LineCap:
        this[StyleName.LineCap] = styleProperty.value;
        return true;
      case StyleName.Opacity:
        this[StyleName.Opacity] = styleProperty.value;
        return true;
      case StyleName.FontSize:
        this[StyleName.FontSize] = styleProperty.value;
        return true;
      case StyleName.FontLineSpace:
        this[StyleName.FontLineSpace] = styleProperty.value;
        return true;
      case StyleName.FontName:
        this[StyleName.FontName] = styleProperty.value;
        return true;
      case StyleName.FontBold:
        this[StyleName.FontBold] = styleProperty.value;
        return true;
      case StyleName.FontItalic:
        this[StyleName.FontItalic] = styleProperty.value;
        return true;
      case StyleName.FontAlignment:
        this[StyleName.FontAlignment] = styleProperty.value;
        return true;
    }
    return false;
  }

  private checkStyleProperty<T>(
    name: StyleName,
    styles: NullableShapeStyle[]
  ): T | undefined | null {
    const values = styles.map(s => s[name] as T | undefined | null);
    if (values.includes(null)) {
      return null;
    } else {
      const trueValues = values.filter(c => c !== undefined);
      if (trueValues.length > 0) {
        if (trueValues.every(v => v === trueValues[0])) {
          return trueValues[0];
        } else {
          return null;
        }
      }
    }
    return undefined;
  }
}
