import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import {
  DialogCreateComponent,
  CreateDialogData,
} from '../components/dialogs/dialog-create/dialog-create.component';
import {
  DialogDeleteComponent,
  DeleteDialogData,
} from '../components/dialogs/dialog-delete/dialog-delete.component';

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

  openCreateDialog(
    data: CreateDialogData
  ): Observable<{ name: string } | undefined> {
    const dialogRef = this.#dialog.open(DialogCreateComponent, {
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
    return this.openCreateDialog({
      title: 'Create New Folder',
      placeholder: 'Enter folder name...',
      itemType: 'folder',
      initialValue: initialValue || '',
    });
  }

  openCreateNoteDialog(initialValue?: string) {
    return this.openCreateDialog({
      title: 'Create New Note',
      placeholder: 'Enter note title...',
      itemType: 'note',
      initialValue: initialValue || '',
    });
  }
}
