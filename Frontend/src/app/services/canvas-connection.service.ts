import { effect, inject, Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';

import { environment } from '../../environments/environment';

import { apiEndpoints } from './api-endpoints';
import { ClientSessionService } from './client-session.service';
import { SettingsService } from './settings.service';


export interface CanvasActionPayload {
  type: string;
  data: unknown;
}

export interface ReceivedAction {
  version: number;
  actionType: string;
  payload: Record<string, unknown>;
  noteId?: string;
  clientId: string;
}

export interface CursorUpdate {
  clientId: string;
  username?: string;
  cursorPosition: CursorPosition;
  noteId?: string;
}

export interface PresenceInfo {
  clientId: string;
  username: string;
  noteId: string;
  cursorPosition: CursorPosition;
  lastUpdate: string;
}

export interface CursorPosition {
  x: number;
  y: number;
}

export interface SelectionUpdate {
  clientId: string;
  shapeIdList: string[];
}

@Injectable({
  providedIn: 'root',
})
export class CanvasConnectionService {
  #hubConnection: signalR.HubConnection | null = null;
  #connectionUrl = `${environment.apiBaseUrl}${apiEndpoints.Canvas}`;

  clientId = signal<string | null>(null);
  isConnected = signal<boolean>(false);
  currentNoteId = signal<string | null>(null);
  currentVersion = signal<number>(0);
  
  actionReceived$ = new Subject<ReceivedAction>();
  hierarchyChanged = signal<string | null>(null, { equal: () => false });
  versionSync = signal<number | null>(null);
  clientJoined = signal<{ clientId: string; count: number } | null>(null);
  clientLeft = signal<{ clientId: string; count: number } | null>(null);
  syncError = signal<string | null>(null);
  
  cursorUpdate = signal<CursorUpdate | null>(null);
  initialCursors = signal<CursorUpdate[] | null>(null);
  cursorRemoved = signal<string | null>(null);

  presenceList = signal<PresenceInfo[]>([]);
  selectionUpdate = signal<SelectionUpdate | null>(null);
  trackedClientId = signal<string | null>(null);
  #sessionService = inject(ClientSessionService);
  #settingsService = inject(SettingsService);

  // Cursor throttle state (~30fps = 33ms interval)
  readonly #CURSOR_THROTTLE_MS = 33;
  #cursorThrottleTimer: ReturnType<typeof setTimeout> | null = null;
  #pendingCursor: { noteId: string; cursorPosition: CursorPosition } | null = null;

  constructor() {
    this.clientId.set(this.#sessionService.getClientId());
    if (!this.#settingsService.isOfflineMode()) {
      this.connect();
    }

    window.addEventListener('beforeunload', () => {
      this.disconnect();
    });

    effect(() => {
      const isOffline = this.#settingsService.isOfflineMode();
      if (isOffline) {
        this.disconnect();
      } else if (!this.isConnected()) {
        this.connect();
      }
    });
  }

  #connectingPromise: Promise<void> | null = null;

  async connect(): Promise<void> {
    if (this.#connectingPromise) {
      return this.#connectingPromise;
    }

    if (this.#hubConnection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    this.#connectingPromise = (async () => {
      this.#hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(this.#connectionUrl)
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext: signalR.RetryContext) => {
            // Exponential backoff: 1s, 3s, 10s, 30s, 60s...
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 60000);
          },
        })
        .withServerTimeout(15000)
        .build();

      this.#setupHubEvents();

      try {
        await this.#hubConnection.start();
        this.isConnected.set(true);

        // Register client ID immediately to map connection for presence
        const clientId = this.clientId();
        if (clientId && this.#hubConnection.state === signalR.HubConnectionState.Connected) {
          await this.#hubConnection.invoke('InitialRegisterAsync', clientId, this.#settingsService.username());
        }
      } catch (error) {
        console.error('Failed to connect to Canvas Hub:', error);
        this.isConnected.set(false);
        throw error;
      } finally {
        this.#connectingPromise = null;
      }
    })();

    return this.#connectingPromise;
  }

  #setupHubEvents(): void {
    if (!this.#hubConnection) return;

    // When server responds with current version
    this.#hubConnection.on('VersionSync', (version: number) => {
      this.currentVersion.set(version);
      this.versionSync.set(version);
    });

    // When an action is received from any client
    this.#hubConnection.on('ActionReceived', (action: ReceivedAction) => {
      this.currentVersion.set(action.version);
      
      // If noteId is missing, assume it belongs to the current note
      if (!action.noteId) {
        action.noteId = this.currentNoteId() || '';
      }
      
      this.actionReceived$.next(action);
    });

    this.#hubConnection.on('HierarchyChanged', (affectedFolderId: string) => {
      this.hierarchyChanged.set(affectedFolderId ?? '');
    });
    this.#hubConnection.on('ActionSync', (actions: ReceivedAction[]) => {
      actions.forEach((action) => {
        this.currentVersion.set(action.version);
        this.actionReceived$.next(action);
      });
    });

    this.#hubConnection.on('ClientJoined', (clientId: string, count: number) => {
      this.clientJoined.set({ clientId, count });
    });

    this.#hubConnection.on('ClientLeft', (clientId: string, count: number) => {
      this.clientLeft.set({ clientId, count });
      
      this.presenceList.update(list => list.filter(p => p.clientId !== clientId));
      this.cursorRemoved.set(clientId);
    });

    this.#hubConnection.on('ActionError', (error: string) => {
      console.error('Action error:', error);
      this.syncError.set(error);
    });

    this.#hubConnection.on('SyncError', (error: string) => {
      console.error('Sync error:', error);
      this.syncError.set(error);
    });

    this.#hubConnection.on('AuthError', (error: string) => {
      console.error('Authentication error:', error);
      this.syncError.set(`Authentication failed: ${error}`);
    });

    this.#hubConnection.on('CursorPositionUpdate', (update: CursorUpdate) => {
      
      if (!update.noteId) {
        update.noteId = this.currentNoteId() || '';
      }

      this.cursorUpdate.set(update);
      
      // Sync with presence list for teleportation
      this.presenceList.update(list => {
        const index = list.findIndex(p => p.clientId === update.clientId);
        if (index !== -1) {
          const newList = [...list];
          newList[index] = { 
            ...newList[index], 
            cursorPosition: update.cursorPosition,
            noteId: update.noteId || this.currentNoteId() || '',
            lastUpdate: new Date().toISOString()
          };
          return newList;
        }
        return list;
      });
    });

    this.#hubConnection.on('InitialCursors', (cursors: CursorUpdate[]) => {
      this.initialCursors.set(cursors);
    });

    this.#hubConnection.on('CursorRemoved', (clientId: string) => {
      this.cursorRemoved.set(clientId);
    });

    this.#hubConnection.on('PresenceUpdate', (presence: PresenceInfo[]) => {
      this.presenceList.set(presence);
    });

    this.#hubConnection.on('SelectionUpdated', (clientId: string, shapeIdList: string[]) => {
      this.selectionUpdate.set({ clientId, shapeIdList });
    });

    this.#hubConnection.onreconnecting((error?: Error) => {
      console.warn('Reconnecting...', error);
      this.isConnected.set(false);
    });

    this.#hubConnection.onreconnected(async () => {
      this.isConnected.set(true);

      const clientId = this.clientId();
      if (clientId && this.#hubConnection) {
        await this.#hubConnection.invoke('InitialRegisterAsync', clientId, this.#settingsService.username());
      }

      if (this.currentNoteId()) {
        this.joinNote(this.currentNoteId()!);
      }
    });

    this.#hubConnection.onclose((error?: Error) => {
      console.warn('Connection closed:', error);
      this.isConnected.set(false);
    });
  }

  async joinNote(noteId: string): Promise<void> {
    if (this.#connectingPromise) {
      await this.#connectingPromise;
    }

    if (!this.#hubConnection || this.#hubConnection.state !== signalR.HubConnectionState.Connected) {
      console.warn('Hub not connected, cannot join note');
      return;
    }

    this.currentNoteId.set(noteId);
    try {
      const clientId = this.#sessionService.getClientId();
      const clientSecret = this.#sessionService.getClientSecret();

      await this.#hubConnection.invoke('JoinNoteAsync', noteId, clientId, clientSecret, this.#settingsService.username());
    } catch (error) {
      console.error('[SignalR] Failed to join note:', error);
      throw error;
    }
  }

  async sendAction(noteId: string, actionType: string, payload: CanvasActionPayload): Promise<ReceivedAction | void> {
    if (this.#connectingPromise) {
      await this.#connectingPromise;
    }

    if (!this.#hubConnection || this.#hubConnection.state !== signalR.HubConnectionState.Connected) {
      console.warn('Hub not connected, cannot send action');
      return;
    }

    try {
      const serializedPayload = this.#serializePayload(payload);
      const result = await this.#hubConnection.invoke<ReceivedAction>('SendActionAsync', noteId, actionType, serializedPayload);
      return result;
    } catch (error) {
      console.error('Failed to send action:', error);
      throw error;
    }
  }

  async requestActionsSince(noteId: string, version: number): Promise<void> {
    if (!this.#hubConnection || this.#hubConnection.state !== signalR.HubConnectionState.Connected) {
      console.warn('Hub not connected, cannot request actions');
      return;
    }

    try {
      await this.#hubConnection.invoke('RequestActionsSinceAsync', noteId, version);
    } catch (error) {
      console.error('Failed to request actions:', error);
      throw error;
    }
  }

  async sendCursorPosition(noteId: string, cursorPosition: CursorPosition): Promise<void> {
    this.#pendingCursor = { noteId, cursorPosition };

    if (this.#cursorThrottleTimer) return;

    await this.#flushCursorPosition();

    this.#cursorThrottleTimer = setTimeout(async () => {
      this.#cursorThrottleTimer = null;
      if (this.#pendingCursor) {
        await this.#flushCursorPosition();
      }
    }, this.#CURSOR_THROTTLE_MS);
  }

  async #flushCursorPosition(): Promise<void> {
    const pending = this.#pendingCursor;
    this.#pendingCursor = null;

    if (!pending) return;

    if (this.#connectingPromise) {
      await this.#connectingPromise;
    }

    if (!this.#hubConnection) return;
    
    const state = this.#hubConnection.state;
    if (state !== signalR.HubConnectionState.Connected) return;

    try {
      await this.#hubConnection.invoke('UpdateCursorPositionAsync', pending.noteId, pending.cursorPosition);
    } catch (error) {
      console.error('[SignalR] Error sending cursor:', error);
    }
  }

  async sendSelection(noteId: string, shapeIdList: string[]): Promise<void> {
    if (this.#connectingPromise) {
      await this.#connectingPromise;
    }

    if (!this.#hubConnection || this.#hubConnection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      await this.#hubConnection.invoke('UpdateSelectionAsync', noteId, shapeIdList);
    } catch (error) {
      console.error('[SignalR] Error sending selection:', error);
    }
  }


  async updateUsername(username: string): Promise<void> {
    if (!this.#hubConnection || this.#hubConnection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      await this.#hubConnection.invoke('UpdateUsernameAsync', username);
    } catch (error) {
      console.error('[SignalR] Error updating username:', error);
    }
  }

  #serializePayload(payload: CanvasActionPayload): Record<string, unknown> {
    return {
      type: payload.type,
      data: this.#serializeObject(payload.data),
    };
  }


  #serializeObject(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;

    if (obj instanceof Date) return obj.toISOString();
    if (obj instanceof Array) return obj.map((item) => this.#serializeObject(item));

    if (typeof obj === 'object') {
      const serialized: Record<string, unknown> = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          serialized[key] = this.#serializeObject((obj as Record<string, unknown>)[key]);
        }
      }
      return serialized;
    }

    return obj;
  }

  async disconnect(): Promise<void> {
    if (this.#hubConnection) {
      this.currentNoteId.set(null);
      this.currentVersion.set(0);
      await this.#hubConnection.stop();
      this.isConnected.set(false);
    }
  }
}
