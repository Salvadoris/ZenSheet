import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';
import { Folder, Note, NoteContent } from '../models/note.model';
import { generateUuid } from '../utils/uuid';

import { apiEndpoints } from './api-endpoints';
import { SettingsService } from './settings.service';
import { StorageService } from './storage.service';

interface BackendNote {
  id: string;
  parentFolderId: string;
  title: string;
  content?: unknown;
  createdAt: string;
  updatedAt: string;
}

interface BackendFolder {
  id: string;
  name: string;
  parentFolderId: string | null;
  color?: string;
  notes?: BackendNote[];
  subfolders?: BackendFolder[];
}

@Injectable({
  providedIn: 'root',
})
export class FolderService {
  #storageService = inject(StorageService);
  #settingsService = inject(SettingsService);
  #http = inject(HttpClient);
  
  #storageKey = 'folders';
  #apiUrl = `${environment.apiBaseUrl}${apiEndpoints.Folder}`;
  #localFoldersCache: Folder[] | null = null;

  async getFolders(source: 'cloud' | 'local' = 'cloud'): Promise<Folder[]> {
    if (source === 'cloud') {
      if (this.#settingsService.isOfflineMode()) {
        return [];
      }

      try {
        const response = await firstValueFrom(this.#http.get<BackendFolder[]>(`${this.#apiUrl}/hierarchy`));
        return this.#mapHierarchyResponse(response || []);
      } catch (error) {
        console.error('[FolderService] Failed to fetch cloud folders:', error);
        return [];
      }
    } else {
      if (this.#localFoldersCache) {
        return this.#localFoldersCache;
      }

      const folders = await this.#storageService.load<Folder[]>(this.#storageKey);
      this.#localFoldersCache = this.#mapFoldersRecursive(folders || []);
      return this.#localFoldersCache;
    }
  }

  async getItemByPath(path: string[]): Promise<{ folder: Folder | null, note: Note | null, source: 'cloud' | 'local' | null }> {
    if (path.length === 0) return { folder: null, note: null, source: null };

    const firstSegment = path[0].toLowerCase();
    let source: 'cloud' | 'local' = 'cloud';
    let segments = path;

    if (firstSegment === 'cloud') {
      source = 'cloud';
      segments = path.slice(1);
    } else if (firstSegment === 'local') {
      source = 'local';
      segments = path.slice(1);
    }

    if (source === 'cloud') {
      const queryParams = segments.map(s => `path=${encodeURIComponent(s)}`).join('&');
      try {
        const response = await firstValueFrom(this.#http.get<{ folderId: string | null, noteId: string | null }>(
          `${this.#apiUrl}/resolve-path?${queryParams}`
        ));

        const folders = await this.getFolders('cloud');
        let foundFolder: Folder | null = null;
        let foundNote: Note | null = null;

        if (response.noteId) {
          foundNote = this.#findNoteRecursive(folders, response.noteId);
        } else if (response.folderId) {
          foundFolder = this.#findFolderRecursive(folders, response.folderId);
        }

        return { folder: foundFolder, note: foundNote, source };
      } catch (error) {
        console.error('Failed to resolve cloud path:', error);
        return { folder: null, note: null, source };
      }
    }

    const folders = await this.getFolders(source);
    let currentFolders = folders;
    let currentFolder: Folder | null = null;

    if (segments.length === 0) return { folder: null, note: null, source };

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const isLast = i === segments.length - 1;

      const folder = currentFolders.find(f => f.name === segment);
      let note: Note | undefined;

      if (isLast) {
        if (currentFolder) {
          note = currentFolder.notes.find(n => n.title === segment);
        } else {
          for (const f of folders) {
              const rootNote = f.notes.find(n => n.title === segment && (!n.parentFolderId || n.parentFolderId === '00000000-0000-0000-0000-000000000000'));
              if (rootNote) {
                  note = rootNote;
                  break;
              }
          }
        }
      }

      if (folder) {
        if (isLast) return { folder, note: note || null, source };
        currentFolder = folder;
        currentFolders = folder.subfolders;
        continue;
      }

      if (isLast && note) {
        return { folder: null, note, source };
      }

      break;
    }


