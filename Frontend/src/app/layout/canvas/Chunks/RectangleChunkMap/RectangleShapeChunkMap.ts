import { Rect } from '../../Geometry';
import { RectangleShapeProperties } from '../../ShapeProperties/RectangleShapeProperties';
import { ChunkChange } from '../FormChunkMap';

import { RectangleChunkMap } from './RectangleChunkMap';

export class RectangleShapeChunkMap extends RectangleChunkMap {
  declare protected readonly formProperties: Readonly<
    Required<RectangleShapeProperties>
  >;

  override updateChunkMap(chunkSize: number, chunkRange: Rect): ChunkChange {
    return { chunkIndexesToReload: undefined, chunkIndexesToRemove: undefined };
    // TODO
  }
}
