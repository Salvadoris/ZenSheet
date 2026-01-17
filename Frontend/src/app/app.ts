import { CommonModule } from '@angular/common';
import { Component, signal, inject, OnInit, viewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

import { CanvasComponent } from './layout/canvas/canvas.component';
import { DetailSidebar } from './layout/detail-sidebar/detail-sidebar.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { ToolbarComponent } from './layout/toolbar/toolbar.component';
import { ZoomIndicatorComponent } from './layout/zoom-indicator/zoom-indicator.component';
import { Note, Folder } from './models/note.model';
import { NotesService } from './services/notes.service';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    SidebarComponent,
    ToolbarComponent,
    CanvasComponent,
    DetailSidebar,
    ZoomIndicatorComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected title = 'ZenSheet';
  #notesService = inject(NotesService);
  #router = inject(Router);

  canvas = viewChild<CanvasComponent>('canvas');
  sidebar = viewChild<SidebarComponent>('sidebar');

  selectedNote = signal<Note | null>(null);
  selectedFolderId = signal<string>('');
  isDirty = signal<boolean>(false);
  isLoadingNote = signal<boolean>(false);
  hasNotes = signal<boolean>(true);
  lastActiveNote = signal<Note | null>(null);

  #lastLoadRequestId = 0;

  ngOnInit() {
    this.updateGlobalNoteStatus();
    this.#router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        )
      )
      .subscribe(() => this.#syncWithUrl());

    if (this.#router.navigated) {
      this.#syncWithUrl();
    }
  }

  async updateGlobalNoteStatus() {
    const count = await this.#notesService.getTotalNotesCount();
    this.hasNotes.set(count > 0);
  }

  async #syncWithUrl() {
    const url = decodeURIComponent(this.#router.url);
    if (url === '/') {
      await this.#loadDefaultNote();
      return;
    }

    const path = url.split('/').filter(s => s.length > 0);
    const { folder, note } = await this.#notesService.getItemByPath(path);

    if (note) {
      if (this.selectedNote()?.id !== note.id) {
        this.selectedFolderId.set(note.parentFolderId);
        await this.loadNote(note);
        await this.sidebar()?.navigateToFolder(note.parentFolderId, note);
      }
    } else if (folder) {
      this.selectedFolderId.set(folder.id);
      this.selectedNote.set(null);
      await this.sidebar()?.navigateToFolder(folder.id);
    } else {
      await this.#loadDefaultNote();
    }
  }

  async #loadDefaultNote() {
    if (this.selectedNote()) return;

    const folders = await this.#notesService.getFolders();
    const allNotes = folders.flatMap(f => this.#getAllNotesRecursive(f));

    if (allNotes.length === 0) return;

    const recentNote = allNotes.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];

    if (recentNote) {
      await this.onNoteSelected(recentNote);
    }
  }

  #getAllNotesRecursive(folder: Folder): Note[] {
    let notes = [...folder.notes];
    for (const sub of folder.subfolders) {
      notes = notes.concat(this.#getAllNotesRecursive(sub));
    }
    return notes;
  }

  async onNoteSelected(note: Note) {
    if (this.selectedNote()?.id === note.id) return;

    const requestId = ++this.#lastLoadRequestId;
    this.isLoadingNote.set(true);

    this.canvas()?.toolstate.remove();
    await this.saveCurrentNote();

    if (requestId !== this.#lastLoadRequestId) return;

    this.selectedFolderId.set(note.parentFolderId);

    const path = await this.#notesService.getFolderPath(note.parentFolderId);
    this.#router.navigate([...path, note.title]);

    const folders = await this.#notesService.getFolders();
    if (requestId !== this.#lastLoadRequestId) return;

    const freshNote = this.#findNoteRecursive(folders, note.id);

    if (freshNote) {
      await this.loadNote(freshNote, requestId);
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

  async onFolderSelected(folderId: string) {
    this.selectedFolderId.set(folderId);
    const path = await this.#notesService.getFolderPath(folderId);
    const targetUrl = '/' + path.join('/');

    if (decodeURIComponent(this.#router.url) === targetUrl) {
      await this.#syncWithUrl();
    } else {
      await this.#router.navigate(path);
    }
  }

  async loadNote(note: Note, requestId?: number) {
    const currentRequestId = requestId ?? ++this.#lastLoadRequestId;
    this.isLoadingNote.set(true);

    this.selectedNote.set(note);
    this.lastActiveNote.set(note);
    this.isDirty.set(false);
    const canvas = this.canvas();

    if (canvas && note.content) {
      await canvas.loadCanvasData(
        note.content.shapes ?? [],
        note.content.drawings ?? [],
        note.content.origin,
        note.content.scale
      );
    }

    if (currentRequestId === this.#lastLoadRequestId) {
      this.isLoadingNote.set(false);
    }
  }

  async onCanvasChanged() {
    this.isDirty.set(true);
    await this.saveCurrentNote();
  }

  async saveCurrentNote() {
    const targetNote = this.selectedNote() || this.lastActiveNote();
    const canvas = this.canvas();

    if (!targetNote || !canvas || !this.isDirty()) return;

    const note = new Note({
      ...targetNote,
      parentFolderId: targetNote.parentFolderId,
      content: canvas.getCanvasData(),
    });
    await this.#notesService.updateNoteContent(note);
    this.isDirty.set(false);
  }
}
