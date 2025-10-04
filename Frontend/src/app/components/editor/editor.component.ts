import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentChange, QuillEditorComponent } from 'ngx-quill';
import Quill from 'quill';

import { Note } from '../../interfaces/note.model';
import { NotesService } from '../../services/notes.service';

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

  readonly storedNote = signal<Note | null>(null);

  modules = {
    toolbar: '#quill-toolbar',
  };

  constructor() {
    effect(() => {
      const content = this.note().content;
      if (content && this.editor()?.quillEditor) {
        this.editor().quillEditor.setContents(content);
      }
    });
  }

  onEditorCreated(quill: Quill) {
    const content = this.note().content;
    if (content) {
      quill.setContents(content);
    }
  }

  onContentChanged(event: ContentChange) {
    if (event.source !== 'user') return;

    const editorComponent = this.editor();
    if (editorComponent && editorComponent.quillEditor) {
      const delta = editorComponent.quillEditor.getContents();
      this.#notesService.updateNoteContent(
        this.note().parentFolderId,
        this.note().id,
        delta
      );
    }
  }
}
