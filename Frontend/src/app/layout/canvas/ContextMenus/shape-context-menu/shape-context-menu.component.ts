import {
  ChangeDetectionStrategy,
  Component,
  Input,
  output,
} from '@angular/core';

import { SelectedMultiShape } from '../../Selected/SelectedMultiShape';
import { SelectedShape } from '../../Selected/SelectedShape';
import { GroupShape } from '../../Shapes/GroupShape';

export enum ShapeContextMenuAction {
  Remove = 'Remove',
  Copy = 'Copy',
  Paste = 'Paste',
  Duplicate = 'Duplicate',
  Group = 'Group',
  SplitGroup = 'SplitGroup',
  MoveForward = 'MoveForward',
  MoveBackwards = 'MoveBackwards',
  MoveToFront = 'MoveToFront',
  MoveToBack = 'MoveToBack',
}

@Component({
  selector: 'app-shape-context-menu',
  imports: [],
  templateUrl: './shape-context-menu.component.html',
  styleUrl: './shape-context-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShapeContextMenu {
  ShapeContextMenuAction = ShapeContextMenuAction;
  #selectedShape: SelectedShape | undefined = undefined;

  executeAction = output<ShapeContextMenuAction>();

  @Input() set selectedShape(selectedShape: SelectedShape | undefined) {
    this.#selectedShape = selectedShape;
  }

  isGroup() {
    return (
      this.#selectedShape !== undefined &&
      !(this.#selectedShape instanceof SelectedMultiShape) &&
      this.#selectedShape.shape instanceof GroupShape
    );
  }

  isMultiShape() {
    return (
      this.#selectedShape !== null &&
      this.#selectedShape instanceof SelectedMultiShape
    );
  }
}
