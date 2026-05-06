import { NonLineDrawingProperties } from '../DrawingProperties/DrawingProperties';
import { FormProperties } from '../FormProperties/FormProperties';
import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { Rect } from '../Geometry';
import { ShapeProperties } from '../ShapeProperties/ShapeProperties';

import { ChunkIndexSet, stringToChunkIndex } from './ChunkIndex';
import { LineChunkSegmentMap } from './LineChunkMap/LineChunkMap';

export interface ChunkChange {
  chunkIndexesToReload?: ChunkIndexSet;
  chunkIndexesToRemove?: ChunkIndexSet;
}

export abstract class FormChunkMap {
  protected readonly formProperties: Readonly<FormProperties>;

  constructor(formProperties: FormProperties) {
    this.formProperties = formProperties;
  }

  get formStyle() {
    return this.formProperties[FormPropertyName.style];
  }

  get formOriginX() {
    return this.formProperties[FormPropertyName.originX];
  }

  get formOriginY() {
    return this.formProperties[FormPropertyName.originY];
  }

  get formWidth() {
    return this.formProperties[FormPropertyName.width];
  }

  get formHeight() {
    return this.formProperties[FormPropertyName.height];
  }

  abstract get(
    chunkSize: number
  ): ChunkIndexSet | LineChunkSegmentMap | undefined;

  abstract set(
    chunkSize: number,
    chunkMap: ChunkIndexSet | LineChunkSegmentMap
  ): void;

  abstract has(chunkSize: number): boolean;

  abstract size(): number;

  abstract keys(): MapIterator<number>;

  abstract chunkIndexes(chunkSize: number, chunkRange: Rect): ChunkIndexSet;

  abstract addChunkMap(chunkSize: number, chunkRange: Rect): void;

  abstract extendChunkMap(
    chunkSize: number,
    chunkRange: Rect,
    chunkIndexes: ChunkIndexSet
  ): ChunkIndexSet | undefined;

  abstract updateChunkMap(chunkSize: number, chunkRange: Rect): ChunkChange;

  // protected abstract addAdditionalChunkMap(
  //   chunkSize: number,
  //   chunkRange: Rect
  // ): void;
}

export abstract class NonLineChunkMap extends FormChunkMap {
  protected map = new Map<number, ChunkIndexSet>();
  declare protected readonly formProperties: Readonly<
    ShapeProperties | NonLineDrawingProperties
  >;

  override set(chunkSize: number, chunkMap: ChunkIndexSet): void {
    this.map.set(chunkSize, chunkMap);
  }

  override has(chunkSize: number): boolean {
    return this.map.has(chunkSize);
  }

  override size(): number {
    return this.map.size;
  }

  override keys(): MapIterator<number> {
    return this.map.keys();
  }

  override get(chunkSize: number) {
    return this.map.get(chunkSize);
  }

  override addChunkMap(chunkSize: number, chunkRange: Rect): void {
    this.map.set(chunkSize, this.newChunkIndexes(chunkSize, chunkRange));
    // if (this.map.size > 0) {
    //   this.addAdditionalChunkMap(chunkSize, chunkRange);
    // } else {
    //   this.map.set(chunkSize, this.newChunkIndexes(chunkSize, chunkRange));
    // }
  }

  override chunkIndexes(chunkSize: number, chunkRange: Rect): ChunkIndexSet {
    const chunks = this.map.get(chunkSize);
    if (chunks) {
      return chunks;
    } else {
      this.addChunkMap(chunkSize, chunkRange);
      return this.map.get(chunkSize)!;
    }
  }

  protected abstract newChunkIndexes(
    chunkSize: number,
    chunkRange: Rect
  ): ChunkIndexSet;

  protected removeChunkIndexesOutsideOfChunkRange(
    chunkSize: number,
    chunkRange: Rect
  ): void {
    const chunkIndexes = this.get(chunkSize);
    if (chunkIndexes) {
      chunkIndexes.forEach(chunkIndex => {
        const [x, y] = stringToChunkIndex(chunkIndex);
        const outside = !(
          x >= chunkRange[0] &&
          x <= chunkRange[2] &&
          y >= chunkRange[1] &&
          y <= chunkRange[3]
        );
        if (outside) {
          chunkIndexes.delete(chunkIndex);
        }
      });
    }
  }

  // protected override addAdditionalChunkMap(
  //   chunkSize: number,
  //   chunkRange: Rect
  // ): void {
  //   this.map.set(chunkSize, this.newChunkIndexes(chunkSize, chunkRange));
  //   // const smallerChunkSizes = Array.from(this.map.keys()).filter(
  //   //   k => k < chunkSize
  //   // );
  //   // if (smallerChunkSizes.length === 0) {
  //   //   this.map.set(chunkSize, this.newChunkIndexes(chunkSize));
  //   // } else {
  //   //   const otherChunkSize = Math.max(...smallerChunkSizes);
  //   //   const otherchunkIndexes = this.get(otherChunkSize)!;
  //   //   const newChunkIndexes = new ChunkIndexSet();
  //   //   const multiplier = chunkSize / otherChunkSize;
  //   //   otherchunkIndexes.forEachIndex((x, y) => {
  //   //     newChunkIndexes.addIndex(
  //   //       Math.floor(x / multiplier),
  //   //       Math.floor(y / multiplier)
  //   //     );
  //   //   });
  //   //   this.map.set(chunkSize, newChunkIndexes);
  //   // }
  // }
}

export function chunkXMinInChunkRange(x: number, chunkRange: Rect) {
  return Math.min(Math.max(x, chunkRange[0]), chunkRange[2] + 1);
}

export function chunkXMaxInChunkRange(x: number, chunkRange: Rect) {
  return Math.min(Math.max(x, chunkRange[0] - 1), chunkRange[2]);
}

export function chunkYMinInChunkRange(y: number, chunkRange: Rect) {
  return Math.min(Math.max(y, chunkRange[1]), chunkRange[3] + 1);
}

export function chunkYMaxInChunkRange(y: number, chunkRange: Rect) {
  return Math.min(Math.max(y, chunkRange[1] - 1), chunkRange[3]);
}
