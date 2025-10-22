import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentChange, QuillEditorComponent } from 'ngx-quill';
import Quill from 'quill';

import { Note } from '../../interfaces/note.model';
import { NotesService } from '../../services/notes.service';
interface QuillModules {
  toolbar: string;
}
@Component({
  selector: 'app-editor',
  imports: [CommonModule, QuillEditorComponent, FormsModule],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorComponent {
  #notesService = inject(NotesService);
  readonly editor = viewChild.required<QuillEditorComponent>('editor');
  readonly note = input.required<Note>();
  readonly modules: QuillModules = { toolbar: '#quill-toolbar' };
  constructor() {
    effect(() => {
      this.syncContentWithEditor();
    });
  }
  private syncContentWithEditor() {
    const currentNote = this.note();
    const editorComponent = this.editor();
    if (editorComponent?.quillEditor) {
      try {
        const folders = this.#notesService.getFolders();
        const note = folders
          .flatMap(folder => folder.notes)
          .find(note => note.id === currentNote.id);
        const content = note?.content || currentNote.content;
        if (content) {
          editorComponent.quillEditor.setContents(content);
        }
      } catch (error) {
        console.error('Failed to sync content with editor:', error);
      }
    }
  }
  onEditorCreated(quill: Quill) {
    const currentNote = this.note();
    try {
      const folders = this.#notesService.getFolders();
      const note = folders
        .flatMap(folder => folder.notes)
        .find(note => note.id === currentNote.id);
      const content = note?.content || currentNote.content;
      if (content) {
        quill.setContents(content);
      }
    } catch (error) {
      console.error('Failed to set initial content:', error);
    }
  }
  onContentChanged(event: ContentChange) {
    if (event.source !== 'user') return;
    this.updateNoteContent();
  }
  private updateNoteContent() {
    const editorComponent = this.editor();
    if (editorComponent?.quillEditor) {
      try {
        const delta = editorComponent.quillEditor.getContents();
        this.#notesService.updateNoteContent(
          this.note().parentFolderId,
          this.note().id,
          delta
        );
      } catch (error) {
        console.error('Failed to update note content:', error);
      }
    }
  }
}
