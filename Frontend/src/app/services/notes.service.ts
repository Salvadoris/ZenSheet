import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';
import { SerializedDrawing } from '../layout/canvas/Serializer/DrawingSerializer';
import { SerializedShape } from '../layout/canvas/Serializer/ShapeSerializer';
import { Note, NoteContent } from '../models/note.model';
import { generateUuid } from '../utils/uuid';


import { apiEndpoints } from './api-endpoints';
import { FolderService } from './folder.service';
import { SettingsService } from './settings.service';
import { StorageService } from './storage.service';


// TODO temp interface
interface BackendNoteResponse {
  id: string;
  parentFolderId: string;
  title: string;
  content: {
    drawings: unknown[];
    shapes: unknown[];
  };
  viewPosition?: { x: number; y: number };
  zoomScale: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotesService {
  #http = inject(HttpClient);
  #storageService = inject(StorageService);
  #folderService = inject(FolderService);
  #settingsService = inject(SettingsService);
  
  readonly #apiUrl = `${environment.apiBaseUrl}${apiEndpoints.Note}`;
  #clientId = '';

  constructor() {
    this.#initClientId();
    console.log('[NotesService] Initialized with Dual Storage support');
  }

  #initClientId() {
    const key = 'zensheet_client_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = generateUuid();
      localStorage.setItem(key, id);
    }
    this.#clientId = id;
    console.log('[NotesService] 🆔 Client ID:', this.#clientId);
  }

  async createNote(folderId: string, title: string, source: 'cloud' | 'local' = 'cloud'): Promise<string> {
    if (source === 'cloud' && !this.#settingsService.isOfflineMode()) {
      const response = await firstValueFrom(this.#http.post<{ id: string }>(`${this.#apiUrl}`, {
        title,
        parentFolderId: folderId,
      }));

      if (!response?.id) {
        throw new Error('No response from backend');
      }

