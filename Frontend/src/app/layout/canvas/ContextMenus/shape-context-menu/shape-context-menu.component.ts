import {
  ChangeDetectionStrategy,
  Component,
  Input,
  output,
} from '@angular/core';

import { SelectedMultiShape } from '../../Selected/SelectedMultiShape';
import { SelectedShape } from '../../Selected/SelectedShape';
import { GroupShape } from '../../Shapes/GroupShape';

@Component({
  selector: 'app-shape-context-menu',
  imports: [],
  templateUrl: './shape-context-menu.component.html',
  styleUrl: './shape-context-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShapeContextMenu {
  #selectedShape: SelectedShape | undefined = undefined;

  removeShape = output<void>();
  copyShape = output<void>();
  pasteShape = output<void>();
  duplicateShape = output<void>();
  groupShapes = output<void>();
  splitGroupShape = output<void>();

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
