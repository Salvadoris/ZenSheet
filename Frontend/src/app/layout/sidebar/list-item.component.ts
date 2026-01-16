import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

import { getContrastingTextColor } from '../../utils/color-utils';

import {
  DropdownMenuComponent,
  DropdownMenuItem,
} from './dropdown-menu.component';


export interface ListItemData {
  id: string;
  name: string;
  active?: boolean;
  color?: string;
  icon: string;
}

@Component({
  selector: 'app-list-item',
  imports: [CommonModule, DropdownMenuComponent],
  template: `
    <div class="flex justify-between items-center mb-1 gap-1 ">
      <button
        type="button"
        class="p-2 rounded cursor-pointer hover:bg-blue-200! flex-1 text-left focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors "
        [ngClass]="{'btn-disabled': this.itemData().active}"
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
    return getContrastingTextColor(background);
  }
}
