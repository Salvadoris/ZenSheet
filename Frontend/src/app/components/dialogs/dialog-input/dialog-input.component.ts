import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';

type FaIcon = `fa-${string}`;

interface SubmitButton {
  text: string;
  icon?: FaIcon;
}

export interface InputDialogData {
  title: string;
  icon: string;
  label: string;
  inputPlaceholder: string;
  initialValue?: string;
  submitButton: SubmitButton;
  minLength?: number;
  maxLength?: number;
  validator?: import('@angular/forms').ValidatorFn;
}

@Component({
  selector: 'app-dialog-input',
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule],
  templateUrl: './dialog-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogInputComponent {
  data: InputDialogData = inject(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<DialogInputComponent>);

  inputControl = new FormControl<string>(this.data.initialValue ?? '', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.minLength(this.data.minLength ?? 1),
      Validators.maxLength(this.data.maxLength ?? 50),
      ...(this.data.validator ? [this.data.validator] : []),
    ],
  });

  get isFormValid() {
    return this.inputControl.valid || false;
  }

  onSubmit(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    if (!this.isFormValid) return;
    this.dialogRef.close({ name: this.inputControl.value.trim() });
  }
}
