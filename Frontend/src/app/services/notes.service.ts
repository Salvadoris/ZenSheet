import { Injectable, inject } from '@angular/core';

import { Folder, Note } from '../models/note.model';

import { StorageService } from './storage.service';


@Injectable({
  providedIn: 'root',
})
export class NotesService {
  #storageService = inject(StorageService);
  
  #storageKey = 'folders';

  async getFolders(): Promise<Folder[]> {
    const folders = await this.#storageService.load<Folder[]>(this.#storageKey);
    if (!folders) return [];

    return folders.map((folder: Folder) => ({
      ...folder,
      notes: folder.notes.map((note: Note) => new Note(note)),
    }));
  }

  async saveFolders(folders: Folder[]): Promise<void> {
    const serializedFolders = folders.map(folder => ({
      ...folder,
      notes: folder.notes.map(note => ({
        ...note,
        updatedAt: note.updatedAt.toISOString(),
      })),
    }));

    await this.#storageService.save(this.#storageKey, serializedFolders);
  }

  async createFolder(name: string): Promise<Folder> {
    const folder: Folder = { id: crypto.randomUUID(), name, notes: [] };
    const folders = await this.getFolders();
    folders.push(folder);
    await this.saveFolders(folders);
    return folder;
  }

  async createNote(folderId: string, title: string): Promise<Note> {
    const note = new Note({
      parentFolderId: folderId,
      title: title,
    });

    const folders = (await this.getFolders()).map(f =>
      f.id === folderId ? { ...f, notes: [note, ...f.notes] } : f
    );
    await this.saveFolders(folders);
    return note;
  }

  async deleteNote(folderId: string, noteId: string): Promise<void> {
    const folders = (await this.getFolders()).map(f =>
      f.id === folderId
        ? { ...f, notes: f.notes.filter(n => n.id !== noteId) }
        : f
    );
    await this.saveFolders(folders);
  }

  async updateNoteContent(note: Note): Promise<void> {
    const folders = (await this.getFolders()).map(f => {
      if (f.id === note.parentFolderId) {
        return {
          ...f,
          notes: f.notes.map(n =>
            n.id === note.id
              ? { ...n, content: note.content, updatedAt: new Date() }
              : n
          ),
        };
      }
      return f;
    });
    await this.saveFolders(folders);
  }

  async updateNoteTitle(
    folderId: string,
    noteId: string,
    title: string
  ): Promise<void> {
    const folders = (await this.getFolders()).map(f => {
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
    await this.saveFolders(folders);
  }

  async deleteFolder(folderId: string): Promise<void> {
    const folders = (await this.getFolders()).filter(f => f.id !== folderId);
    await this.saveFolders(folders);
  }

  async renameFolder(folderId: string, name: string): Promise<void> {
    const folders = (await this.getFolders()).map(f =>
      f.id === folderId ? { ...f, name } : f
    );
    await this.saveFolders(folders);
  }

  async renameNote(noteId: string, name: string): Promise<void> {
    const folders = (await this.getFolders()).map(f => ({
      ...f,
      notes: f.notes.map(n =>
        n.id === noteId ? { ...n, title: name, updatedAt: new Date() } : n
      ),
    }));
    await this.saveFolders(folders);
  }

  async updateFolderColor(folderId: string, color: string): Promise<void> {
    const folders = (await this.getFolders()).map(f =>
      f.id === folderId ? { ...f, color } : f
    );
    await this.saveFolders(folders);
  }
}
