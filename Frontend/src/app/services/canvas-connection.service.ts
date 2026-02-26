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
  hierarchyChanged = signal<number>(0);
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

  constructor() {
    this.clientId.set(this.#sessionService.getClientId());
    if (!this.#settingsService.isOfflineMode()) {
      this.connect();
    }

    // React to offline mode changes
    effect(() => {
      const isOffline = this.#settingsService.isOfflineMode();
      if (isOffline) {
        this.disconnect();
      } else if (!this.isConnected()) {
        this.connect();
      }
    });
  }

  async connect(): Promise<void> {
    if (this.#hubConnection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    this.#hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.#connectionUrl)
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext: signalR.RetryContext) => {
          // Exponential backoff: 1s, 3s, 10s, 30s, 60s...
          return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 60000);
        },
      })
      .withServerTimeout(30000)
      .build();

    this.#setupHubEvents();

    try {
      await this.#hubConnection.start();
      this.isConnected.set(true);
      console.log('Connected to Canvas Hub');

      this.updateUsername(this.#settingsService.username());
    } catch (error) {
      console.error('Failed to connect to Canvas Hub:', error);
      this.isConnected.set(false);
      throw error;
    }
  }

  #setupHubEvents(): void {
    if (!this.#hubConnection) return;

    // When server responds with current version
    this.#hubConnection.on('VersionSync', (version: number) => {
      console.log('Version synced:', version);
      this.currentVersion.set(version);
      this.versionSync.set(version);
    });

    // When an action is received from any client
    this.#hubConnection.on('ActionReceived', (action: ReceivedAction) => {
      console.log('Action received:', action);
      this.currentVersion.set(action.version);
      
      // If noteId is missing, assume it belongs to the current note
      if (!action.noteId) {
        action.noteId = this.currentNoteId() || '';
      }
      
      this.actionReceived$.next(action);
    });

    // When the folder hierarchy changes
    this.#hubConnection.on('HierarchyChanged', () => {
      console.log('[CanvasConnection] 📁 Hierarchy change notification received from server');
      this.hierarchyChanged.update((v: number) => v + 1);
    });

    // When synchronizing missed actions
    this.#hubConnection.on('ActionSync', (actions: ReceivedAction[]) => {
      console.log('Synced actions:', actions.length);
      actions.forEach((action) => {
        this.currentVersion.set(action.version);
        this.actionReceived$.next(action);
      });
    });

    // When another client joins
    this.#hubConnection.on('ClientJoined', (clientId: string, count: number) => {
      console.log(`Client joined: ${clientId}, total: ${count}`);
      this.clientJoined.set({ clientId, count });
    });

    // When another client leaves
    this.#hubConnection.on('ClientLeft', (clientId: string, count: number) => {
      console.log(`Client left: ${clientId}, total: ${count}`);
      this.clientLeft.set({ clientId, count });
      
      // Remove from presence list immediately
      this.presenceList.update(list => list.filter(p => p.clientId !== clientId));
      this.cursorRemoved.set(clientId);
    });

    // Error handling
    this.#hubConnection.on('ActionError', (error: string) => {
      console.error('Action error:', error);
      this.syncError.set(error);
    });

    this.#hubConnection.on('SyncError', (error: string) => {
      console.error('Sync error:', error);
      this.syncError.set(error);
    });

    // Authentication error
    this.#hubConnection.on('AuthError', (error: string) => {
      console.error('Authentication error:', error);
      this.syncError.set(`Authentication failed: ${error}`);
    });

    // Cursor position events
    this.#hubConnection.on('CursorPositionUpdate', (update: CursorUpdate) => {
      console.log('[Canvas] Cursor motion received from client:', update.clientId, `(${update.cursorPosition.x.toFixed(0)}, ${update.cursorPosition.y.toFixed(0)})`);
      
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
      console.log('Received initial cursors:', cursors.length);
      this.initialCursors.set(cursors);
    });

    // When a remote cursor is removed (client disconnected)
    this.#hubConnection.on('CursorRemoved', (clientId: string) => {
      console.log(`Cursor removed for client: ${clientId}`);
      this.cursorRemoved.set(clientId);
    });

    // Presence update
    this.#hubConnection.on('PresenceUpdate', (presence: PresenceInfo[]) => {
      console.log('Presence update:', presence.length, 'users');
      this.presenceList.set(presence);
    });

    // Selection updated by another client
    this.#hubConnection.on('SelectionUpdated', (clientId: string, shapeIdList: string[]) => {
      console.log(`Selection updated for client ${clientId}:`, shapeIdList);
      this.selectionUpdate.set({ clientId, shapeIdList });
    });

    // Connection state changes
    this.#hubConnection.onreconnecting((error?: Error) => {
      console.warn('Reconnecting...', error);
      this.isConnected.set(false);
    });

    this.#hubConnection.onreconnected((connectionId?: string) => {
      console.log('Reconnected:', connectionId);
      this.isConnected.set(true);
      // Rejoin current note if we were in one
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
    if (!this.#hubConnection || this.#hubConnection.state !== signalR.HubConnectionState.Connected) {
      console.warn('Hub not connected, cannot join note');
      return;
    }

    this.currentNoteId.set(noteId);
    try {
      const clientId = this.#sessionService.getClientId();
      const clientSecret = this.#sessionService.getClientSecret();

      console.log('[SignalR] Joining note:', noteId, 'as client:', clientId);
      await this.#hubConnection.invoke('JoinNoteAsync', noteId, clientId, clientSecret, this.#settingsService.username());
      console.log('[SignalR] Successfully joined note:', noteId);
    } catch (error) {
      console.error('[SignalR] Failed to join note:', error);
      throw error;
    }
  }

  // Send a canvas action to the backend
  async sendAction(noteId: string, actionType: string, payload: CanvasActionPayload): Promise<ReceivedAction | void> {
    if (!this.#hubConnection || this.#hubConnection.state !== signalR.HubConnectionState.Connected) {
      console.warn('Hub not connected, cannot send action');
      return;
    }

    try {
      // Serialize the action payload
      const serializedPayload = this.#serializePayload(payload);
      const result = await this.#hubConnection.invoke<ReceivedAction>('SendActionAsync', noteId, actionType, serializedPayload);
      console.log('Action sent and confirmed:', actionType, 'v' + result.version);
      return result;
    } catch (error) {
      console.error('Failed to send action:', error);
      throw error;
    }
  }

  /**
   * Request missed actions after reconnection
   */
  async requestActionsSince(noteId: string, version: number): Promise<void> {
    if (!this.#hubConnection || this.#hubConnection.state !== signalR.HubConnectionState.Connected) {
      console.warn('Hub not connected, cannot request actions');
      return;
    }

    try {
      await this.#hubConnection.invoke('RequestActionsSinceAsync', noteId, version);
      console.log('Requested actions since version:', version);
    } catch (error) {
      console.error('Failed to request actions:', error);
      throw error;
    }
  }

  /**
   * Send cursor position update to other clients
   */
  async sendCursorPosition(noteId: string, cursorPosition: CursorPosition): Promise<void> {
    if (!this.#hubConnection) {
      console.warn('[SignalR] sendCursorPosition: hubConnection is null');
      return;
    }
    
    const state = this.#hubConnection.state;
    if (state !== signalR.HubConnectionState.Connected) {
      console.warn('[SignalR] sendCursorPosition: hub not connected, state =', state);
      return;
    }

    try {
      await this.#hubConnection.invoke('UpdateCursorPositionAsync', noteId, cursorPosition);
    } catch (error) {
      console.error('[SignalR] Error sending cursor:', error);
    }
  }

  /**
   * Broadcast local selection to other clients
   */
  async sendSelection(noteId: string, shapeIdList: string[]): Promise<void> {
    if (!this.#hubConnection || this.#hubConnection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      await this.#hubConnection.invoke('UpdateSelectionAsync', noteId, shapeIdList);
    } catch (error) {
      console.error('[SignalR] Error sending selection:', error);
    }
  }

  /**
   * Update the local user's name on the server
   */
  async updateUsername(username: string): Promise<void> {
    if (!this.#hubConnection || this.#hubConnection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      await this.#hubConnection.invoke('UpdateUsernameAsync', username);
      console.log('[SignalR] Username updated to:', username);
    } catch (error) {
      console.error('[SignalR] Error updating username:', error);
    }
  }

  /**
   * Serialize canvas action payload for transmission
   */
  #serializePayload(payload: CanvasActionPayload): Record<string, unknown> {
    // Convert any Date objects or complex types to serializable format
    return {
      type: payload.type,
      data: this.#serializeObject(payload.data),
    };
  }

  /**
   * Recursively serialize objects to ensure they're JSON-compatible
   */
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
