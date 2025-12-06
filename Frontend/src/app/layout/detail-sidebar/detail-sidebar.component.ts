import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  output,
} from '@angular/core';

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

  style: NullableShapeStyle = {};
  colors: string[] = ['#000000', '#ff0000', '#00ff00', '#0000ff'];
  lineWidths: number[] = [4, 10, 20];
  lineCaps: CanvasLineCap[] = ['round', 'square'];

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
    }
    this.#cdr.markForCheck();
    this.stylePropertyChange.emit(styleProperty);
  }
}
