import { SerializedDrawing } from "../layout/canvas/Serializer/DrawingSerializer";
import { SerializedShape } from "../layout/canvas/Serializer/ShapeSerializer";
import { generateUuid } from "../utils/uuid";

export class NoteContent {
  drawings: SerializedDrawing[] = [];
  shapes: SerializedShape[] = [];

  constructor(partial?: Partial<NoteContent>) {
    Object.assign(this, partial);
  }
}

export interface ViewPosition {
  x: number;
  y: number;
}

export class Note {
  id: string;
  parentFolderId: string;
  title: string;
  content: NoteContent;
  viewPosition?: ViewPosition;
  zoomScale: number;
  updatedAt: Date;
  createdAt: Date;

  constructor(partial?: Partial<Note>) {
    this.id = partial?.id ?? generateUuid();
    this.parentFolderId = partial?.parentFolderId ?? '';
    this.title = partial?.title ?? 'New Note';
    this.content = partial?.content instanceof NoteContent 
      ? partial.content 
      : new NoteContent(partial?.content || {});
    this.viewPosition = partial?.viewPosition;
    this.zoomScale = partial?.zoomScale ?? 1;
    this.updatedAt = partial?.updatedAt ? new Date(partial.updatedAt) : new Date();
    this.createdAt = partial?.createdAt ? new Date(partial.createdAt) : new Date();
  }
}

export interface Folder {
  id: string;
  name: string;
  notes: Note[];
  subfolders: Folder[];
  parentFolderId?: string;
  color?: string;
}