    return { folder: null, note: null, source };
  }

  async getFolderPath(folderId: string, source: 'cloud' | 'local'): Promise<string[]> {
    const folders = await this.getFolders(source);
    const path: string[] = [source === 'cloud' ? 'Cloud' : 'Local'];
    this.#findPathRecursive(folders, folderId, path);
    return path;
  }

  async getTotalNotesCount(): Promise<number> {
    const cloudFolders = await this.getFolders('cloud');
    const localFolders = await this.getFolders('local');
    const cloudCount = cloudFolders.reduce((acc, folder) => acc + this.#countNotesRecursive(folder), 0);
    const localCount = localFolders.reduce((acc, folder) => acc + this.#countNotesRecursive(folder), 0);
    return cloudCount + localCount;
  }

  async createFolder(name: string, parentFolderId?: string, source: 'cloud' | 'local' = 'cloud'): Promise<void> {
    if (source === 'cloud' && !this.#settingsService.isOfflineMode()) {
      await firstValueFrom(this.#http.post<void>(`${this.#apiUrl}/folder`, {
        name,
        parentFolderId: parentFolderId || null
      }));
      
      return;
    } else {
      const folder: Folder = { 
        id: generateUuid(), 
        name, 
        notes: [], 
        subfolders: [],
        parentFolderId 
      };
      
      const folders = await this.getFolders('local');
      if (parentFolderId) {
        this.#updateFolderRecursive(folders, parentFolderId, f => {
          f.subfolders.push(folder);
        });
      } else {
        folders.push(folder);
      }
      
      await this.saveLocalFolders(folders);
      return;
    }
  }

  async deleteFolder(folderId: string, source: 'cloud' | 'local' = 'cloud'): Promise<void> {
    if (source === 'cloud' && !this.#settingsService.isOfflineMode()) {
      await firstValueFrom(this.#http.delete(`${this.#apiUrl}/folder/${folderId}`));
      return;
    }

    let folders = await this.getFolders('local');
    if (folders.some(f => f.id === folderId)) {
      folders = folders.filter(f => f.id !== folderId);
    } else {
      this.#findAndRemoveFolderRecursive(folders, folderId);
    }
    await this.saveLocalFolders(folders);
  }

  async renameFolder(folderId: string, name: string, source: 'cloud' | 'local' = 'cloud'): Promise<void> {
    if (source === 'cloud' && !this.#settingsService.isOfflineMode()) {
      await firstValueFrom(this.#http.put(`${this.#apiUrl}/folder/${folderId}`, { name }));
      return;
    }

    const folders = await this.getFolders('local');
    this.#updateFolderRecursive(folders, folderId, f => {
      f.name = name;
    });
    await this.saveLocalFolders(folders);
  }

  async updateFolderColor(folderId: string, color: string, source: 'cloud' | 'local' = 'cloud'): Promise<void> {
    if (source === 'cloud' && !this.#settingsService.isOfflineMode()) {
      await firstValueFrom(this.#http.put(`${this.#apiUrl}/folder/${folderId}`, { color }));
      return;
    }

    const folders = await this.getFolders('local');
    this.#updateFolderRecursive(folders, folderId, f => {
      f.color = color;
    });
    await this.saveLocalFolders(folders);
  }

  async saveLocalFolders(folders: Folder[]): Promise<void> {
    this.#localFoldersCache = folders;
    const serializedFolders = this.#serializeFoldersRecursive(folders);
    await this.#storageService.save(this.#storageKey, serializedFolders);
  }

  async addNoteToLocalFolder(folderId: string, note: Note): Promise<void> {
    const folders = await this.getFolders('local');
    this.#updateFolderRecursive(folders, folderId, f => {
      f.notes.push(note);
    });
    await this.saveLocalFolders(folders);
  }

  async removeNoteFromLocalFolder(folderId: string, noteId: string): Promise<void> {
    const folders = await this.getFolders('local');
    this.#updateFolderRecursive(folders, folderId, f => {
      f.notes = f.notes.filter(n => n.id !== noteId);
    });
    await this.saveLocalFolders(folders);
  }

  async updateNoteInLocalFolder(folderId: string, note: Note): Promise<void> {
    const folders = await this.getFolders('local');
    this.#updateFolderRecursive(folders, folderId, f => {
      const index = f.notes.findIndex(n => n.id === note.id);
      if (index !== -1) {
        f.notes[index] = note;
      }
    });
    await this.saveLocalFolders(folders);
  }

  #mapHierarchyResponse(folders: BackendFolder[]): Folder[] {
    return folders.map(f => ({
      id: f.id,
      name: f.name,
      parentFolderId: f.parentFolderId ?? undefined,
      color: f.color,
      notes: (f.notes || []).map((n: BackendNote) => new Note({
        id: n.id,
        parentFolderId: n.parentFolderId,
        title: n.title,
        content: new NoteContent(n.content as Partial<NoteContent> || {}),
        createdAt: new Date(n.createdAt),
        updatedAt: new Date(n.updatedAt),
      })),
      subfolders: this.#mapHierarchyResponse(f.subfolders || [])
    }));
  }

  #mapFoldersRecursive(folders: Folder[]): Folder[] {
    return folders.map((folder: Folder) => ({
      ...folder,
      subfolders: this.#mapFoldersRecursive(folder.subfolders || []),
      notes: (folder.notes || []).map((note: Note) => new Note(note)),
    }));
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

  #findNoteRecursive(folders: Folder[], noteId: string): Note | null {
    for (const folder of folders) {
      const note = folder.notes.find(n => n.id === noteId);
      if (note) return note;
      const subNote = this.#findNoteRecursive(folder.subfolders, noteId);
      if (subNote) return subNote;
    }
    return null;
  }

  #findFolderRecursive(folders: Folder[], folderId: string): Folder | null {
    for (const folder of folders) {
      if (folder.id === folderId) return folder;
      const subFolder = this.#findFolderRecursive(folder.subfolders, folderId);
      if (subFolder) return subFolder;
    }
    return null;
  }
}
