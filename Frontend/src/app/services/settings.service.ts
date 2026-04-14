import { computed, effect, inject, Injectable, signal } from '@angular/core';

import { environment } from '../../environments/environment';

import { ClientSessionService } from './client-session.service';

interface AppSettings {
  username: string;
  offlineMode: boolean;
  showJsonViewer: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  showCursors: boolean;
  isInitial?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  readonly #storageKey = 'app_settings';

  readonly #defaults: AppSettings = {
    username: 'Anonymous',
    offlineMode: !environment.backendEnabled,
    showJsonViewer: false,
    showGrid: true,
    snapToGrid: true,
    showCursors: true,
    isInitial: true
  };

  readonly #initial: AppSettings;

  #username = signal('');
  #offlineMode = signal(false);
  #showJsonViewer = signal(false);
  #showGrid = signal(true);
  #snapToGrid = signal(true);
  #showCursors = signal(true);

  #clientSessionService = inject(ClientSessionService);

  readonly username = this.#username.asReadonly();
  readonly isOfflineMode = this.#offlineMode.asReadonly();
  readonly showJsonViewer = this.#showJsonViewer.asReadonly();
  readonly showGrid = this.#showGrid.asReadonly();
  readonly snapToGrid = this.#snapToGrid.asReadonly();
  readonly showCursors = this.#showCursors.asReadonly();

  readonly canvasSettings = computed(() => ({
    showGrid: this.#showGrid(),
    snapToGrid: this.#snapToGrid(),
    showCursors: this.#showCursors(),
  }));

  constructor() {
    this.#initial = {
      ...this.#defaults,
      ...this.#readFromStorage(),
    };

    let initialUsername = this.#initial.username;
    if (this.#initial.isInitial || initialUsername === 'Anonymous') {
      const clientId = this.#clientSessionService.getClientId();
      initialUsername = `User-${clientId.substring(0, 4).toUpperCase()}`;
    }

    this.#username.set(initialUsername);

    if (!environment.backendEnabled) {
      this.#offlineMode.set(true);
    } else {
      this.#offlineMode.set(this.#initial.offlineMode);
    }

    this.#showJsonViewer.set(this.#initial.showJsonViewer);
    this.#showGrid.set(this.#initial.showGrid);
    this.#snapToGrid.set(this.#initial.snapToGrid);
    this.#showCursors.set(this.#initial.showCursors);

    effect(() => {
      const settings: AppSettings = {
        username: this.#username(),
        offlineMode: this.#offlineMode(),
        showJsonViewer: this.#showJsonViewer(),
        showGrid: this.#showGrid(),
        snapToGrid: this.#snapToGrid(),
        showCursors: this.#showCursors(),
        isInitial: false
      };

      localStorage.setItem(this.#storageKey, JSON.stringify(settings));
    });
  }

  setUsername(name: string) {
    if (name.length >= 3 && name.length <= 20) {
      this.#username.set(name);
    }
  }

  setOfflineMode(offline: boolean) {
    if (!environment.backendEnabled) {
      this.#offlineMode.set(true);
      return;
    }
    this.#offlineMode.set(offline);
  }

  setShowJsonViewer(show: boolean) {
    this.#showJsonViewer.set(show);
  }

  setShowGrid(show: boolean) {
    this.#showGrid.set(show);
  }

  setSnapToGrid(snap: boolean) {
    this.#snapToGrid.set(snap);
  }

  setShowCursors(show: boolean) {
    this.#showCursors.set(show);
  }

  #readFromStorage(): Partial<AppSettings> {
    try {
      const raw = localStorage.getItem(this.#storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
}