import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

import {
  DropdownMenuComponent,
  DropdownMenuItem,
} from './dropdown-menu.component';

export interface ListItemData {
  id: string;
  name: string;
  color?: string;
  icon: string;
}

@Component({
  selector: 'app-list-item',
  imports: [CommonModule, DropdownMenuComponent],
  template: `
    <div class="flex justify-between items-center mb-1 gap-1">
      <button
        type="button"
        class="p-2 rounded cursor-pointer hover:bg-blue-200! flex-1 text-left focus:outline-none focus:ring-2 focus:ring-blue-400"
        [style.backgroundColor]="itemData().color"
        (click)="onItemClick()"
        [attr.aria-label]="'Select ' + itemData().name">
        <i
          class="fa {{ itemData().icon }} mr-2"
          [style.color]="getContrastingTextColor(itemData().color)"></i>
        <span
          [style.color]="getContrastingTextColor(itemData().color)"
          [class]="itemData().icon === 'fa-file' ? 'truncate' : ''">
          {{ itemData().name }}
        </span>
      </button>
      <app-dropdown-menu [menuItems]="menuItems()" />
    </div>
  `,
  standalone: true,
})
export class ListItemComponent {
  itemData = input.required<ListItemData>();
  menuItems = input.required<DropdownMenuItem[]>();

  itemClicked = output<ListItemData>();

  onItemClick() {
    this.itemClicked.emit(this.itemData());
  }

  getContrastingTextColor(background?: string): string {
    if (!background) return 'inherit';
    const hex = background.trim();
    let r = 0,
      g = 0,
      b = 0;

    const isHex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(hex);
    if (isHex) {
      const clean = hex.substring(1);
      const full =
        clean.length === 3
          ? clean
              .split('')
              .map(ch => ch + ch)
              .join('')
          : clean;
      r = parseInt(full.substring(0, 2), 16);
      g = parseInt(full.substring(2, 4), 16);
      b = parseInt(full.substring(4, 6), 16);
    } else if (hex.startsWith('rgb')) {
      const m = hex.match(/rgb[a]?\(([^)]+)\)/);
      if (m) {
        const parts = m[1].split(',').map(v => parseFloat(v.trim()));
        [r, g, b] = parts;
      }
    } else {
      try {
        const ctxCanvas = document.createElement('canvas');
        const ctx = ctxCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = hex as unknown as string;
          const resolved = ctx.fillStyle as unknown as string;
          if (typeof resolved === 'string' && resolved.startsWith('#')) {
            const clean = resolved.substring(1);
            r = parseInt(clean.substring(0, 2), 16);
            g = parseInt(clean.substring(2, 4), 16);
            b = parseInt(clean.substring(4, 6), 16);
          }
        }
      } catch {
        return 'inherit';
      }
    }

    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#000000' : '#ffffff';
  }
}
