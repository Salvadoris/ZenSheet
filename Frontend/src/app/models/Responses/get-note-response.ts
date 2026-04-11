// TODO use real types instead of unknown

export interface GetNoteResponse {
  id: string;
  parentFolderId: string;
  title: string;
  content: {
    drawings: unknown[];
    shapes: unknown[];
  };
  viewPosition?: ViewPosition;
  zoomScale: number;
}

interface ViewPosition {
  x: number;
  y: number;
}