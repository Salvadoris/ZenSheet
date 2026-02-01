import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-background-selector',
  imports: [NgClass],
  templateUrl: './background-selector.component.html',
  styleUrl: './background-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackgroundSelectorComponent {
  isGrid = true;
  isGridChanged = output<boolean>();

  changeIsGrid() {
    this.isGrid = !this.isGrid;
    this.isGridChanged.emit(this.isGrid);
  }
}
