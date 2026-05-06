import { StraightLineDrawingProperties } from '../../DrawingProperties/StraightLineDrawingProperties';
import { FormPropertyName } from '../../FormProperties/FormPropertyName';
import { Rect } from '../../Geometry';
import { StyleName } from '../../ShapeStyles/StyleName';
import { ChunkIndexSet } from '../ChunkIndex';
import { ChunkChange } from '../FormChunkMap';

import {
  getChunksForThickLineInChunkRange,
  StraightLineChunkMap,
} from './StraightLineChunkMap';

interface StraightLineChangeProperties {
  lastWidth: number;
  lastHeight: number;
}

export class StraightLineDrawingChunkMap extends StraightLineChunkMap {
  declare protected readonly formProperties: Readonly<StraightLineDrawingProperties>;
  #lastPropertiesMap = new Map<number, StraightLineChangeProperties>();

  override addChunkMap(chunkSize: number, chunkRange: Rect): void {
    super.addChunkMap(chunkSize, chunkRange);
    this.#lastPropertiesMap.set(chunkSize, {
      lastWidth: this.formWidth,
      lastHeight: this.formHeight,
    });
  }

  override updateChunkMap(chunkSize: number, chunkRange: Rect): ChunkChange {
    const lastProperties = this.#lastPropertiesMap.get(chunkSize);
    if (lastProperties === undefined || !this.map.has(chunkSize)) {
      this.addChunkMap(chunkSize, chunkRange);
      return {
        chunkIndexesToReload: this.map.get(chunkSize)!,
        chunkIndexesToRemove: undefined,
      };
    }

    if (
      lastProperties.lastWidth === this.formWidth &&
      lastProperties.lastHeight === this.formHeight
    ) {
      return {
        chunkIndexesToReload: undefined,
        chunkIndexesToRemove: undefined,
      };
    }

    if (
      (lastProperties.lastWidth < 0 && this.formWidth > 0) ||
      (lastProperties.lastWidth > 0 && this.formWidth < 0) ||
      (lastProperties.lastHeight < 0 && this.formHeight > 0) ||
      (lastProperties.lastHeight > 0 && this.formHeight < 0)
    ) {
      return this.updateFullChunkMap(chunkSize, chunkRange);
    }

    const widthZero = this.formWidth === 0 && lastProperties.lastWidth === 0;
    const heightZero = this.formHeight === 0 && lastProperties.lastHeight === 0;

    if (widthZero || heightZero) {
      const chunkIndexes = this.get(chunkSize)!;
      let reloadChunkIndexes: ChunkIndexSet | undefined = undefined;
      let removeChunkIndexes: ChunkIndexSet | undefined = undefined;
      const radius =
        this.formProperties[FormPropertyName.style][StyleName.LineWidth] / 2;
      const updatedChunkIndexes = getChunksForThickLineInChunkRange(
        this.formOriginX + this.formWidth,
        this.formOriginY + this.formHeight,
        this.formOriginX + lastProperties.lastWidth,
        this.formOriginY + lastProperties.lastHeight,
        chunkSize,
        radius,
        radius,
        chunkRange
      );

      const widthSmaller =
        Math.abs(this.formWidth) < Math.abs(lastProperties.lastWidth);
      const heightSmaller =
        Math.abs(this.formHeight) < Math.abs(lastProperties.lastHeight);

      if ((heightZero && widthSmaller) || (widthZero && heightSmaller)) {
        updatedChunkIndexes.forEach(chunkIndex => {
          if (!chunkIndexes.has(chunkIndex)) {
            chunkIndexes.delete(chunkIndex);
            if (!removeChunkIndexes) {
              removeChunkIndexes = new ChunkIndexSet([chunkIndex]);
            } else {
              removeChunkIndexes.add(chunkIndex);
            }
          } else {
            if (!reloadChunkIndexes) {
              reloadChunkIndexes = new ChunkIndexSet([chunkIndex]);
            } else {
              reloadChunkIndexes.add(chunkIndex);
            }
          }
        });
      } else if (
        (heightZero && !widthSmaller) ||
        (widthZero && !heightSmaller)
      ) {
        updatedChunkIndexes.forEach(chunkIndex => chunkIndexes.add(chunkIndex));
        reloadChunkIndexes = updatedChunkIndexes;
      }

      this.#lastPropertiesMap.set(chunkSize, {
        lastWidth: this.formWidth,
        lastHeight: this.formHeight,
      });

      return {
        chunkIndexesToReload: reloadChunkIndexes,
        chunkIndexesToRemove: removeChunkIndexes,
      };
    }

    return this.updateFullChunkMap(chunkSize, chunkRange);
  }

  private updateFullChunkMap(chunkSize: number, chunkRange: Rect): ChunkChange {
    const oldChunkIndexes = this.map.get(chunkSize)!;
    const newChunkIndexes = this.newChunkIndexes(chunkSize, chunkRange);
    const removedChunkIndexes = new ChunkIndexSet();
    oldChunkIndexes.forEach(index => {
      if (!newChunkIndexes.has(index)) {
        removedChunkIndexes.add(index);
      }
    });

    this.map.set(chunkSize, newChunkIndexes);

    this.#lastPropertiesMap.set(chunkSize, {
      lastWidth: this.formWidth,
      lastHeight: this.formHeight,
    });
    return {
      chunkIndexesToReload: newChunkIndexes,
      chunkIndexesToRemove: removedChunkIndexes,
    };
  }
}
