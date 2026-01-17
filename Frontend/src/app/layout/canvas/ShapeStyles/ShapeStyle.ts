import { LineAlignment } from './LineAlignment';
import { StyleName } from './StyleName';

export interface NullableShapeStyle {
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
}

export interface ShapeStyle extends NullableShapeStyle {
  [StyleName.Color]?: string;
  [StyleName.BackgroundColor]?: string;
  [StyleName.LineWidth]?: number;
  [StyleName.LineCap]?: CanvasLineCap;
  [StyleName.Opacity]?: number;
  [StyleName.FontSize]?: number;
  [StyleName.FontLineSpace]?: number;
  [StyleName.FontName]?: string;
  [StyleName.FontBold]?: boolean;
  [StyleName.FontItalic]?: boolean;
  [StyleName.FontAlignment]?: LineAlignment;
}

export type ShapeStyleProperty =
  | { name: StyleName.Color; value: string }
  | { name: StyleName.BackgroundColor; value: string }
  | { name: StyleName.LineWidth; value: number }
  | { name: StyleName.LineCap; value: CanvasLineCap }
  | { name: StyleName.Opacity; value: number }
  | { name: StyleName.FontSize; value: number }
  | { name: StyleName.FontLineSpace; value: number }
  | { name: StyleName.FontName; value: string }
  | { name: StyleName.FontBold; value: boolean }
  | { name: StyleName.FontItalic; value: boolean }
  | { name: StyleName.FontAlignment; value: LineAlignment };
