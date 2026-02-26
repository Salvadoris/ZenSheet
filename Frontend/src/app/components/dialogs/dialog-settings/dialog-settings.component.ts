import { DialogRef } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { environment } from '../../../../environments/environment';
import { CanvasConnectionService } from '../../../services/canvas-connection.service';
import { SettingsService } from '../../../services/settings.service';

interface SettingItem {
  label: string;
  description: string;
  checked?: () => boolean;
  toggle?: () => void;
  disabled: boolean;
}

@Component({
  selector: 'app-settings-modal',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './dialog-settings.component.html',
  standalone: true,
})
export class DialogSettingsComponent {
  #settingsService = inject(SettingsService);
  #canvasConnection = inject(CanvasConnectionService);
  #fb = inject(FormBuilder);
  dialogRef = inject(DialogRef);

  // Using FormGroup to support future expansion with more inputs
  usernameForm = this.#fb.group({
    username: [this.#settingsService.username(), [Validators.required, Validators.minLength(3), Validators.maxLength(20)]]
  });

  settings: SettingItem[] = [
    {
      label: 'Offline Mode',
      description: environment.backendEnabled ? 'Local storage only, no cloud sync' : 'Forced offline: Backend unavailable on GitHub Pages',
      checked: () => this.#settingsService.isOfflineMode(),
      toggle: () => this.toggleOfflineMode(),
      disabled: !environment.backendEnabled, 
    },
    // {
    //   label: 'Dark Mode (Beta)',
    //   description: 'Coming soon...',
    //   disabled: true,
    // },
    // {
    //   label: 'High Performance',
    //   description: 'Reduce animations',
    //   disabled: true,
    // },
    {
      label: 'Show Grid',
      description: 'Display a background grid on the canvas',
      disabled: true,
    },
    {
      label: 'Snap to Grid',
      description: 'Align shapes to the background grid',
      disabled: true,
    },
    {
      label: 'Show Cursors',
      description: 'See other collaborators\' cursors',
      disabled: true,
    }
  ];

  developerSettings: SettingItem[] = [
    { 
      label: 'Show JSON for the selected shape',
      description: 'Display raw JSON data of the current selection',
      checked: () => this.#settingsService.showJsonViewer(),
      toggle: () => this.#settingsService.setShowJsonViewer(!this.#settingsService.showJsonViewer()),
      disabled: false,
    }
  ];

  saveUsername() {
    const newName = this.usernameForm.get('username')?.value;
    if (newName && this.usernameForm.valid) {
      this.#settingsService.setUsername(newName);
      this.#canvasConnection.updateUsername(newName);
      this.usernameForm.markAsPristine();
    }
  }

  toggleOfflineMode() {
    this.#settingsService.setOfflineMode(!this.#settingsService.isOfflineMode());
  }
}
