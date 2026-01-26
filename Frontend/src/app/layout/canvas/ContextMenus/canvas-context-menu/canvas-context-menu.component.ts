import { ChangeDetectionStrategy, Component, output } from '@angular/core';

export enum CanvasContextMenuAction {
  Paste = 'Paste',
}

@Component({
  selector: 'app-canvas-context-menu',
  imports: [],
  templateUrl: './canvas-context-menu.component.html',
  styleUrl: './canvas-context-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasContextMenu {
  CanvasContextMenuAction = CanvasContextMenuAction;
  executeAction = output<CanvasContextMenuAction>();
}
