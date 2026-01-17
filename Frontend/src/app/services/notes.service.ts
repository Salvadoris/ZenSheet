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

    return this.#mapFoldersRecursive(folders);
  }

  #mapFoldersRecursive(folders: Folder[]): Folder[] {
    return folders.map((folder: Folder) => ({
      ...folder,
      subfolders: this.#mapFoldersRecursive(folder.subfolders || []),
      notes: (folder.notes || []).map((note: Note) => new Note(note)),
    }));
  }

  async saveFolders(folders: Folder[]): Promise<void> {
    const serializedFolders = this.#serializeFoldersRecursive(folders);
    await this.#storageService.save(this.#storageKey, serializedFolders);
  }

  #serializeFoldersRecursive(folders: Folder[]): Folder[] {
    return folders.map(folder => ({
      ...folder,
      subfolders: this.#serializeFoldersRecursive(folder.subfolders || []),
      notes: (folder.notes || []).map(note => ({
        ...note,
        updatedAt: note.updatedAt.toISOString(),
      }) as unknown as Note),
    }));
  }

  async createFolder(name: string, parentFolderId?: string): Promise<Folder> {
    const folder: Folder = { 
      id: crypto.randomUUID(), 
      name, 
      notes: [], 
      subfolders: [],
      parentFolderId 
    };
    
    const folders = await this.getFolders();
    if (parentFolderId) {
      this.#updateFolderRecursive(folders, parentFolderId, f => {
        f.subfolders.push(folder);
      });
    } else {
      folders.push(folder);
    }
    
    await this.saveFolders(folders);
    return folder;
  }

  async createNote(folderId: string, title: string): Promise<Note> {
    const note = new Note({
      parentFolderId: folderId,
      title: title,
    });

    const folders = await this.getFolders();
    this.#updateFolderRecursive(folders, folderId, f => {
      f.notes = [note, ...f.notes];
    });
    
    await this.saveFolders(folders);
    return note;
  }

  async deleteNote(folderId: string, noteId: string): Promise<void> {
    const folders = await this.getFolders();
    this.#updateFolderRecursive(folders, folderId, f => {
      f.notes = f.notes.filter(n => n.id !== noteId);
    });
    await this.saveFolders(folders);
  }

  async updateNoteContent(note: Note): Promise<void> {
    const folders = await this.getFolders();
    this.#updateFolderRecursive(folders, note.parentFolderId, f => {
      f.notes = f.notes.map(n =>
         n.id === note.id
           ? { ...n, content: note.content, updatedAt: new Date() }
           : n
       );
    });
    await this.saveFolders(folders);
  }

  async updateNoteTitle(
    folderId: string,
    noteId: string,
    title: string
  ): Promise<void> {
    const folders = await this.getFolders();
    this.#updateFolderRecursive(folders, folderId, f => {
      f.notes = f.notes.map(n =>
        n.id === noteId ? { ...n, title, updatedAt: new Date() } : n
      );
    });
    await this.saveFolders(folders);
  }

  async deleteFolder(folderId: string): Promise<void> {
    let folders = await this.getFolders();
    
    if (folders.some(f => f.id === folderId)) {
      folders = folders.filter(f => f.id !== folderId);
    } else {
      this.#findAndRemoveFolderRecursive(folders, folderId);
    }
    
    await this.saveFolders(folders);
  }

  async renameFolder(folderId: string, name: string): Promise<void> {
    const folders = await this.getFolders();
    this.#updateFolderRecursive(folders, folderId, f => {
      f.name = name;
    });
    await this.saveFolders(folders);
  }

  async renameNote(noteId: string, name: string): Promise<void> {
    const folders = await this.getFolders();
    this.#updateNoteRecursive(folders, noteId, n => {
      n.title = name;
      n.updatedAt = new Date();
    });
    await this.saveFolders(folders);
  }

  async updateFolderColor(folderId: string, color: string): Promise<void> {
    const folders = await this.getFolders();
    this.#updateFolderRecursive(folders, folderId, f => {
      f.color = color;
    });
    await this.saveFolders(folders);
  }

  #updateFolderRecursive(folders: Folder[], folderId: string, action: (f: Folder) => void): boolean {
    for (const folder of folders) {
      if (folder.id === folderId) {
        action(folder);
        return true;
      }
      if (folder.subfolders.length > 0) {
        if (this.#updateFolderRecursive(folder.subfolders, folderId, action)) {
          return true;
        }
      }
    }
    return false;
  }

  #findAndRemoveFolderRecursive(folders: Folder[], folderId: string): boolean {
    for (let i = 0; i < folders.length; i++) {
      if (folders[i].id === folderId) {
        folders.splice(i, 1);
        return true;
      }
      if (folders[i].subfolders.length > 0) {
        if (this.#findAndRemoveFolderRecursive(folders[i].subfolders, folderId)) {
          return true;
        }
      }
    }
    return false;
  }

  #updateNoteRecursive(folders: Folder[], noteId: string, action: (n: Note) => void): boolean {
    for (const folder of folders) {
      const note = folder.notes.find(n => n.id === noteId);
      if (note) {
        action(note);
        return true;
      }
      if (folder.subfolders.length > 0) {
        if (this.#updateNoteRecursive(folder.subfolders, noteId, action)) {
          return true;
        }
      }
    }
    return false;
  }

  async getItemByPath(path: string[]): Promise<{ folder: Folder | null, note: Note | null }> {
    const folders = await this.getFolders();
    let currentFolders = folders;
    let currentFolder: Folder | null = null;

    for (let i = 0; i < path.length; i++) {
      const segment = path[i];
      const isLast = i === path.length - 1;

      const folder = currentFolders.find(f => f.name === segment);
      let note: Note | undefined;

      if (isLast && currentFolder) {
        note = currentFolder.notes.find(n => n.title === segment);
      }

      if (folder) {
        if (isLast) return { folder, note: note || null };
        currentFolder = folder;
        currentFolders = folder.subfolders;
        continue;
      }

      if (isLast && note) {
        return { folder: null, note };
      }

      break;
    }

    return { folder: null, note: null };
  }

  async getFolderPath(folderId: string): Promise<string[]> {
    const folders = await this.getFolders();
    const path: string[] = [];
    this.#findPathRecursive(folders, folderId, path);
    return path;
  }

  async getTotalNotesCount(): Promise<number> {
    const folders = await this.getFolders();
    return folders.reduce((acc, folder) => acc + this.#countNotesRecursive(folder), 0);
  }

  #countNotesRecursive(folder: Folder): number {
    let count = folder.notes.length;
    for (const sub of folder.subfolders) {
      count += this.#countNotesRecursive(sub);
    }
    return count;
  }

  #findPathRecursive(folders: Folder[], folderId: string, path: string[]): boolean {
    for (const folder of folders) {
      path.push(folder.name);
      if (folder.id === folderId) return true;
      if (folder.subfolders.length > 0) {
        if (this.#findPathRecursive(folder.subfolders, folderId, path)) return true;
      }
      path.pop();
    }
    return false;
  }
}
