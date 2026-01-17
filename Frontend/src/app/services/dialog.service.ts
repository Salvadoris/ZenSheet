import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';

import {
  ColorPickerDialogData,
  DialogColorPickerComponent,
} from '../components/dialogs/dialog-color/dialog-color.component';
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

  openCreateFolderDialog(validator?: import('@angular/forms').ValidatorFn) {
    return this.openInputDialog({
      title: 'Create New Folder',
      icon: 'fa-folder text-blue-500',
      label: 'Folder name',
      inputPlaceholder: 'Enter folder name...',
      initialValue: undefined,
      submitButton: {
        text: 'Create folder',
        icon: 'fa-folder-plus',
      },
      validator,
    });
  }

  openCreateNoteDialog(validator?: import('@angular/forms').ValidatorFn) {
    return this.openInputDialog({
      title: 'Create New Note',
      icon: 'fa-file-circle-plus text-yellow-500',
      label: 'Note name',
      inputPlaceholder: 'Enter note name...',
      initialValue: undefined,
      submitButton: {
        text: 'Create note',
        icon: 'fa-file-circle-plus',
      },
      validator,
    });
  }

  openRenameFolderDialog(initialValue?: string, validator?: import('@angular/forms').ValidatorFn) {
    return this.openInputDialog({
      title: 'Rename Folder',
      icon: 'fa-file-circle-plus text-yellow-500',
      label: 'New folder name:',
      inputPlaceholder: 'Enter folder name...',
      initialValue: initialValue,
      submitButton: {
        text: 'Save',
      },
      validator,
    });
  }

  openRenameNoteDialog(initialValue?: string, validator?: import('@angular/forms').ValidatorFn) {
    return this.openInputDialog({
      title: 'Create New Note',
      icon: 'fa-file-circle-plus text-yellow-500',
      label: 'New note name',
      inputPlaceholder: 'Enter note name...',
      initialValue: initialValue,
      submitButton: {
        text: 'Save',
      },
      validator,
    });
  }

  openFolderColorDialog(initialColor?: string) {
    const defaultColors = [
      '#3b82f6',
      '#22d3ee',
      '#14b8a6',
      '#84cc16',
      '#f97316',
      '#ef4444',
      '#a855f7',
      '#6366f1',
    ];

    const dialogRef = this.#dialog.open<
      DialogColorPickerComponent,
      ColorPickerDialogData,
      string | null
    >(DialogColorPickerComponent, {
      data: {
        title: 'Choose Folder Color',
        defaultColors,
        initialColor,
      },
      width: '420px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: false,
      restoreFocus: true,
    });

    return dialogRef.afterClosed();
  }
}
