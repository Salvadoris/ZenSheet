import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  output,
  signal,
} from '@angular/core';

import { Folder, Note } from '../../interfaces/note.model';
import { DialogService } from '../../services/dialog.service';
import { NotesService } from '../../services/notes.service';

import { DropdownMenuItem } from './dropdown-menu.component';
import { EmptyStateComponent } from './empty-state.component';
import { ListItemComponent, ListItemData } from './list-item.component';
import {
  SidebarHeaderComponent,
  HeaderButton,
} from './sidebar-header.component';

export enum SidebarMode {
  Folders = 0,
  Notes = 1,
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
  selectedFolder = signal<Folder | null>(null);
  selectedNoteId: string | null = null;
  isSidebarHidden = false;

  readonly noteSelected = output<{
    folderId: string;
    note: Note;
  }>();

  private readonly notesService = inject(NotesService);
  private readonly dialogService = inject(DialogService);

  ngOnInit() {
    this.loadFolders();
  }

  private loadFolders() {
    this.folders.set(this.notesService.getFolders());
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
    this.dialogService.openCreateFolderDialog().subscribe(result => {
      if (result) {
        this.notesService.createFolder(result.name);
        this.loadFolders();
      }
    });
  }

  addNote() {
    if (!this.selectedFolder) return;

    this.dialogService.openCreateNoteDialog().subscribe(result => {
      if (result) {
        const note = this.notesService.createNote(
          this.selectedFolder()!.id,
          result.name
        );
        this.loadFolders();
        this.selectedFolder.set(
          this.folders().find(f => f.id === this.selectedFolder()!.id) || null
        );
        this.selectNote(note);
      }
    });
  }

  selectNote(note: Note) {
    this.selectedNoteId = note.id;
    this.noteSelected.emit({ folderId: this.selectedFolder()!.id, note });
  }

  onDeleteNote(noteId: string, event: Event) {
    if (event) event.stopPropagation();
    if (!this.selectedFolder) return;

    const note = this.selectedFolder()!.notes.find(n => n.id === noteId);
    if (!note) return;

    this.dialogService.openDeleteNoteDialog(note.title).subscribe(confirmed => {
      if (confirmed) {
        this.notesService.deleteNote(this.selectedFolder()!.id, noteId);

        this.loadFolders();
        this.selectedFolder.set(
          this.folders().find(f => f.id === this.selectedFolder()!.id) || null
        );

        if (this.selectedNoteId === noteId) {
          this.selectedNoteId = null;
          this.noteSelected.emit({
            folderId: '',
            note: {
              id: '',
              parentFolderId: '',
              title: '',
              content: null,
              updatedAt: new Date(),
            },
          });
        }
      }
    });
  }

  toggleSidebar() {
    this.isSidebarHidden = !this.isSidebarHidden;
  }

  changeFolderColor(folderId: string) {
    const color = prompt('Enter a hex color (e.g., #3b82f6):');
    if (!color) return;
    this.notesService.updateFolderColor(folderId, color);
    this.loadFolders();
  }

  deleteFolder(folderId: string) {
    const folder = this.folders().find(f => f.id === folderId);
    if (!folder) return;

    this.dialogService
      .openDeleteFolderDialog(folder.name)
      .subscribe(confirmed => {
        if (confirmed) {
          this.notesService.deleteFolder(folderId);
          this.loadFolders();
          if (this.selectedFolder()?.id === folderId) {
            this.goBack();
          }
        }
      });
  }

  renameFolder(folderId: string) {
    const currentFolder = this.folders().find(f => f.id === folderId);
    this.dialogService
      .openRenameFolderDialog(currentFolder?.name)
      .subscribe(result => {
        if (result) {
          this.notesService.renameFolder(folderId, result.name);
          this.loadFolders();
        }
      });
    this.loadFolders();
  }

  getFolderListItemData(folder: Folder): ListItemData {
    return {
      id: folder.id,
      name: folder.name,
      color: folder.color,
      icon: 'fa-folder',
    };
  }

  getNoteListItemData(note: Note): ListItemData {
    return {
      id: note.id,
      name: note.title,
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
      },
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
      },
    ];
  }

  getFolderHeaderButtons(): HeaderButton[] {
    return [
      {
        icon: 'fa-folder-plus',
        action: () => this.addFolder(),
        title: 'New Folder',
        variant: 'primary',
      },
    ];
  }

  getNoteHeaderButtons(): HeaderButton[] {
    return [
      {
        icon: 'fa-plus',
        action: () => this.addNote(),
        title: 'New Note',
        variant: 'primary',
      },
    ];
  }

  renameNote(noteId: string) {
    const currentFolder = this.selectedFolder();
    if (!currentFolder) return;

    const currentNote = currentFolder.notes.find(n => n.id === noteId);
    this.dialogService
      .openRenameNoteDialog(currentNote?.title)
      .subscribe(result => {
        if (result) {
          this.notesService.renameNote(noteId, result.name);
          this.loadFolders();
          this.selectedFolder.set(
            this.folders().find(f => f.id === currentFolder.id) || null
          );
        }
      });
  }

  getContrastingTextColor(background?: string): string {
    if (!background) return 'inherit';
    const hex = background.trim();
    // Supports #rgb, #rrggbb, rgb(), and named colors via a fallback canvas if needed
    let r = 0,
      g = 0,
      b = 0;
    const isHex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(hex);
    if (isHex) {
      const clean = hex.substring(1);
      const full =
        clean.length === 3
          ? clean
              .split('')
              .map(ch => ch + ch)
              .join('')
          : clean;
      r = parseInt(full.substring(0, 2), 16);
      g = parseInt(full.substring(2, 4), 16);
      b = parseInt(full.substring(4, 6), 16);
    } else if (hex.startsWith('rgb')) {
      const m = hex.match(/rgb[a]?\(([^)]+)\)/);
      if (m) {
        const parts = m[1].split(',').map(v => parseFloat(v.trim()));
        [r, g, b] = parts;
      }
    } else {
      // Fallback: try to resolve computed color in the browser
      try {
        const ctxCanvas = document.createElement('canvas');
        const ctx = ctxCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = hex as unknown as string;
          const resolved = ctx.fillStyle as unknown as string;
          if (typeof resolved === 'string' && resolved.startsWith('#')) {
            const clean = resolved.substring(1);
            r = parseInt(clean.substring(0, 2), 16);
            g = parseInt(clean.substring(2, 4), 16);
            b = parseInt(clean.substring(4, 6), 16);
          }
        }
      } catch {
        return 'inherit';
      }
    }

    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#000000' : '#ffffff';
  }
}
