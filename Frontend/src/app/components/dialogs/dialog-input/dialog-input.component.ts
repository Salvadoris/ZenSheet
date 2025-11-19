import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';

type FaIcon = `fa-${string}`;

interface DialogIcon {
  name: FaIcon;
  color: string;
}

interface SubmitButton {
  text: string;
  icon: FaIcon;
}

export interface InputDialogData {
  title: string;
  icon: DialogIcon;
  label: string;
  inputPlaceholder: string;
  initialValue?: string;
  submitButton: SubmitButton;
  minLength?: number;
  maxLength?: number;
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

  inputControl = new FormControl(this.data.initialValue ?? '', {
    nonNullable: true,
    validators: [
      Validators.minLength(this.data.minLength ?? 50),
      Validators.maxLength(this.data.maxLength ?? 50),
    ],
  });

  get isFormValid() {
    return this.inputControl?.valid || false;
  }
}
