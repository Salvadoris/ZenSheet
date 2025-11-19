import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';

export interface ColorPickerDialogData {
  title: string;
  defaultColors: string[];
  initialColor?: string;
}

@Component({
  selector: 'app-dialog-color-picker',
  imports: [CommonModule, MatDialogModule],
  templateUrl: './dialog-color.component.html',
  styleUrl: './dialog-color.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogColorPickerComponent {
  readonly data = inject<ColorPickerDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<DialogColorPickerComponent>);

  readonly colorInput = viewChild<ElementRef<HTMLInputElement>>('colorInput');

  readonly selectedColor = signal<string>(
    this.data.initialColor || this.data.defaultColors[0] || '#3b82f6'
  );

  readonly previewStyle = computed(() => ({
    background: this.selectedColor(),
  }));

  selectColor(color: string) {
    this.selectedColor.set(color);
  }

  openColorPicker() {
    this.colorInput()?.nativeElement.click();
  }

  onColorInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (value) {
      this.selectedColor.set(value);
    }
  }

  onHexInput(event: Event) {
    const value = (event.target as HTMLInputElement).value.trim();
    const hexPattern = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (value === '') {
      return;
    }
    const hexValue = value.startsWith('#') ? value : `#${value}`;
    if (hexPattern.test(hexValue)) {
      this.selectedColor.set(hexValue);
    }
  }
}