      return response.id;
    } else {
      const id = generateUuid();
      const note = new Note({
        id,
        parentFolderId: folderId,
        title,
        content: new NoteContent({}),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      // In local mode, notes are stored within folders in FolderService
      await this.#folderService.addNoteToLocalFolder(folderId, note);
      return id;
    }
  }

  async deleteNote(folderId: string, noteId: string, source: 'cloud' | 'local' = 'cloud'): Promise<void> {
    if (source === 'local' || this.#settingsService.isOfflineMode()) {
       await this.#folderService.removeNoteFromLocalFolder(folderId, noteId);
       return;
    }
    try {
      await firstValueFrom(this.#http.delete(`${this.#apiUrl}/${noteId}`));
    } catch (error) {
      console.error('Failed to delete note on backend:', error);
      throw error;
    }
  }

  async updateNoteTitle(
    folderId: string,
    noteId: string,
    title: string,
    source: 'cloud' | 'local' = 'cloud'
  ): Promise<void> {
    if (source === 'local' || this.#settingsService.isOfflineMode()) {
      // We need the full note to update it in the folder
      const note: Note | null = await this.getNote(noteId, source);
      if (note) {
        note.title = title;
        await this.#folderService.updateNoteInLocalFolder(folderId, note);
      }
      return;
    }
    try {
      await firstValueFrom(this.#http.put(`${this.#apiUrl}/${noteId}/title`, { title }));
    } catch (error) {
      console.error('Failed to update note title on backend:', error);
      throw error;
    }
  }

  async getNote(noteId: string, source: 'cloud' | 'local' = 'cloud'): Promise<Note | null> {
    if (source === 'local' || this.#settingsService.isOfflineMode()) {
      return this.#storageService.load<Note>(`note_${noteId}`);
    }
    try {
      const response = await firstValueFrom(this.#http.get<BackendNoteResponse>(`${this.#apiUrl}/${noteId}`, {
        params: { clientId: this.#clientId }
      }));
      if (!response) return null;

      return new Note({
        id: response.id,
        parentFolderId: response.parentFolderId,
        title: response.title,
        content: new NoteContent({
          drawings: response.content.drawings as SerializedDrawing[],
          shapes: response.content.shapes as SerializedShape[],
        }),
        viewPosition: response.viewPosition,
        zoomScale: response.zoomScale,
      });
    } catch (error) {
      console.error('Failed to fetch note from backend:', error);
      return null;
    }
  }

  async updateNoteContent(note: Note, source: 'cloud' | 'local' = 'cloud', includeContent = false): Promise<void> {
    if (source === 'cloud' && !this.#settingsService.isOfflineMode()) {
      console.log(`[NotesService] Saving note ${includeContent ? 'content' : 'metadata'} to backend:`, note.id);
      
      const payload: {
        clientId: string;
        zoomScale: number;
        viewPosition: number[] | null;
        content?: NoteContent;
      } = {
        clientId: this.#clientId,
        zoomScale: note.zoomScale,
        viewPosition: note.viewPosition ? [Number(note.viewPosition.x.toFixed(2)), Number(note.viewPosition.y.toFixed(2))] : null
      };

      if (includeContent) {
        payload.content = note.content;
      }

      await firstValueFrom(this.#http.put(
        `${this.#apiUrl}/${note.id}/content`,
        payload
      ));
    } else {
      console.log('[NotesService] Saving note content to local storage:', note.id);
      await this.#storageService.save(`note_${note.id}`, note);

      // Also update it in the folder hierarchy for consistency
      await this.#folderService.updateNoteInLocalFolder(note.parentFolderId, note);
    }
  }

  async renameNote(noteId: string, name: string, folderId: string, source: 'cloud' | 'local' = 'cloud'): Promise<void> {
    await this.updateNoteTitle(folderId, noteId, name, source);
  }

  async copyNoteFromCloud(noteId: string, destFolderId: string): Promise<Note | null> {
    try {
      const response = await firstValueFrom(
        this.#http.post<BackendNoteResponse>(`${this.#apiUrl}/${noteId}/copy`, null, {
          params: { destinationFolderId: destFolderId }
        })
      );
      if (!response) return null;

      return new Note({
        id: response.id,
        parentFolderId: response.parentFolderId,
        title: response.title,
        content: new NoteContent({
          drawings: response.content.drawings as SerializedDrawing[],
          shapes: response.content.shapes as SerializedShape[],
        }),
        viewPosition: response.viewPosition,
        zoomScale: response.zoomScale,
      });
    } catch (error) {
      console.error('Failed to copy note on backend:', error);
      return null;
    }
  }

  async insertNoteFromLocal(noteData: unknown, destFolderId: string): Promise<Note | null> {
    try {
      const response = await firstValueFrom(
        this.#http.post<BackendNoteResponse>(`${this.#apiUrl}/local`, {
          destinationFolderId: destFolderId,
          noteData: noteData
        })
      );
      if (!response) return null;

      return new Note({
        id: response.id,
        parentFolderId: response.parentFolderId,
        title: response.title,
        content: new NoteContent({
           drawings: response.content.drawings as SerializedDrawing[],
           shapes: response.content.shapes as SerializedShape[],
        }),
        viewPosition: response.viewPosition,
        zoomScale: response.zoomScale,
      });
    } catch (error) {
       console.error('Failed to insert local note to backend:', error);
       return null;
    }
  }

  async exportNoteToLocal(noteId: string, source: 'cloud' | 'local'): Promise<void> {
    const note = await this.getNote(noteId, source);
    if (!note) return;
    
    // Create a plain object for serialization 
    const plainNote = {
      id: note.id,
      parentFolderId: note.parentFolderId,
      title: note.title,
      content: note.content,
      viewPosition: note.viewPosition,
      zoomScale: note.zoomScale,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    };

    const noteJson = JSON.stringify(plainNote, null, 2);
    const blob = new Blob([noteJson], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'Note'}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async pasteNote(noteId: string, source: 'cloud' | 'local', destFolderId: string, destSource: 'cloud' | 'local'): Promise<void> {
    if (source === 'cloud' && destSource === 'cloud') {
       await this.copyNoteFromCloud(noteId, destFolderId);
       return;
    }

    const note = await this.getNote(noteId, source);
    if (!note) return;

    if (destSource === 'cloud') {
       await this.insertNoteFromLocal(note, destFolderId);
    } else {
       const newNote = new Note({
         id: generateUuid(),
         parentFolderId: destFolderId,
         title: `${note.title} (Copy)`,
         content: new NoteContent({
           drawings: [...note.content.drawings],
           shapes: [...note.content.shapes],
         }),
         createdAt: new Date(),
         updatedAt: new Date(),
         zoomScale: note.zoomScale,
         viewPosition: note.viewPosition ? { ...note.viewPosition } : undefined
       });
       await this.#storageService.save(`note_${newNote.id}`, newNote);
       await this.#folderService.addNoteToLocalFolder(destFolderId, newNote);
    }
  }
}

