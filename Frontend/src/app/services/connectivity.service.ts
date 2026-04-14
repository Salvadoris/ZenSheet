import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, exhaustMap, interval, of, startWith, Subject } from 'rxjs';

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

  state = signal<EConnectivityState>(EConnectivityState.Online);
  isBackendConnected = signal<boolean>(true);
  isDatabaseConnected = signal<boolean>(true);
  
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
            this.#updateState(this.isBackendConnected(), this.isDatabaseConnected());
        }
    });
  }

  #startMonitoring() {
    if (!environment.backendEnabled) {
      this.state.set(EConnectivityState.OfflineMode);
      this.isBackendConnected.set(false);
      this.isDatabaseConnected.set(false);
      return;
    }

    interval(this.#POLL_INTERVAL)
      .pipe(
        startWith(0),
        exhaustMap(() => {
          if (this.#settingsService.isOfflineMode()) {
            return of({ status: 'OfflineMode', database: 'OfflineMode' });
          }
          return this.#http.get<{ status: string; database: string }>(this.#API_URL).pipe(
            catchError((error: HttpErrorResponse) => {
              if (error.status === 503 && error.error && typeof error.error === 'object') {
                console.warn('[Connectivity] Database issues detected (503):', error.error);
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

      if (newState === EConnectivityState.Online && prevState !== EConnectivityState.Online) {
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
