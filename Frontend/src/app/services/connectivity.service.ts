import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, exhaustMap, interval, of, startWith, Subject, tap } from 'rxjs';

import { environment } from '../../environments/environment';

import { apiEndpoints } from './api-endpoints';
import { SettingsService } from './settings.service';

export enum EConnectivityState {
  Online,
  Offline,
  DatabaseUnreachable,
  OfflineMode,
}

@Injectable({
  providedIn: 'root',
})
export class ConnectivityService {
  #http = inject(HttpClient);
  #snackBar = inject(MatSnackBar);
  #settingsService = inject(SettingsService);

  readonly #API_URL = `${environment.apiBaseUrl}${apiEndpoints.Health}`;
  readonly #POLL_INTERVAL = 5000;

  // Signals for state
  state = signal<EConnectivityState>(EConnectivityState.Online);
  isBackendConnected = signal<boolean>(true);
  isDatabaseConnected = signal<boolean>(true);
  
  // Event for when connection is restored
  onReconnected$ = new Subject<void>();

  constructor() {
    this.#startMonitoring();
    this.#startOfflineModeMonitoring();
  }

  #startOfflineModeMonitoring() {
    effect(() => {
        const isOfflineMode = this.#settingsService.isOfflineMode();
        if (isOfflineMode) {
            this.state.set(EConnectivityState.OfflineMode);
        } else {
            // Re-trigger update to restore online/offline/db states
            this.#updateState(this.isBackendConnected(), this.isDatabaseConnected());
        }
    });
  }

  #startMonitoring() {
    interval(this.#POLL_INTERVAL)
      .pipe(
        startWith(0),
        exhaustMap(() => {
          if (this.#settingsService.isOfflineMode()) {
            return of({ status: 'OfflineMode', database: 'OfflineMode' });
          }
          return this.#http.get<{ status: string; database: string }>(this.#API_URL).pipe(
            tap(res => console.log('[Connectivity] Health probe result:', res)),
            catchError((error: HttpErrorResponse) => {
              if (error.status === 503 && error.error && typeof error.error === 'object') {
                console.log('[Connectivity] Database issues detected (503):', error.error);
                return of(error.error as { status: string; database: string });
              }
              console.error('[Connectivity] Probe failed:', error.message || error);
              return of({ status: 'Offline', database: 'Unknown' });
            })
          );
        })
      )
      .subscribe({
        next: (res: { status: string; database: string }) => {
          if (res.status === 'OfflineMode') {
            // Keep existing connection state while in offline mode
            // This prevents "Can't reach backend" errors when switching back to Cloud
            return;
          }
          
          const isBackendUp = res.status !== 'Offline';
          const isDbConnected = res.database === 'Connected';
          this.#updateState(isBackendUp, isDbConnected);
        },
        error: (err) => {
          console.error('[Connectivity] Unexpected monitoring error:', err);
          this.#updateState(false, false);
        }
      });
  }

  #updateState(backend: boolean, database: boolean) {
    const prevState = this.state();
    
    this.isBackendConnected.set(backend);
    this.isDatabaseConnected.set(database);

    let newState: EConnectivityState = EConnectivityState.Online;
    if (this.#settingsService.isOfflineMode()) {
        newState = EConnectivityState.OfflineMode;
    } else if (!backend) {
      newState = EConnectivityState.Offline;
    } else if (!database) {
      newState = EConnectivityState.DatabaseUnreachable;
    }

    if (newState !== prevState) {
      this.state.set(newState);
      this.#notifyUser(newState);

      // Trigger reconnection event if the state transitioned to online
      if (newState === EConnectivityState.Online && prevState !== EConnectivityState.Online) {
        console.log('[Connectivity] State is now Online, triggering reconnection event');
        this.onReconnected$.next();
      }
    }
  }

  #notifyUser(state: EConnectivityState) {
    let message = '';
    switch (state) {
      case EConnectivityState.Offline:
        message = "Can't reach backend";
        break;
      case EConnectivityState.DatabaseUnreachable:
        message = 'Backend is reachable but the database is unreachable';
        break;
      case EConnectivityState.Online:
        message = 'Back online';
        break;
    }

    if (message) {
      this.#snackBar.open(message, 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    }
  }
}
