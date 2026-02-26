import { CommonModule } from '@angular/common';
import { Component, inject, output, signal } from '@angular/core';

import { Folder } from '../../models/note.model';
import { CanvasConnectionService, PresenceInfo } from '../../services/canvas-connection.service';
import { FolderService } from '../../services/folder.service';
import { SettingsService } from '../../services/settings.service';
import { getClientLabel, getColorFromClientId } from '../canvas/RemoteCursor';

@Component({
  selector: 'app-presence-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './presence-bar.component.html',
  styles: [`
    :host { display: block; }
  `]
})
export class PresenceBarComponent {
  #canvasConnection = inject(CanvasConnectionService);
  #folderService = inject(FolderService);
  #settingsService = inject(SettingsService);
  
  isOfflineMode = this.#settingsService.isOfflineMode;
  presenceList = this.#canvasConnection.presenceList;
  currentNoteId = this.#canvasConnection.currentNoteId;
  myClientId = this.#canvasConnection.clientId;
  trackedClientId = this.#canvasConnection.trackedClientId;
  folders = signal<Folder[]>([]);
  
  #holdTimer: ReturnType<typeof setTimeout> | undefined;
  #isHolding = false;

  constructor() {
    this.loadFolders();
  }

  async loadFolders() {
    const folders = await this.#folderService.getFolders();
    this.folders.set(folders);
  }

  teleport = output<PresenceInfo>();

  getColor(clientId: string) {
    if (clientId === this.myClientId()) return '#3b82f6';
    return getColorFromClientId(clientId);
  }

  getInitial(user: PresenceInfo) {
    if (user.username && user.username !== 'Anonymous') {
      return user.username.charAt(0).toUpperCase();
    }
    return getClientLabel(user.clientId).charAt(0).toUpperCase();
  }

  getLabel(user: PresenceInfo) {
    if (user.username && user.username !== 'Anonymous') {
      return user.username;
    }
    return getClientLabel(user.clientId);
  }

  getStatusText(noteId: string): string {
    if (!noteId) return 'In Setup';
    if (noteId === this.currentNoteId()) return 'In Current Note';
    
    const title = this.#findNoteTitleRecursive(this.folders(), noteId);
    return title ? `In ${title}` : 'In Unknown Note';
  }

  #findNoteTitleRecursive(folders: Folder[], noteId: string): string | null {
    for (const folder of folders) {
      const note = folder.notes.find(n => n.id === noteId);
      if (note) return note.title;
      
      const subTitle = this.#findNoteTitleRecursive(folder.subfolders, noteId);
      if (subTitle) return subTitle;
    }
    return null;
  }

  onUserClick(user: PresenceInfo) {
    if (user.clientId === this.myClientId()) return;
    if (this.#isHolding) return; // Ignore regular click if we just finished a hold
    this.teleport.emit(user);
  }

  onUserMouseDown(user: PresenceInfo) {
    if (user.clientId === this.myClientId()) return;
    this.#isHolding = false;
    this.#holdTimer = setTimeout(() => {
      this.#isHolding = true;
      this.#canvasConnection.trackedClientId.set(user.clientId);
    }, 500); // 500ms for long press
  }

  onUserMouseUp() {
    clearTimeout(this.#holdTimer);
  }

  onUserMouseLeave() {
    clearTimeout(this.#holdTimer);
  }
}
