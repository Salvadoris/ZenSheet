import { Injectable } from '@angular/core';
import { Delta } from 'quill';

import { Folder, Note } from '../interfaces/note.model';

@Injectable({
  providedIn: 'root',
})
export class NotesService {
  #storageKey = 'folders';

  getFolders(): Folder[] {
    const folders = localStorage.getItem(this.#storageKey);
    if (!folders) return [];

    const parsedFolders = JSON.parse(folders);

    return parsedFolders.map((folder: Folder) => ({
      ...folder,
      notes: folder.notes.map((note: Note) => ({
        ...note,
        content: note.content ? new Delta(note.content) : null,
        updatedAt: new Date(note.updatedAt),
      })),
    }));
  }

  saveFolders(folders: Folder[]) {
    const serializedFolders = folders.map(folder => ({
      ...folder,
      notes: folder.notes.map(note => ({
        ...note,
        content: note.content ? note.content.ops : null,
        updatedAt: note.updatedAt.toISOString(),
      })),
    }));

    localStorage.setItem(this.#storageKey, JSON.stringify(serializedFolders));
  }

  createFolder(name: string): Folder {
    const folder: Folder = { id: crypto.randomUUID(), name, notes: [] };
    const folders = this.getFolders();
    folders.push(folder);
    this.saveFolders(folders);
    return folder;
  }

  createNote(folderId: string, title: string): Note {
    const note: Note = {
      id: crypto.randomUUID(),
      parentFolderId: folderId,
      title: title,
      content: new Delta(),
      updatedAt: new Date(),
    };
    const folders = this.getFolders().map(f =>
      f.id === folderId ? { ...f, notes: [note, ...f.notes] } : f
    );
    this.saveFolders(folders);
    return note;
  }

  deleteNote(folderId: string, noteId: string) {
    const folders = this.getFolders().map(f =>
      f.id === folderId
        ? { ...f, notes: f.notes.filter(n => n.id !== noteId) }
        : f
    );
    this.saveFolders(folders);
  }

  updateNoteContent(folderId: string, noteId: string, content: Delta) {
    console.log('updateNoteContent', folderId, noteId, content);
    const folders = this.getFolders().map(f => {
      if (f.id === folderId) {
        return {
          ...f,
          notes: f.notes.map(n =>
            n.id === noteId
              ? { ...n, content: content, updatedAt: new Date() }
              : n
          ),
        };
      }
      return f;
    });
    this.saveFolders(folders);
  }

  updateNoteTitle(folderId: string, noteId: string, title: string) {
    const folders = this.getFolders().map(f => {
      if (f.id === folderId) {
        return {
          ...f,
          notes: f.notes.map(n =>
            n.id === noteId ? { ...n, title, updatedAt: new Date() } : n
          ),
        };
      }
      return f;
    });
    this.saveFolders(folders);
  }

  deleteFolder(folderId: string) {
    const folders = this.getFolders().filter(f => f.id !== folderId);
    this.saveFolders(folders);
  }

  renameFolder(folderId: string, name: string) {
    const folders = this.getFolders().map(f =>
      f.id === folderId ? { ...f, name } : f
    );
    this.saveFolders(folders);
  }

  updateFolderColor(folderId: string, color: string) {
    const folders = this.getFolders().map(f =>
      f.id === folderId ? { ...f, color } : f
    );
    this.saveFolders(folders);
  }
}
