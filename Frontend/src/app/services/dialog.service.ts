import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';

import {
  DialogDeleteComponent,
  DeleteDialogData,
} from '../components/dialogs/dialog-delete/dialog-delete.component';
import {
  DialogInputComponent,
  InputDialogData,
} from '../components/dialogs/dialog-input/dialog-input.component';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  #dialog = inject(MatDialog);

  openDeleteDialog(data: DeleteDialogData): Observable<boolean> {
    const dialogRef = this.#dialog.open(DialogDeleteComponent, {
      data,
      width: '400px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: true,
      restoreFocus: true,
    });

    return dialogRef.afterClosed();
  }

  openDeleteFolderDialog(folderName: string): Observable<boolean> {
    return this.openDeleteDialog({
      title: 'Delete Folder',
      message: 'Are you sure you want to delete this folder?',
      itemName: folderName,
      itemType: 'folder',
    });
  }

  openDeleteNoteDialog(noteName: string): Observable<boolean> {
    return this.openDeleteDialog({
      title: 'Delete Note',
      message: 'Are you sure you want to delete this note?',
      itemName: noteName,
      itemType: 'note',
    });
  }

  openInputDialog(data: InputDialogData): Observable<{ name: string } | null> {
    const dialogRef = this.#dialog.open(DialogInputComponent, {
      data,
      width: '400px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: true,
      restoreFocus: true,
    });

    return dialogRef.afterClosed();
  }

  openCreateFolderDialog(initialValue?: string) {
    return this.openInputDialog({
      title: 'Create New Folder',
      icon: 'fa-folder text-blue-500',
      label: 'Folder name',
      inputPlaceholder: 'Enter folder name...',
      initialValue: initialValue,
      submitButton: {
        text: 'Create folder',
        icon: 'fa-folder-plus',
      },
    });
  }

  openCreateNoteDialog(initialValue?: string) {
    return this.openInputDialog({
      title: 'Create New Note',
      icon: 'fa-file-circle-plus text-yellow-500',
      label: 'Note name',
      inputPlaceholder: 'Enter note name...',
      initialValue: initialValue,
      submitButton: {
        text: 'Create note',
        icon: 'fa-file-circle-plus',
      },
    });
  }

  openRenameFolderDialog(initialValue?: string) {
    return this.openInputDialog({
      title: 'Rename Folder',
      icon: 'fa-file-circle-plus text-yellow-500',
      label: 'New folder name:',
      inputPlaceholder: 'Enter folder name...',
      initialValue: initialValue,
      submitButton: {
        text: 'Save',
      },
    });
  }

  openRenameNoteDialog(initialValue?: string) {
    return this.openInputDialog({
      title: 'Create New Note',
      icon: 'fa-file-circle-plus text-yellow-500',
      label: 'New note name',
      inputPlaceholder: 'Enter note name...',
      initialValue: initialValue,
      submitButton: {
        text: 'Save',
      },
    });
  }
}
