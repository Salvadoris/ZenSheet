import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center gap-8">
      <span class="text-gray-600">{{ message() }}</span>
      <i class="fa {{ icon() }} fa-10x text-gray-300"></i>
    </div>
  `,
  standalone: true,
})
export class EmptyStateComponent {
  message = input.required<string>();
  icon = input.required<string>();
}
