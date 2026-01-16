import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  output,
  signal,
} from '@angular/core';

import { Folder, Note } from '../../models/note.model';
import { DialogService } from '../../services/dialog.service';
import { NotesService } from '../../services/notes.service';
import { getContrastingTextColor } from '../../utils/color-utils';

import { DropdownMenuItem } from './dropdown-menu.component';
import { EmptyStateComponent } from './empty-state.component';
import { ListItemComponent, ListItemData } from './list-item.component';
import {
  SidebarHeaderComponent,
  HeaderButton,
} from './sidebar-header.component';

export enum SidebarMode {
  Folders,
  Notes,
}

@Component({
  selector: 'app-sidebar',
  imports: [
    CommonModule,
    ListItemComponent,
    EmptyStateComponent,
    SidebarHeaderComponent,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnInit {
  readonly SidebarView = SidebarMode;
  view: SidebarMode = SidebarMode.Folders;
  folders = signal<Folder[]>([]);
  loading = signal<boolean>(false);
  selectedFolder = signal<Folder | null>(null);
  selectedNoteId: string | null = null;
  isSidebarHidden = false;

  readonly noteSelected = output<Note>();

  readonly #notesService = inject(NotesService);
  readonly #dialogService = inject(DialogService);

  async ngOnInit() {
    await this.loadFolders();
  }

  async loadFolders() {
    this.loading.set(true);
    const start = Date.now();

    const folders = await this.#notesService.getFolders();
    this.folders.set(folders);

    const elapsed = Date.now() - start;
    const remaining = Math.max(0, 200 - elapsed);
    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining));
    }

    this.loading.set(false);
  }

  selectFolder(folder: Folder) {
    this.selectedFolder.set(folder);
    this.view = SidebarMode.Notes;
  }

  goBack() {
    this.view = SidebarMode.Folders;
    this.selectedFolder.set(null);
    this.selectedNoteId = null;
  }

  addFolder() {
    this.#dialogService.openCreateFolderDialog().subscribe(async result => {
      if (result?.name) {
        await this.#notesService.createFolder(result.name);
        await this.loadFolders();
      }
    });
  }

  async addNote() {
    if (!this.selectedFolder()) return;
    this.#dialogService.openCreateNoteDialog().subscribe(async result => {
      if (result?.name) {
        const note = await this.#notesService.createNote(
          this.selectedFolder()!.id,
          result.name
        );
        await this.loadFolders();
        
        this.selectedFolder.set(
          this.folders().find(f => f.id === this.selectedFolder()!.id) || null
        );
        this.selectNote(note);
      }
    });
  }

  selectNote(note: Note) {
    this.selectedNoteId = note.id;
    this.noteSelected.emit(note);
  }

  onDeleteNote(noteId: string, event: Event) {
    if (event) event.stopPropagation();
    if (!this.selectedFolder) return;

    const note = this.selectedFolder()!.notes.find(n => n.id === noteId);
    if (!note) return;

    this.#dialogService
      .openDeleteNoteDialog(note.title)
      .subscribe(async confirmed => {
        if (confirmed) {
          await this.#notesService.deleteNote(
            this.selectedFolder()!.id,
            noteId
          );

          await this.loadFolders();
          this.selectedFolder.set(
            this.folders().find(f => f.id === this.selectedFolder()!.id) || null
          );

          if (this.selectedNoteId === noteId) {
            this.selectedNoteId = null;
            this.noteSelected.emit(new Note());
          }
        }
      });
  }

  toggleSidebar() {
    this.isSidebarHidden = !this.isSidebarHidden;
  }

  changeFolderColor(folderId: string) {
    const folder = this.folders().find(f => f.id === folderId);
    if (!folder) return;

    this.#dialogService.openFolderColorDialog(folder.color).subscribe(color => {
      if (!color) return;
      this.#notesService.updateFolderColor(folderId, color).then(async () => {
        await this.loadFolders();
        if (this.selectedFolder()?.id === folderId) {
          this.selectedFolder.set(
            this.folders().find(f => f.id === folderId) || null
          );
        }
      });

      const wasSelected = this.selectedFolder()?.id === folderId;
      if (wasSelected) {
        this.selectedFolder.set(
          this.folders().find(f => f.id === folderId) || null
        );
      }
    });
  }

  deleteFolder(folderId: string) {
    const folder = this.folders().find(f => f.id === folderId);
    if (!folder) return;

    this.#dialogService
      .openDeleteFolderDialog(folder.name)
      .subscribe(async confirmed => {
        if (confirmed) {
          await this.#notesService.deleteFolder(folderId);
          await this.loadFolders();
          if (this.selectedFolder()?.id === folderId) {
            this.goBack();
          }
        }
      });
  }

  renameFolder(folderId: string) {
    const currentFolder = this.folders().find(f => f.id === folderId);
    this.#dialogService
      .openRenameFolderDialog(currentFolder?.name)
      .subscribe(result => {
        if (result) {
          this.#notesService
            .renameFolder(folderId, result.name)
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
      active: this.selectedNoteId === note.id,
      icon: 'fa-file',
    };
  }

  getFolderMenuItems(folder: Folder): DropdownMenuItem[] {
    return [
      {
        label: 'Change folder color',
        action: () => this.changeFolderColor(folder.id),
      },
      {
        label: 'Rename',
        action: () => this.renameFolder(folder.id),
      },
      {
        label: 'Delete',
        action: () => this.deleteFolder(folder.id),
        isDestructive: true,
      }
    ];
  }

  getNoteMenuItems(note: Note): DropdownMenuItem[] {
    return [
      {
        label: 'Rename',
        action: () => this.renameNote(note.id),
      },
      {
        label: 'Delete',
        action: () => this.onDeleteNote(note.id, new Event('click')),
        isDestructive: true,
      }
    ];
  }

  getFolderHeaderButtons(): HeaderButton[] {
    return [
      {
        icon: 'fa-folder-plus',
        action: () => this.addFolder(),
        title: 'New Folder',
        variant: 'primary',
      }
    ];
  }

  getNoteHeaderButtons(): HeaderButton[] {
    return [
      {
        icon: 'fa-plus',
        action: () => this.addNote(),
        title: 'New Note',
        variant: 'primary',
      }
    ];
  }

  renameNote(noteId: string) {
    const currentFolder = this.selectedFolder();
    if (!currentFolder) return;

    const currentNote = currentFolder.notes.find(n => n.id === noteId);
    this.#dialogService
      .openRenameNoteDialog(currentNote?.title)
      .subscribe(result => {
        if (result) {
          this.#notesService.renameNote(noteId, result.name);
          this.loadFolders();
          this.selectedFolder.set(
            this.folders().find(f => f.id === currentFolder.id) || null
          );
        }
      });
  }

  async openFolderAndSelectNote(folderId: string, note: Note) {
    if (this.folders().length === 0) {
      await this.loadFolders();
    }

    const folder = this.folders().find(f => f.id === folderId);
    if (!folder) return;

    this.selectFolder(folder);
    this.selectNote(note);
  }

  getContrastingTextColor(background?: string): string {
    return getContrastingTextColor(background);
  }
}
