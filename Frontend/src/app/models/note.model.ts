import { SerializedDrawing } from "../layout/canvas/Serializer/DrawingSerializer";
import { SerializedShape } from "../layout/canvas/Serializer/ShapeSerializer";

export class NoteContent {
  drawings: SerializedDrawing[] = [];
  shapes: SerializedShape[] = [];
  origin?: [number, number];
  scale?: number;

  constructor(partial?: Partial<NoteContent>) {
    Object.assign(this, partial);
  }
}

export class Note {
  id: string;
  parentFolderId: string;
  title: string;
  content: NoteContent;
  updatedAt: Date;
  createdAt: Date;

  constructor(partial?: Partial<Note>) {
    this.id = partial?.id ?? crypto.randomUUID();
    this.parentFolderId = partial?.parentFolderId ?? '';
    this.title = partial?.title ?? 'New Note';
    this.content = partial?.content instanceof NoteContent 
      ? partial.content 
      : new NoteContent(partial?.content);
    this.updatedAt = partial?.updatedAt ? new Date(partial.updatedAt) : new Date();
    this.createdAt = partial?.createdAt ? new Date(partial.createdAt) : new Date();
  }
}

export interface Folder {
  id: string;
  name: string;
  notes: Note[];
  color?: string;
}
