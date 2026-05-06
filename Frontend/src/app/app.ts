import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { concatMap, debounceTime, filter, Subject, Subscription } from 'rxjs';

import { environment } from '../environments/environment';

import { ConnectionStatusBadge } from './components/connection-status-badge/connection-status-badge';
import { DialogSettingsComponent } from './components/dialogs/dialog-settings/dialog-settings.component';
import { ActionType } from './layout/canvas/Actions/ActionType';
import { CanvasAction } from './layout/canvas/Actions/CanvasAction';
import { CanvasComponent } from './layout/canvas/canvas.component';
import { DetailSidebar } from './layout/detail-sidebar/detail-sidebar.component';
import { JsonViewerComponent } from './layout/json-viewer/json-viewer.component';
import { OverviewSidebarComponent } from './layout/overview-sidebar/overview-sidebar.component';
import { PresenceBarComponent } from './layout/presence-bar/presence-bar.component';
import { ToolbarComponent } from './layout/toolbar/toolbar.component';
import { ZoomIndicatorComponent } from './layout/zoom-indicator/zoom-indicator.component';
import { Folder, Note, NoteContent } from './models/note.model';
import { CanvasActionEmitterService } from './services/canvas-action-emitter.service';
import {
  CanvasConnectionService,
  PresenceInfo,
} from './services/canvas-connection.service';
import {
  ConnectivityService,
  EConnectivityState,
} from './services/connectivity.service';
import { FolderService } from './services/folder.service';
import { NotesService } from './services/notes.service';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    OverviewSidebarComponent,
    ToolbarComponent,
    CanvasComponent,
    DetailSidebar,
    ZoomIndicatorComponent,
    PresenceBarComponent,
    ConnectionStatusBadge,
    JsonViewerComponent,
    DialogModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  #notesService = inject(NotesService);
  #folderService = inject(FolderService);
  #router = inject(Router);
  #canvasConnection = inject(CanvasConnectionService);
  connectivity = inject(ConnectivityService);
  settingsService = inject(SettingsService);
  #dialog = inject(Dialog);
  #canvasActionEmitter = inject(CanvasActionEmitterService);

  canvas = viewChild<CanvasComponent>('canvas');
  overviewSidebar = viewChild<OverviewSidebarComponent>('overviewSidebar');

  selectedNote = signal<Note | null>(null);
  selectedNoteSource = signal<'cloud' | 'local' | null>(null);
  selectedFolderId = signal<string>('');
  isDirty = signal<boolean>(false);
  isLoadingNote = signal<boolean>(false);
  hasNotes = signal<boolean>(true);
  hasFolders = signal<boolean>(false);
  lastActiveNote = signal<Note | null>(null);

  #reconnectSubscription?: Subscription;
  #saveSubscription?: Subscription;
  #actionSubscription?: Subscription;
  #lastLoadRequestId = 0;
  #isFirstModeLoad = true;

  #saveSubject$ = new Subject<void>();

  readonly eConnectivityState = EConnectivityState;

  constructor() {
    this.#actionSubscription = this.#canvasConnection.actionReceived$.subscribe(
      receivedAction => {
        if (
          receivedAction &&
          receivedAction.noteId &&
          this.selectedNote()?.id === receivedAction.noteId
        ) {
          if (receivedAction.clientId === this.#canvasConnection.clientId()) {
            return;
          }

          const payload = receivedAction.payload as Record<string, unknown>;
          const canvasAction: CanvasAction = {
            type: (payload['type'] || receivedAction.actionType) as ActionType,
            data: (payload['data'] || payload) as Record<string, unknown>,
          };
          this.canvas()?.applyRemoteAction(canvasAction);
        }
      }
    );

    effect(() => {
      const affectedFolderId = this.#canvasConnection.hierarchyChanged();
      if (affectedFolderId === null) return;

      untracked(() => {
        this.updateGlobalNoteStatus();

        const currentFolderId = this.selectedFolderId();
        if (
          !currentFolderId ||
          affectedFolderId === '' ||
          affectedFolderId === currentFolderId ||
          this.#isAncestorFolder(affectedFolderId, currentFolderId)
        ) {
          this.overviewSidebar()?.loadFolders('cloud');
        }
      });
    });

    this.#saveSubscription = this.#saveSubject$
      .pipe(
        debounceTime(500),
        concatMap(async () => {
          if (this.isDirty()) {
            await this.saveCurrentNote();
          }
        })
      )
      .subscribe();

    effect(() => {
      this.settingsService.isOfflineMode();

      if (this.#isFirstModeLoad) {
        this.#isFirstModeLoad = false;
        return;
      }

      this.handleModeTransition();
    });
  }

  ngOnInit() {
    this.updateGlobalNoteStatus();
    this.#router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.#syncWithUrl());

    if (this.#router.navigated) {
      this.#syncWithUrl();
    }

    this.#reconnectSubscription = this.connectivity.onReconnected$.subscribe(
      async () => {
        await this.updateGlobalNoteStatus();
        this.overviewSidebar()?.loadFolders('cloud');

        const currentNote = this.selectedNote();
        const currentSource = this.selectedNoteSource();
        if (currentNote && currentSource) {
          const folders = await this.#folderService.getFolders(currentSource);
          const freshNote = this.#findNoteRecursive(folders, currentNote.id);
          if (freshNote) {
            await this.loadNote(freshNote, currentSource);
          }
        }
      }
    );
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(_event: Event) {
    if (this.isDirty()) {
      this.saveCurrentNote();
    }
  }

  ngOnDestroy() {
    this.#reconnectSubscription?.unsubscribe();
    this.#saveSubscription?.unsubscribe();
    this.#actionSubscription?.unsubscribe();
    if (this.isDirty()) {
      this.saveCurrentNote();
    }
    this.#canvasConnection.disconnect();
  }

  async updateGlobalNoteStatus() {
    const [cloudFolders, localFolders] = await Promise.all([
      this.#folderService.getFolders('cloud'),
      this.#folderService.getFolders('local'),
    ]);
    this.hasFolders.set(cloudFolders.length > 0 || localFolders.length > 0);

    const count = await this.#folderService.getTotalNotesCount();
    this.hasNotes.set(count > 0);

    if (count === 0) {
      this.selectedNote.set(null);
      this.lastActiveNote.set(null);
    }
  }

  async #syncWithUrl() {
    const url = decodeURIComponent(this.#router.url.split('?')[0]);
    if (url === '/') {
      if (!this.hasFolders()) {
        await this.#loadDefaultNote();
      } else {
        this.selectedFolderId.set('');
        this.selectedNote.set(null);
        this.selectedNoteSource.set(null);
        this.overviewSidebar()?.resetToRoot();
      }
      return;
    }

    const path = url.split('/').filter(s => s.length > 0);
    const {
      folder,
      note,
      source: pathSource,
    } = await this.#folderService.getItemByPath(path);

    const isFolderUrl = url.endsWith('/');

    if (isFolderUrl && folder) {
      this.selectedFolderId.set(folder.id);
      this.selectedNote.set(null);
      await this.overviewSidebar()?.navigateToFolder(
        folder.id,
        (pathSource as 'cloud' | 'local') || undefined
      );
    } else if (!isFolderUrl && note) {
      if (this.selectedNote()?.id !== note.id) {
        this.selectedFolderId.set(note.parentFolderId);
        await this.loadNote(note, (pathSource as 'cloud' | 'local') || 'cloud');
        await this.overviewSidebar()?.navigateToFolder(
          note.parentFolderId,
          (pathSource as 'cloud' | 'local') || undefined,
          note
        );
      }
    } else if (!isFolderUrl && folder) {
      await this.onFolderSelected({
        folderId: folder.id,
        source: (pathSource || 'cloud') as 'cloud' | 'local',
      });
    } else {
      if (!this.hasFolders()) {
        await this.#loadDefaultNote();
      }
    }
  }

  async #loadDefaultNote() {
    if (this.selectedNote()) return;

    const [cloudFolders, localFolders] = await Promise.all([
      this.#folderService.getFolders('cloud'),
      this.#folderService.getFolders('local'),
    ]);

    const cloudNotes = cloudFolders
      .flatMap(f => this.#getAllNotesRecursive(f))
      .map(n => ({ note: n, source: 'cloud' as const }));
    const localNotes = localFolders
      .flatMap(f => this.#getAllNotesRecursive(f))
      .map(n => ({ note: n, source: 'local' as const }));

    const allNotes = [...cloudNotes, ...localNotes];

    if (allNotes.length === 0) return;

    const recent = allNotes.sort(
      (a, b) =>
        new Date(b.note.updatedAt).getTime() -
        new Date(a.note.updatedAt).getTime()
    )[0];

    if (recent) {
      await this.onNoteSelected({ note: recent.note, source: recent.source });
    }
  }

  #getAllNotesRecursive(folder: Folder): Note[] {
    let notes = [...folder.notes];
    for (const sub of folder.subfolders) {
      notes = notes.concat(this.#getAllNotesRecursive(sub));
    }
    return notes;
  }

  async onNoteSelected(event: { note: Note; source: 'cloud' | 'local' }) {
    const { note, source } = event;
    if (this.selectedNote()?.id === note.id) return;

    if (this.isDirty()) {
      await this.saveCurrentNote();
    }

    const requestId = ++this.#lastLoadRequestId;
    this.isLoadingNote.set(true);

    this.canvas()?.toolstate.remove();
    await this.saveCurrentNote();

    if (requestId !== this.#lastLoadRequestId) return;

    this.selectedFolderId.set(note.parentFolderId);

    const path = await this.#folderService.getFolderPath(
      note.parentFolderId,
      source
    );
    this.#router.navigate([...path, note.title]);

    const folders = await this.#folderService.getFolders(source);
    if (requestId !== this.#lastLoadRequestId) return;

    const freshNote = this.#findNoteRecursive(folders, note.id);

    if (freshNote) {
      await this.loadNote(freshNote, source, requestId);
    } else {
      this.isLoadingNote.set(false);
    }
  }

  #findNoteRecursive(folders: Folder[], noteId: string): Note | undefined {
    for (const f of folders) {
      const n = f.notes.find(note => note.id === noteId);
      if (n) return n;
      const subN = this.#findNoteRecursive(f.subfolders, noteId);
      if (subN) return subN;
    }
    return undefined;
  }

  // Checks if candidateId is an ancestor of currentFolderId in the loaded cloud folder tree.
  #isAncestorFolder(candidateId: string, currentFolderId: string): boolean {
    const findParent = (folders: Folder[], targetId: string): string | null => {
      for (const f of folders) {
        if (f.subfolders.some(sf => sf.id === targetId)) return f.id;
        const deeper = findParent(f.subfolders, targetId);
        if (deeper) return deeper;
      }
      return null;
    };

    const cloudFolders = this.overviewSidebar()?.cloudFolders() ?? [];
    let folderId: string | null = currentFolderId;
    while (folderId) {
      if (folderId === candidateId) return true;
      folderId = findParent(cloudFolders, folderId);
    }
    return false;
  }

  async onFolderSelected(event: {
    folderId: string;
    source: 'cloud' | 'local';
  }) {
    const { folderId, source } = event;
    const isNoteActive = !!this.selectedNote();

    if (!folderId) {
      this.selectedFolderId.set('');
      if (isNoteActive) {
        this.overviewSidebar()?.resetToRoot(false);
      } else {
        await this.#router.navigateByUrl('/');
      }
      return;
    }

    this.selectedFolderId.set(folderId);
    if (isNoteActive) {
      await this.overviewSidebar()?.navigateToFolder(folderId, source);
    } else {
      const path = await this.#folderService.getFolderPath(folderId, source);
      const targetUrl = '/' + path.join('/') + '/';

      const currentUrl = decodeURIComponent(this.#router.url.split('?')[0]);
      if (currentUrl === targetUrl || currentUrl === targetUrl.slice(0, -1)) {
        if (currentUrl !== targetUrl) {
          await this.#router.navigateByUrl(targetUrl);
        }
      } else {
        await this.#router.navigateByUrl(targetUrl);
      }
    }
  }

  async loadNote(note: Note, source: 'cloud' | 'local', requestId?: number) {
    const currentRequestId = requestId ?? ++this.#lastLoadRequestId;
    this.isLoadingNote.set(true);

    let fullNote = note;
    const isOffline = this.settingsService.isOfflineMode();

    if (
      source === 'cloud' &&
      (isOffline ||
        !note.content ||
        (note.content.drawings.length === 0 &&
          note.content.shapes.length === 0))
    ) {
      const fetchedNote = await this.#notesService.getNote(note.id, source);
      if (fetchedNote) {
        fullNote = fetchedNote;
      }
    } else if (source === 'local') {
      const fetchedNote = await this.#notesService.getNote(note.id, source);
      if (fetchedNote) {
        fullNote = fetchedNote;
      }
    }

    if (currentRequestId !== this.#lastLoadRequestId) return;

    this.selectedNote.set(fullNote);
    this.selectedNoteSource.set(source);
    this.lastActiveNote.set(fullNote);
    this.isDirty.set(false);
    const canvas = this.canvas();

    if (canvas) {
      if (fullNote.content) {
        await canvas.loadCanvasData(
          fullNote.content.shapes ?? [],
          fullNote.content.drawings ?? [],
          fullNote.viewPosition
            ? [fullNote.viewPosition.x, fullNote.viewPosition.y]
            : [window.innerWidth / 2, window.innerHeight / 2],
          fullNote.zoomScale
        );
      }

      canvas.setNoteId(source === 'cloud' ? fullNote.id : '');
    }

    if (source === 'cloud') {
      try {
        await this.#canvasConnection.joinNote(fullNote.id);
      } catch (error) {
        console.error('Failed to join note in canvas hub:', error);
      }
    }

    if (currentRequestId === this.#lastLoadRequestId) {
      this.isLoadingNote.set(false);
    }
  }

  async onCanvasChanged() {
    this.isDirty.set(true);
    this.#saveSubject$.next();
  }

  onLocalActionEmitted(action: CanvasAction) {
    const note = this.selectedNote();
    const source = this.selectedNoteSource();
    if (!note || source !== 'cloud') return;

    this.#canvasActionEmitter.emitAction(note.id, action).catch(error => {
      console.error('Failed to broadcast local action:', error);
    });
  }

  async onTeleport(presence: PresenceInfo) {
    const latestPresence = this.#canvasConnection
      .presenceList()
      .find(p => p.clientId === presence.clientId);

    if (!latestPresence) {
      return;
    }

    const {
      clientId,
      noteId,
      cursorPosition: _cursorPosition,
    } = latestPresence;

    if (noteId && noteId !== this.selectedNote()?.id) {
      const folders = await this.#folderService.getFolders('cloud');
      const findNote = (f: Folder[]): Note | null => {
        for (const folder of f) {
          const note = folder.notes.find(n => n.id === noteId);
          if (note) return note;
          const subNote = findNote(folder.subfolders);
          if (subNote) return subNote;
        }
        return null;
      };

      const targetNote = findNote(folders);
      if (targetNote) {
        this.onNoteSelected({ note: targetNote, source: 'cloud' });
        let retryCount = 0;
        while (!this.canvas() && retryCount < 10) {
          await new Promise(resolve => setTimeout(resolve, 200));
          retryCount++;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.warn(
          'Teleport note switch failed. Note not found in hierarchy'
        );
      }
    }

    const finalPresence =
      this.#canvasConnection
        .presenceList()
        .find(p => p.clientId === clientId) || latestPresence;
    const canvas = this.canvas();
    if (canvas) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const newOriginX =
        viewportWidth / 2 - finalPresence.cursorPosition.x * canvas.scale;
      const newOriginY =
        viewportHeight / 2 - finalPresence.cursorPosition.y * canvas.scale;

      canvas.origin = [newOriginX, newOriginY];
      canvas.renderCanvas({ transformed: true });
    }
  }

  async saveCurrentNote() {
    const targetNote = this.selectedNote() || this.lastActiveNote();
    const source = this.selectedNoteSource();
    const canvas = this.canvas();

    if (!targetNote || !canvas || !this.isDirty() || !source) return;

    const note = new Note({
      ...targetNote,
      parentFolderId: targetNote.parentFolderId,
      viewPosition: { x: canvas.origin[0], y: canvas.origin[1] },
      zoomScale: canvas.scale,
    });

    if (source === 'local') {
      note.content = new NoteContent({
        shapes: canvas.shapes.map(s => canvas.shapeSerializer.serialized(s)),
        drawings: canvas.drawings.map(d =>
          canvas.drawingSerializer.serialized(d)
        ),
      });
    }

    await this.#notesService.updateNoteContent(
      note,
      source,
      source === 'local'
    );
    this.isDirty.set(false);
  }

  openSettings() {
    this.#dialog.open(DialogSettingsComponent, {
      width: '400px',
      maxWidth: '95vw',
    });
  }

  async handleModeTransition() {
    this.selectedNote.set(null);
    this.selectedNoteSource.set(null);
    this.selectedFolderId.set('');

    const canvas = this.canvas();
    if (canvas) {
      canvas.toolstate.remove();
      await canvas.loadCanvasData(
        [],
        [],
        [window.innerWidth / 2, window.innerHeight / 2],
        1
      );
    }

    this.updateGlobalNoteStatus();
    this.overviewSidebar()?.loadFolders();
    this.overviewSidebar()?.resetToRoot();

    if (this.#router.url !== '/') {
      await this.#router.navigateByUrl('/');
    }
  }

  getBackendEnabled() {
    return environment.backendEnabled;
  }
}
