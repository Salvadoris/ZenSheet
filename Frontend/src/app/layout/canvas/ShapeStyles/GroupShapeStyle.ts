import { NullableShapeStyle, ShapeStyleProperty } from './ShapeStyle';
import { StyleName } from './StyleName';

export class GroupShapeStyle implements NullableShapeStyle {
  [StyleName.Color]?: string | null;
  [StyleName.LineWidth]?: number | null;
  [StyleName.LineCap]?: CanvasLineCap | null;
  [StyleName.Opacity]?: number | null;

  constructor(styles: NullableShapeStyle[]) {
    this[StyleName.Color] = this.checkStyleProperty<string>(
      StyleName.Color,
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
  }

  updateProperty(styleProperty: ShapeStyleProperty) {
    switch (styleProperty.name) {
      case StyleName.Color:
        this[StyleName.Color] = styleProperty.value;
        break;
      case StyleName.LineWidth:
        this[StyleName.LineWidth] = styleProperty.value;
        break;
      case StyleName.LineCap:
        this[StyleName.LineCap] = styleProperty.value;
        break;
      case StyleName.Opacity:
        this[StyleName.Opacity] = styleProperty.value;
        break;
    }
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
