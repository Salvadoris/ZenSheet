import { CommonModule } from '@angular/common';
import { Component, signal, inject, OnInit, viewChild } from '@angular/core';

import { CanvasComponent } from './layout/canvas/canvas.component';
import { DetailSidebar } from './layout/detail-sidebar/detail-sidebar.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { ToolbarComponent } from './layout/toolbar/toolbar.component';
import { Note } from './models/note.model';
import { NotesService } from './services/notes.service';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    SidebarComponent,
    ToolbarComponent,
    CanvasComponent,
    DetailSidebar,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected title = 'ZenSheet';
  #notesService = inject(NotesService);

  canvas = viewChild<CanvasComponent>('canvas');
  sidebar = viewChild<SidebarComponent>('sidebar');

  selectedNote = signal<Note | null>(null);
  selectedFolderId = signal<string>('');
  isDirty = signal<boolean>(false);
  isLoadingNote = signal<boolean>(false);

  #lastLoadRequestId = 0;

  async hasNotes(): Promise<boolean> {
    const folders = await this.#notesService.getFolders();
    return folders.some(folder => folder.notes.length > 0);
  }

  async mostRecentNote(): Promise<Note | null> {
    const folders = await this.#notesService.getFolders();
    const allNotes = folders.flatMap(folder => folder.notes);

    if (allNotes.length === 0) return null;

    return allNotes.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];
  }

  async ngOnInit() {
    if (!this.selectedNote() && (await this.hasNotes())) {
      const recentNote = await this.mostRecentNote();
      if (recentNote) {
        this.selectedFolderId.set(recentNote.parentFolderId);
        await this.loadNote(recentNote);
        const sidebar = this.sidebar?.();
        if (sidebar) {
          await sidebar.openFolderAndSelectNote(
            recentNote.parentFolderId,
            recentNote
          );
        }
      }
    }
  }

  async refreshSelectedNote() {
    const currentNote = this.selectedNote();
    if (!currentNote) return;

    const folders = await this.#notesService.getFolders();
    const updatedNote = folders
      .flatMap(folder => folder.notes)
      .find(note => note.id === currentNote.id);

    if (updatedNote) {
      this.selectedNote.set(updatedNote);
    }
  }

  async onNoteSelected(note: Note) {
    const requestId = ++this.#lastLoadRequestId;
    this.isLoadingNote.set(true);

    this.canvas()?.toolstate.remove();
    await this.saveCurrentNote();

    if (requestId !== this.#lastLoadRequestId) return;

    this.selectedFolderId.set(note.parentFolderId);

    const folders = await this.#notesService.getFolders();
    if (requestId !== this.#lastLoadRequestId) return;

    const freshNote = folders
      .flatMap(folder => folder.notes)
      .find(n => n.id === note.id);

    if (freshNote) {
      await this.loadNote(freshNote, requestId);
    } else {
      this.isLoadingNote.set(false);
    }
  }

  async loadNote(note: Note, requestId?: number) {
    const currentRequestId = requestId ?? ++this.#lastLoadRequestId;
    this.isLoadingNote.set(true);

    this.selectedNote.set(note);
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
    const currentNote = this.selectedNote();
    const canvas = this.canvas();

    if (!currentNote || !canvas || !this.isDirty()) return;

    const note = new Note({
      ...currentNote,
      parentFolderId: this.selectedFolderId() || currentNote.parentFolderId,
      content: canvas.getCanvasData(),
    });
    await this.#notesService.updateNoteContent(note);
    this.isDirty.set(false);
  }
}
