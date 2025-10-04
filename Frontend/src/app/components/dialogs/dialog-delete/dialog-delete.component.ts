import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from '@angular/core';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';

export interface DeleteDialogData {
  title: string;
  message: string;
  itemName: string;
  itemType: 'folder' | 'note';
}

@Component({
  selector: 'app-dialog-delete',
  imports: [CommonModule, MatDialogModule],
  templateUrl: './dialog-delete.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogDeleteComponent {
  // Data from dialog
  data: DeleteDialogData;

  confirmed = output<void>();
  cancelled = output<void>();

  private dialogRef = inject(MatDialogRef<DialogDeleteComponent>);

  constructor() {
    this.data = inject(MAT_DIALOG_DATA);
  }

  onConfirm(): void {
    this.confirmed.emit();
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.cancelled.emit();
    this.dialogRef.close(false);
  }

  get confirmButtonText(): string {
    return this.data.itemType === 'folder' ? 'Delete Folder' : 'Delete Note';
  }

  get warningIcon(): string {
    return this.data.itemType === 'folder' ? 'fa-folder-minus' : 'fa-trash';
  }
}
