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
  Root,
  Folder,
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
  view = signal<SidebarMode>(SidebarMode.Root);
  isNoteSelected = input<boolean>(false);
  
  rootFolders = signal<Folder[]>([]);
  loading = signal<boolean>(false);
  selectedFolder = signal<Folder | null>(null);
  selectedNoteId = signal<string | null>(null);
  isSidebarHidden = signal<boolean>(false);

  readonly noteSelected = output<Note>();
  readonly folderSelected = output<string>();
  readonly itemsChanged = output<void>();

  readonly #notesService = inject(NotesService);
  readonly #dialogService = inject(DialogService);

  async ngOnInit() {
    await this.loadFolders();
  }

  async loadFolders() {
    this.loading.set(true);
    const folders = await this.#notesService.getFolders();
    this.rootFolders.set(folders);
    this.itemsChanged.emit();

    if (this.selectedFolder()) {
      const freshSelect = this.#findFolderRecursive(folders, this.selectedFolder()!.id);
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

  selectFolder(folder: Folder) {
    this.folderSelected.emit(folder.id);
  }

  async navigateToFolder(folderId: string, note?: Note) {
    if (this.rootFolders().length === 0) {
      await this.loadFolders();
    }

    const folder = this.#findFolderRecursive(this.rootFolders(), folderId);
    if (folder) {
      this.selectedFolder.set(folder);
      this.view.set(SidebarMode.Folder);
      if (note) {
        this.selectedNoteId.set(note.id);
      }
    } else {
      this.goBack();
    }
  }

  goBack() {
    const current = this.selectedFolder();
    if (current?.parentFolderId) {
      this.folderSelected.emit(current.parentFolderId);
    } else {
      this.view.set(SidebarMode.Root);
      this.selectedFolder.set(null);
      this.folderSelected.emit('');
    }
  }

  addFolder() {
    this.#dialogService.openCreateFolderDialog().subscribe(async result => {
      if (result?.name) {
        await this.#notesService.createFolder(result.name, this.selectedFolder()?.id);
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
        this.selectNote(note);
      }
    });
  }

  selectNote(note: Note) {
    this.selectedNoteId.set(note.id);
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
        }
      });
  }

  toggleSidebar() {
    this.isSidebarHidden.update(v => !v);
  }

  changeFolderColor(folderId: string) {
    this.#dialogService.openFolderColorDialog().subscribe(color => {
      if (!color) return;
      this.#notesService.updateFolderColor(folderId, color).then(async () => {
        await this.loadFolders();
      });
    });
  }

  deleteFolder(folderId: string) {
    const folder = this.#findInAllFolders(folderId);
    if (!folder) return;

    this.#dialogService
      .openDeleteFolderDialog(folder.name)
      .subscribe(async confirmed => {
        if (confirmed) {
          await this.#notesService.deleteFolder(folderId);
          await this.loadFolders();
        }
      });
  }

  #findInAllFolders(folderId: string): Folder | undefined {
    return this.#findFolderRecursive(this.rootFolders(), folderId);
  }

  renameFolder(folderId: string) {
    const currentFolder = this.#findInAllFolders(folderId);
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
      active: this.selectedNoteId() === note.id,
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

  getRootHeaderButtons(): HeaderButton[] {
    return [
      {
        icon: 'fa-plus',
        title: 'New...',
        variant: 'primary',
        menuItems: [
          {
            label: 'New Folder',
            action: () => this.addFolder(),
          },
        ],
      },
    ];
  }

  getFolderHeaderButtons(): HeaderButton[] {
    return [
      {
        icon: 'fa-plus',
        title: 'New...',
        variant: 'primary',
        menuItems: [
          {
            label: 'New Note',
            action: () => this.addNote(),
          },
          {
            label: 'New Subfolder',
            action: () => this.addFolder(),
          },
        ],
      },
    ];
  }

  renameNote(noteId: string) {
    const note = this.selectedFolder()?.notes.find(n => n.id === noteId);
    this.#dialogService
      .openRenameNoteDialog(note?.title)
      .subscribe(result => {
        if (result) {
          this.#notesService.renameNote(noteId, result.name).then(() => this.loadFolders());
        }
      });
  }

  getContrastingTextColor(background?: string): string {
    return getContrastingTextColor(background);
  }
}
