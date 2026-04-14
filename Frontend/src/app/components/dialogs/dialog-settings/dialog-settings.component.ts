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

  usernameForm = this.#fb.group({
    username: [this.#settingsService.username(), [Validators.required, Validators.minLength(3), Validators.maxLength(20)]]
  });

  readonly forcedOfflineDesc = "Forced offline: Backend unavailable on GitHub Pages"
  settings: SettingItem[] = [
    {
      label: 'Show Grid',
      description: 'Display a background grid on the canvas',
      checked: () => this.#settingsService.showGrid(),
      toggle: () => this.#settingsService.setShowGrid(!this.#settingsService.showGrid()),
      disabled: false,
    },
    {
      label: 'Snap to Grid',
      description: 'Align shapes to the background grid',
      checked: () => this.#settingsService.snapToGrid(),
      toggle: () => this.#settingsService.setSnapToGrid(!this.#settingsService.snapToGrid()),
      disabled: false,
    },
    {
      label: 'Offline Mode',
      description: this.backendEnabled ? 'Local storage only, no cloud sync' : this.forcedOfflineDesc,
      checked: () => this.#settingsService.isOfflineMode(),
      toggle: () => this.toggleOfflineMode(),
      disabled: !this.backendEnabled, 
    },
    {
      label: 'Show Cursors',
      description: this.backendEnabled ? 'See other collaborators\' cursors' : this.forcedOfflineDesc,
      checked: () => this.#settingsService.showCursors(),
      toggle: () => this.#settingsService.setShowCursors(!this.#settingsService.showCursors()),
      disabled: !this.backendEnabled, 
    }
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

  get backendEnabled() {
    return environment.backendEnabled;
  }
}
