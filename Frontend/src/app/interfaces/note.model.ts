import { Delta } from 'quill/core';

export interface Note {
  id: string;
  parentFolderId: string;
  title: string;
  content: Delta | null;
  updatedAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  notes: Note[];
  color?: string;
}
