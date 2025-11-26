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

  changeStyleColor(color: string) {
    if (this.style[StyleName.Color] !== undefined) {
      this.style[StyleName.Color] = color;
      this.#cdr.markForCheck();
      this.stylePropertyChange.emit({
        name: StyleName.Color,
        value: color,
      });
    }
  }

  changeStyleLineWidth(lineWidth: number) {
    if (this.style[StyleName.LineWidth] !== undefined) {
      this.style[StyleName.LineWidth] = lineWidth;
      this.#cdr.markForCheck();
      this.stylePropertyChange.emit({
        name: StyleName.LineWidth,
        value: lineWidth,
      });
    }
  }

  changeStyleLineCap(lineCap: CanvasLineCap) {
    if (this.style[StyleName.LineCap] !== undefined) {
      this.style[StyleName.LineCap] = lineCap;
      this.#cdr.markForCheck();
      this.stylePropertyChange.emit({
        name: StyleName.LineCap,
        value: lineCap,
      });
    }
  }

  changeStyleOpacity(opacity: number) {
    if (this.style[StyleName.Opacity] !== undefined) {
      this.style[StyleName.Opacity] = opacity;
      this.#cdr.markForCheck();
      this.stylePropertyChange.emit({
        name: StyleName.Opacity,
        value: opacity,
      });
    }
  }
}
