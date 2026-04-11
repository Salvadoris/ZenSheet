import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { Folder, Note } from '../../models/note.model';
import { DialogService } from '../../services/dialog.service';
import { FolderService } from '../../services/folder.service';
import { NotesService } from '../../services/notes.service';
import { SettingsService } from '../../services/settings.service';
import { getContrastingTextColor } from '../../utils/color-utils';

import { DropdownMenuItem } from './dropdown-menu.component';
import { EmptyStateComponent } from './empty-state.component';
import { ListItemComponent, ListItemData } from './list-item.component';
import {
  HeaderButton,
  SidebarHeaderComponent,
} from './overview-sidebar-header.component';

export enum SidebarMode {
  Root,
  Folder,
}

@Component({
  selector: 'app-overview-sidebar',
  imports: [
    CommonModule,
    ListItemComponent,
    EmptyStateComponent,
    SidebarHeaderComponent,
  ],
  templateUrl: './overview-sidebar.component.html',
  styleUrl: './overview-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewSidebarComponent implements OnInit {
  readonly SidebarView = SidebarMode;
  view = signal<SidebarMode>(SidebarMode.Root);
  isNoteSelected = input<boolean>(false);
  
  cloudFolders = signal<Folder[]>([]);
  localFolders = signal<Folder[]>([]);
  loading = signal<boolean>(false);
  selectedFolder = signal<Folder | null>(null);
  selectedSource = signal<'cloud' | 'local'>('cloud');
  selectedNoteId = signal<string | null>(null);
  copiedNote = signal<{ id: string, source: 'cloud' | 'local' } | null>(null);
  isSidebarHidden = signal<boolean>(false);
  cloudCollapsed = signal<boolean>(false);
  localCollapsed = signal<boolean>(false);
  isOfflineMode = inject(SettingsService).isOfflineMode;

  readonly noteSelected = output<{ note: Note; source: 'cloud' | 'local' }>();
  readonly folderSelected = output<{ folderId: string; source: 'cloud' | 'local' }>();
  readonly itemsChanged = output<void>();

  readonly #notesService = inject(NotesService);
  readonly #folderService = inject(FolderService);
  readonly #dialogService = inject(DialogService);
  #router = inject(Router);

  async ngOnInit() {
    await this.loadFolders();
  }

  async loadFolders(source?: 'cloud' | 'local') {
    this.loading.set(true);
    
    if (source === 'cloud') {
      const cloud = await this.#folderService.getFolders('cloud');
      this.cloudFolders.set(cloud);
    } else if (source === 'local') {
      const local = await this.#folderService.getFolders('local');
      this.localFolders.set(local);
    } else {
      const [cloud, local] = await Promise.all([
        this.#folderService.getFolders('cloud'),
        this.#folderService.getFolders('local')
      ]);
      this.cloudFolders.set(cloud);
      this.localFolders.set(local);
    }

    this.itemsChanged.emit();

    if (this.selectedFolder()) {
      const sourceFolders = this.selectedSource() === 'cloud' ? this.cloudFolders() : this.localFolders();
      const freshSelect = this.#findFolderRecursive(sourceFolders, this.selectedFolder()!.id);
      this.selectedFolder.set(freshSelect || null);
    }

    this.loading.set(false);
  }

  #findFolderRecursive(folders: Folder[], folderId: string): Folder | undefined {
    for (const f of folders) {
      if (f.id === folderId) return f;
      const sub = this.#findFolderRecursive(f.subfolders, folderId);
      if (sub) return sub;
    }
    return undefined;
  }

  selectFolder(folder: Folder, source?: 'cloud' | 'local') {
    const s = source || this.selectedSource();
    this.selectedSource.set(s);
    this.loading.set(true);
    this.folderSelected.emit({ folderId: folder.id, source: s });
  }

  async navigateToFolder(folderId: string, note?: Note) {
    const allFolders = [...this.cloudFolders(), ...this.localFolders()];
    const folder = this.#findFolderRecursive(allFolders, folderId);
    if (folder) {
      this.selectedFolder.set(folder);
      this.view.set(SidebarMode.Folder);
      if (note) {
        this.selectedNoteId.set(note.id);
      }
    } else {
      this.goBack();
    }
    this.loading.set(false);
  }

  resetToRoot() {
    this.selectedFolder.set(null);
    this.selectedNoteId.set(null);
    this.view.set(SidebarMode.Root);
    this.#router.navigateByUrl('/');
  }

  goBack() {
    const current = this.selectedFolder();
    if (current?.parentFolderId) {
      this.folderSelected.emit({ folderId: current.parentFolderId, source: this.selectedSource() });
    } else {
      this.view.set(SidebarMode.Root);
      this.selectedFolder.set(null);
      this.folderSelected.emit({ folderId: '', source: this.selectedSource() });
    }
  }

  addFolder() {
    const parentFolder = this.selectedFolder();
    const source = this.selectedSource();
    const existingNames = parentFolder
      ? (parentFolder.subfolders || []).map(f => f.name)
      : (source === 'cloud' ? this.cloudFolders() : this.localFolders()).map(f => f.name);

    this.#dialogService.openCreateFolderDialog(this.#getUniqueNameValidator(existingNames))
      .subscribe(async result => {
        if (result?.name) {
          await this.#folderService.createFolder(result.name, parentFolder?.id, source);
          await this.loadFolders();
        }
      });
  }

  async addNote() {
    const folder = this.selectedFolder();
    if (!folder) return;

    const source = this.selectedSource();
    const existingNames = (folder.notes || []).map(n => n.title);

    this.#dialogService.openCreateNoteDialog(this.#getUniqueNameValidator(existingNames))
      .subscribe(async result => {
        if (result?.name) {
          const noteId = await this.#notesService.createNote(
            folder.id,
            result.name,
            source
          );
          await this.loadFolders();
          
          const freshFolders = source === 'cloud' ? this.cloudFolders() : this.localFolders();
          const freshNote = this.#findNoteRecursiveInSpecificFolders(freshFolders, noteId);
          if (freshNote) {
            this.selectNote(freshNote);
          }
        }
      });
  }

  #findNoteRecursiveInSpecificFolders(folders: Folder[], noteId: string): Note | undefined {
    for (const f of folders) {
      const n = f.notes.find(note => note.id === noteId);
      if (n) return n;
      const subN = this.#findNoteRecursiveInSpecificFolders(f.subfolders, noteId);
      if (subN) return subN;
    }
    return undefined;
  }

  selectNote(note: Note) {
    this.selectedNoteId.set(note.id);
    this.noteSelected.emit({ note, source: this.selectedSource() });
  }

  onDeleteNote(noteId: string, event: Event, source?: 'cloud' | 'local') {
    if (event) event.stopPropagation();
    const folder = this.selectedFolder();
    if (!folder) return;

    const note = folder.notes.find(n => n.id === noteId);
    if (!note) return;

    const s = source || this.selectedSource();

    this.#dialogService
      .openDeleteNoteDialog(note.title)
      .subscribe(async confirmed => {
        if (confirmed) {
          await this.#notesService.deleteNote(
            folder.id,
            noteId,
            s
          );
          await this.loadFolders();
        }
      });
  }

  toggleSidebar() {
    this.isSidebarHidden.update(v => !v);
  }

  toggleCloud() {
    this.cloudCollapsed.update(v => !v);
  }

  toggleLocal() {
    this.localCollapsed.update(v => !v);
  }

  changeFolderColor(folderId: string, source?: 'cloud' | 'local') {
    const s = source || this.selectedSource();
    this.#dialogService.openFolderColorDialog().subscribe(color => {
      if (!color) return;
      this.#folderService.updateFolderColor(folderId, color, s).then(async () => {
        await this.loadFolders();
      });
    });
  }

  deleteFolder(folderId: string, source?: 'cloud' | 'local') {
    const s = source || this.selectedSource();
    const folder = this.#findInAllFolders(folderId);
    if (!folder) return;

    this.#dialogService
      .openDeleteFolderDialog(folder.name)
      .subscribe(async confirmed => {
        if (confirmed) {
          await this.#folderService.deleteFolder(folderId, s);
          await this.loadFolders();
        }
      });
  }

  #findInAllFolders(folderId: string): Folder | undefined {
    return this.#findFolderRecursive([...this.cloudFolders(), ...this.localFolders()], folderId);
  }

  renameFolder(folderId: string, source?: 'cloud' | 'local') {
    const s = source || this.selectedSource();
    const currentFolder = this.#findInAllFolders(folderId);
    if (!currentFolder) return;

    let siblings: Folder[] = [];
    if (currentFolder.parentFolderId) {
       const parent = this.#findInAllFolders(currentFolder.parentFolderId);
       siblings = parent?.subfolders || [];
    } else {
       siblings = s === 'cloud' ? this.cloudFolders() : this.localFolders();
    }

    const existingNames = siblings
      .filter(f => f.id !== folderId)
      .map(f => f.name);

    this.#dialogService
      .openRenameFolderDialog(currentFolder.name, this.#getUniqueNameValidator(existingNames))
      .subscribe(result => {
        if (result) {
          this.#folderService
            .renameFolder(folderId, result.name, s)
            .then(() => this.loadFolders());
        }
      });
  }

  getFolderListItemData(folder: Folder): ListItemData {
    return {
      id: folder.id,
      name: folder.name,
      active: false,
      color: folder.color,
      icon: 'fa-folder',
    };
  }

  getNoteListItemData(note: Note): ListItemData {
    return {
      id: note.id,
      name: note.title,
      active: this.selectedNoteId() === note.id,
      icon: 'fa-file',
    };
  }

  getFolderMenuItems(folder: Folder, source: 'cloud' | 'local'): DropdownMenuItem[] {
    const items: DropdownMenuItem[] = [
      {
        label: 'Change folder color',
        action: () => this.changeFolderColor(folder.id, source),
      },
      {
        label: 'Rename',
        action: () => this.renameFolder(folder.id, source),
      },
      {
        label: 'Upload Note',
        action: () => this.uploadLocalNote(folder.id),
      }
    ];

    const copied = this.copiedNote();
    if (copied) {
      items.push({
        label: 'Paste Note',
        action: () => this.pasteCopiedNote(folder.id, source),
      });
    }

    items.push({
      label: 'Delete',
      action: () => this.deleteFolder(folder.id, source),
      isDestructive: true,
    });

    return items;
  }

  getNoteMenuItems(note: Note, source: 'cloud' | 'local'): DropdownMenuItem[] {
    return [
      {
        label: 'Rename',
        action: () => this.renameNote(note.id, source),
      },
      {
        label: 'Copy',
        action: () => this.copyNoteId(note.id, source),
      },
      {
        label: 'Download',
        action: () => this.downloadNote(note.id, source),
      },
      {
        label: 'Delete',
        action: () => this.onDeleteNote(note.id, new Event('click'), source),
        isDestructive: true,
      }
    ];
  }

  getRootHeaderButtons(): HeaderButton[] {
    return [];
  }

  getFolderHeaderButtons(): HeaderButton[] {
    return [
      {
        icon: 'fa-plus',
        title: 'New...',
        menuItems: [
          {
            label: 'New Note',
            action: () => this.addNote(),
            icon: 'fa-file-circle-plus',
          },
          {
            label: 'New Subfolder',
            action: () => this.addFolder(),
            icon: 'fa-folder-plus',
          },
        ],
      },
    ];
  }

  renameNote(noteId: string, source?: 'cloud' | 'local') {
    const folder = this.selectedFolder();
    if (!folder) return;

    const note = folder.notes.find(n => n.id === noteId);
    if (!note) return;

    const s = source || this.selectedSource();

    const existingNames = folder.notes
      .filter(n => n.id !== noteId)
      .map(n => n.title);

    this.#dialogService
      .openRenameNoteDialog(note?.title, this.#getUniqueNameValidator(existingNames))
      .subscribe(result => {
        if (result) {
          this.#notesService.renameNote(noteId, result.name, folder.id, s).then(() => this.loadFolders());
        }
      });
  }

  copyNoteId(noteId: string, source: 'cloud' | 'local') {
    this.copiedNote.set({ id: noteId, source });
  }

  async pasteCopiedNote(folderId: string, destSource: 'cloud' | 'local') {
    const copied = this.copiedNote();
    if (!copied) return;

    this.loading.set(true);
    await this.#notesService.pasteNote(copied.id, copied.source, folderId, destSource);
    await this.loadFolders();
  }

  uploadLocalNote(folderId: string) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;
      this.loading.set(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          await this.#notesService.insertNoteFromLocal(data, folderId);
          await this.loadFolders();
        } catch (error) {
          console.error('Failed to parse or upload note file', error);
          this.loading.set(false);
        }
      };
      reader.onerror = () => this.loading.set(false);
      reader.readAsText(file);
    };
    input.click();
  }

  downloadNote(noteId: string, source: 'cloud' | 'local') {
    this.#notesService.exportNoteToLocal(noteId, source);
  }

  getContrastingTextColor(background?: string): string {
    return getContrastingTextColor(background);
  }

  #getUniqueNameValidator(existingNames: string[]): import('@angular/forms').ValidatorFn {
    return (control: import('@angular/forms').AbstractControl): import('@angular/forms').ValidationErrors | null => {
      const value = control.value?.trim();
      if (!value) return null;
      
      const exists = existingNames.some(name => name.toLowerCase() === value.toLowerCase());
      return exists ? { nameExists: true } : null;
    };
  }
}
