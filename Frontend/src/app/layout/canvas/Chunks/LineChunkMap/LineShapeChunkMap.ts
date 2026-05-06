import { FormPropertyName } from '../../FormProperties/FormPropertyName';
import { Point } from '../../Geometry';
import { LineShapeProperties } from '../../ShapeProperties/LineShapeProperties';
import { StyleName } from '../../ShapeStyles/StyleName';
import { ChunkIndexSet } from '../ChunkIndex';
import { ChunkChange } from '../FormChunkMap';

import { getChunksForThickLine, LineChunkMap } from './LineChunkMap';

export class LineShapeChunkMap extends LineChunkMap {
  declare protected readonly formProperties: Readonly<
    Required<LineShapeProperties>
  >;

  override updateChunkMap(chunkSize: number): ChunkChange {
    return { chunkIndexesToReload: undefined, chunkIndexesToRemove: undefined };
    // TODO
  }

  // protected override getChunksForThickLine(
  //   x1: number,
  //   y1: number,
  //   x2: number,
  //   y2: number,
  //   chunkSize: number
  // ): ChunkIndexSet {
  //   return getChunksForThickLine(
  //     this.formProperties[FormPropertyName.originX] +
  //       x1 * this.formProperties[FormPropertyName.scaleX],
  //     this.formProperties[FormPropertyName.originY] +
  //       y1 * this.formProperties[FormPropertyName.scaleY],
  //     this.formProperties[FormPropertyName.originX] +
  //       x2 * this.formProperties[FormPropertyName.scaleX],
  //     this.formProperties[FormPropertyName.originY] +
  //       y2 * this.formProperties[FormPropertyName.scaleY],
  //     chunkSize,
  //     (this.formProperties[FormPropertyName.style][StyleName.LineWidth] / 2) *
  //       this.formProperties[FormPropertyName.scaleX],
  //     (this.formProperties[FormPropertyName.style][StyleName.LineWidth] / 2) *
  //       this.formProperties[FormPropertyName.scaleY]
  //   );
  // }

  protected override radiusX(): number {
    return (
      (this.formProperties[FormPropertyName.style][StyleName.LineWidth] / 2) *
      this.formProperties[FormPropertyName.scaleX]
    );
  }

  protected override radiusY(): number {
    return (
      (this.formProperties[FormPropertyName.style][StyleName.LineWidth] / 2) *
      this.formProperties[FormPropertyName.scaleY]
    );
  }

  protected override point(index: number): Point {
    return [
      this.formProperties[FormPropertyName.originX] +
        this.formPoints[index][0] *
          this.formProperties[FormPropertyName.scaleX],
      this.formProperties[FormPropertyName.originY] +
        this.formPoints[index][1] *
          this.formProperties[FormPropertyName.scaleY],
    ];
  }
}
