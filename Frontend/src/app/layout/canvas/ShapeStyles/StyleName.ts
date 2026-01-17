export enum StyleName {
  Color = 'Color',
  BackgroundColor = 'BackgroundColor',
  LineWidth = 'LineWidth',
  LineCap = 'LineCap',
  Opacity = 'Opacity',
  FontSize = 'FontSize',
  FontLineSpace = 'FontLineSpace',
  FontName = 'FontName',
  FontBold = 'FontBold',
  FontItalic = 'FontItalic',
  FontAlignment = 'FontAlignment',
}

export type FontStyleName =
  | StyleName.FontSize
  | StyleName.FontLineSpace
  | StyleName.FontName
  | StyleName.FontBold
  | StyleName.FontItalic
  | StyleName.FontAlignment;
