import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

export interface HeaderButton {
  icon: string;
  action: () => void;
  title: string;
  variant?: 'primary' | 'default';
}

@Component({
  selector: 'app-sidebar-header',
  imports: [CommonModule],
  template: `
    <div class="flex justify-between items-center">
      @if (showBackButton()) {
        <button class="btn btn-square" (click)="onBackClick()">
          <i class="fa fa-arrow-left"></i>
        </button>
      }

      @if (titleWithColor()) {
        <div
          class="rounded-sm h-10 p-1 mx-2 w-full text-center"
          [style.backgroundColor]="titleColor()"
          [style.color]="getContrastingTextColor(titleColor())">
          <h2 class="text-xl select-none">{{ title() }}</h2>
        </div>
      } @else {
        <h2 class="text-xl select-none">{{ title() }}</h2>
      }

      @for (button of buttons(); track button.title) {
        <button
          [class]="
            'btn ' +
            (button.variant === 'primary' ? 'btn-primary' : '') +
            ' btn-square'
          "
          (click)="button.action()"
          [title]="button.title">
          <i class="fa {{ button.icon }}"></i>
        </button>
      }
    </div>
  `,
  standalone: true,
})
export class SidebarHeaderComponent {
  title = input.required<string>();
  titleColor = input<string>();
  showBackButton = input<boolean>(false);
  buttons = input<HeaderButton[]>([]);

  backClicked = output<void>();

  get titleWithColor() {
    return () => !!this.titleColor();
  }

  onBackClick() {
    this.backClicked.emit();
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
