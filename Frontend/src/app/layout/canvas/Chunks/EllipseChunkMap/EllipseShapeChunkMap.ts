import { Rect } from '../../Geometry';
import { EllipseShapeProperties } from '../../ShapeProperties/EllipseShapeProperties';
import { ChunkChange } from '../FormChunkMap';

import { EllipseChunkMap } from './EllipseChunkMap';

export class EllipseShapeChunkMap extends EllipseChunkMap {
  declare protected readonly formProperties: Readonly<
    Required<EllipseShapeProperties>
  >;

  override updateChunkMap(chunkSize: number, chunkRange: Rect): ChunkChange {
    return { chunkIndexesToReload: undefined, chunkIndexesToRemove: undefined };
    // TODO
  }
}
