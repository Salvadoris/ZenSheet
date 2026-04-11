import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

export interface DropdownMenuItem {
  label: string;
  action: () => void;
  isDestructive?: boolean;
  icon?: string;
}

@Component({
  selector: 'app-dropdown-menu',
  imports: [CommonModule],
  template: `
    <div class="dropdown dropdown-right dropdown-center">
      <div tabindex="0" role="button" class="btn btn-square btn-ghost">
        <i class="fa-solid fa-ellipsis-vertical"></i>
      </div>
      <ul
        tabindex="0"
        class="dropdown-content menu bg-base-100 rounded-box p-2 shadow-xl w-42">
        @for (item of menuItems(); track item.label) {
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
  `,
  standalone: true,
})
export class DropdownMenuComponent {
  menuItems = input.required<DropdownMenuItem[]>();
}
