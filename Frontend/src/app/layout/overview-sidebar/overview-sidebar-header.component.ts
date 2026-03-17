import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

import { getContrastingTextColor } from '../../utils/color-utils';

import { DropdownMenuItem } from './dropdown-menu.component';

export interface HeaderButton {
  icon: string;
  action?: () => void;
  menuItems?: DropdownMenuItem[];
  title: string;
}

@Component({
  selector: 'app-sidebar-header',
  imports: [CommonModule],
  template: `
    <div class="flex justify-between items-center">
      @if (showBackButton()) {
        <button class="btn btn-square shadow-sm" (click)="onBackClick()">
          <i class="fa fa-arrow-left"></i>
        </button>
      }

      @if (titleWithColor()) {
        <div
          class="rounded-sm h-10 p-1 mx-2 w-full flex items-center justify-center"
          [style.backgroundColor]="titleColor()"
          [style.color]="getContrastingTextColor(titleColor())">
          <h2 class="text-xl select-none">{{ title() }}</h2>
        </div>
      } @else {
        <h2 class="text-xl lg:px-2 select-none">{{ title() }}</h2>
      }

      <div class="flex gap-1">
        @for (button of buttons(); track button.title) {
          @if (button.menuItems && button.menuItems.length > 0) {
            <div class="dropdown dropdown-end">
              <div
                tabindex="0"
                role="button"
                class="btn btn-primary btn-square shadow-sm"
                [title]="button.title">
                <i class="fa {{ button.icon }}"></i>
              </div>
              <ul
                tabindex="0"
                class="dropdown-content menu bg-base-100 rounded-box p-2 shadow-xl w-42 z-100">
                @for (item of button.menuItems; track item.label) {
                  <li>
                    <button
                      [class]="item.isDestructive ? 'text-red-500' : ''"
                      (click)="item.action()"
                      class="flex items-center gap-2">
                      @if (item.icon) {
                        <i class="fa-solid {{ item.icon }} text-[14px]"></i>
                      }
                      <span>{{ item.label }}</span>
                    </button>
                  </li>
                }
              </ul>
            </div>
          } @else {
            <button
              class="btn btn-primary btn-square shadow-sm"
              (click)="button.action ? button.action() : null"
              [title]="button.title">
              <i class="fa {{ button.icon }}"></i>
            </button>
          }
        }
      </div>
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
    return getContrastingTextColor(background);
  }
}
