import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-canvas-context-menu',
  imports: [],
  templateUrl: './canvas-context-menu.component.html',
  styleUrl: './canvas-context-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasContextMenu {
  pasteShape = output<void>();
}
