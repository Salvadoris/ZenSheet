export enum StyleName {
  Color,
  LineWidth,
  LineCap,
  Opacity,
  FontSize,
  FontLineSpace,
  FontName,
  FontBold,
  FontItalic,
  FontAlignment,
}

export type FontStyleName =
  | StyleName.FontSize
  | StyleName.FontLineSpace
  | StyleName.FontName
  | StyleName.FontBold
  | StyleName.FontItalic
  | StyleName.FontAlignment;
