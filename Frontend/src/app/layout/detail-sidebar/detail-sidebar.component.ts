import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  output,
} from '@angular/core';

import { LineAlignment } from '../canvas/ShapeStyles/LineAlignment';
import {
  NullableShapeStyle,
  ShapeStyleProperty,
} from '../canvas/ShapeStyles/ShapeStyle';
import { StyleName } from '../canvas/ShapeStyles/StyleName';

@Component({
  selector: 'app-detail-sidebar',
  imports: [NgClass],
  templateUrl: './detail-sidebar.component.html',
  styleUrl: './detail-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailSidebar {
  StyleName = StyleName;
  LineAlignment = LineAlignment;

  style: NullableShapeStyle = {};
  colors: string[] = ['#000000', '#ff0000', '#00ff00', '#0000ff'];
  lineWidths: number[] = [4, 10, 20];
  lineCaps: CanvasLineCap[] = ['round', 'square'];
  lineAlignments: LineAlignment[] = [
    LineAlignment.Left,
    LineAlignment.Center,
    LineAlignment.Right,
  ];
  fontSizes: number[] = [20, 40, 80, 120];
  fontNames: string[] = [
    'Arial',
    'Times New Roman',
    'Georgia',
    'Garamond',
    'Courier New',
    'Brush Script MT',
  ];
  lineSpaces: number[] = [1, 1.25, 1.5, 1.75, 2, 2.5, 3];

  #cdr = inject(ChangeDetectorRef);

  stylePropertyChange = output<ShapeStyleProperty>();

  visible = false;

  setStyle(style: NullableShapeStyle | null) {
    if (style) {
      this.style = style;
      this.visible = true;
    } else {
      this.visible = false;
    }
    this.#cdr.markForCheck();
  }

  changeStyle(styleProperty: ShapeStyleProperty) {
    switch (styleProperty.name) {
      case StyleName.Color:
        this.style[StyleName.Color] = styleProperty.value;
        break;
      case StyleName.LineWidth:
        this.style[StyleName.LineWidth] = styleProperty.value;
        break;
      case StyleName.LineCap:
        this.style[StyleName.LineCap] = styleProperty.value;
        break;
      case StyleName.Opacity:
        this.style[StyleName.Opacity] = styleProperty.value;
        break;
      case StyleName.FontSize:
        this.style[StyleName.FontSize] = styleProperty.value;
        break;
      case StyleName.FontLineSpace:
        this.style[StyleName.FontLineSpace] = styleProperty.value;
        break;
      case StyleName.FontName:
        this.style[StyleName.FontName] = styleProperty.value;
        break;
      case StyleName.FontBold:
        this.style[StyleName.FontBold] = styleProperty.value;
        break;
      case StyleName.FontItalic:
        this.style[StyleName.FontItalic] = styleProperty.value;
        break;
      case StyleName.FontAlignment:
        this.style[StyleName.FontAlignment] = styleProperty.value;
        break;
    }
    this.#cdr.markForCheck();
    this.stylePropertyChange.emit(styleProperty);
  }
}
