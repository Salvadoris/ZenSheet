import { effect, Injectable, signal } from '@angular/core';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  readonly #USERNAME_KEY = 'zen_username';
  readonly #OFFLINE_MODE_KEY = 'zen_offline_mode';
  readonly #SHOW_JSON_VIEWER_KEY = 'zen_show_json_viewer';

  username = signal<string>(localStorage.getItem(this.#USERNAME_KEY) || 'Anonymous');
  isOfflineMode = signal<boolean>(!environment.backendEnabled || localStorage.getItem(this.#OFFLINE_MODE_KEY) === 'true');
  showJsonViewer = signal<boolean>(localStorage.getItem(this.#SHOW_JSON_VIEWER_KEY) === 'true');

  constructor() {
    effect(() => {
      localStorage.setItem(this.#USERNAME_KEY, this.username());
    });

    effect(() => {
      localStorage.setItem(this.#OFFLINE_MODE_KEY, String(this.isOfflineMode()));
    });

    effect(() => {
      localStorage.setItem(this.#SHOW_JSON_VIEWER_KEY, String(this.showJsonViewer()));
    });
  }

  setUsername(name: string) {
    if (name.length >= 3 && name.length <= 20) {
      this.username.set(name);
    }
  }

  setOfflineMode(offline: boolean) {
    if (!environment.backendEnabled) {
      this.isOfflineMode.set(true);
      return;
    }
    this.isOfflineMode.set(offline);
    if (offline) {
        // Logic to disconnect or warn will be in connection service
    } else {
        // Logic to refresh will be in components
    }
  }

  setShowJsonViewer(show: boolean) {
    this.showJsonViewer.set(show);
  }
}
