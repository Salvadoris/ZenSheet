import { StraightLineShapeProperties } from '../../ShapeProperties/StraightLineShapeProperties';
import { ChunkChange } from '../FormChunkMap';

import { StraightLineChunkMap } from './StraightLineChunkMap';

export class StraightLineShapeChunkMap extends StraightLineChunkMap {
  declare protected readonly formProperties: Readonly<
    Required<StraightLineShapeProperties>
  >;

  override updateChunkMap(chunkSize: number): ChunkChange {
    return { chunkIndexesToReload: undefined, chunkIndexesToRemove: undefined };
    // TODO
  }
}
