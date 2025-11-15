import { CommonModule } from '@angular/common';
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { QuillModule } from 'ngx-quill';

import { EditorComponent } from './components/editor/editor.component';
import { Note } from './interfaces/note.model';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { ToolbarComponent } from './layout/toolbar/toolbar.component';
import { NotesService } from './services/notes.service';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    SidebarComponent,
    ToolbarComponent,
    EditorComponent,
    QuillModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected title = 'ZenSheet';
  #notesService = inject(NotesService);

  selectedNote = signal<Note | null>(null);

  hasNotes = computed(() => {
    const folders = this.#notesService.getFolders();
    return folders.some(folder => folder.notes.length > 0);
  });

  mostRecentNote = computed(() => {
    const folders = this.#notesService.getFolders();
    const allNotes = folders.flatMap(folder => folder.notes);

    if (allNotes.length === 0) return null;

    return allNotes.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];
  });

  ngOnInit() {
    if (!this.selectedNote() && this.hasNotes()) {
      const recentNote = this.mostRecentNote();
      if (recentNote) {
        this.selectedNote.set(recentNote);
      }
    }
  }

  onNoteSelected(note: Note) {
    const folders = this.#notesService.getFolders();
    const selectedNote = folders
      .flatMap(folder => folder.notes)
      .find(n => n.id === note.id);

    this.selectedNote.set(selectedNote || note);
  }

  refreshSelectedNote() {
    const currentNote = this.selectedNote();
    if (!currentNote) return;

    const folders = this.#notesService.getFolders();
    const updatedNote = folders
      .flatMap(folder => folder.notes)
      .find(note => note.id === currentNote.id);

    if (updatedNote) {
      this.selectedNote.set(updatedNote);
    }
  }
}
