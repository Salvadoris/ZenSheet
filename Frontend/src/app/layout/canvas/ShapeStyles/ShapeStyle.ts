import { StyleName } from './StyleName';

export interface NullableShapeStyle {
  [StyleName.Color]?: string | null;
  [StyleName.LineWidth]?: number | null;
  [StyleName.LineCap]?: CanvasLineCap | null;
  [StyleName.Opacity]?: number | null;
}

export interface ShapeStyle extends NullableShapeStyle {
  [StyleName.Color]?: string;
  [StyleName.LineWidth]?: number;
  [StyleName.LineCap]?: CanvasLineCap;
  [StyleName.Opacity]?: number;

  updateProperty(styleProperty: ShapeStyleProperty): void;
}

export type ShapeStyleProperty =
  | { name: StyleName.Color; value: string }
  | { name: StyleName.LineWidth; value: number }
  | { name: StyleName.LineCap; value: CanvasLineCap }
  | { name: StyleName.Opacity; value: number };
