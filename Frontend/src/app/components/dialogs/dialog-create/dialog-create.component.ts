import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  OnInit,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';

export interface CreateDialogData {
  title: string;
  placeholder: string;
  itemType: 'folder' | 'note';
  initialValue?: string;
}

@Component({
  selector: 'app-dialog-create',
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule],
  templateUrl: './dialog-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogCreateComponent implements OnInit {
  data: CreateDialogData = inject(MAT_DIALOG_DATA);

  created = output<{ name: string }>();
  cancelled = output<void>();

  #dialogRef = inject(MatDialogRef<DialogCreateComponent>);
  #fb = inject(FormBuilder);

  createForm!: FormGroup;

  ngOnInit() {
    this.createForm = this.#fb.group({
      name: [
        this.data.initialValue || '',
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(50),
        ],
      ],
    });
  }

  onSubmit() {
    if (this.createForm.valid) {
      const name = this.createForm.get('name')?.value?.trim();
      if (name) {
        this.created.emit({ name });
        this.#dialogRef.close({ name });
      }
    }
  }

  onCancel() {
    this.cancelled.emit();
    this.#dialogRef.close();
  }

  get submitButtonText() {
    return this.data.itemType === 'folder' ? 'Create Folder' : 'Create Note';
  }

  get iconClass() {
    return this.data.itemType === 'folder'
      ? 'fa-folder-plus text-blue-500'
      : 'fa-file-circle-plus text-yellow-500';
  }

  get isFormValid(): boolean {
    return this.createForm?.valid || false;
  }
}
