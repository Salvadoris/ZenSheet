import { Rect } from '../Geometry';

export type ChunkIndex = [number, number];

interface ChunkIndexesInRange {
  chunkIndexesInside: ChunkIndexSet;
  chunkIndexesOutside: ChunkIndexSet;
}

export class ChunkIndexSet {
  #set: Set<string>;

  constructor(chunkIndexes: string[] = []) {
    this.#set = new Set<string>(chunkIndexes);
  }

  toArray() {
    return Array.from(this.#set);
  }

  addIndex(x: number, y: number) {
    this.add(this.indexToString(x, y));
  }

  add(index: string) {
    this.#set.add(index);
  }

  deleteIndex(x: number, y: number) {
    this.delete(this.indexToString(x, y));
  }

  delete(index: string) {
    this.#set.delete(index);
  }

  size() {
    return this.#set.size;
  }

  forEachIndex(callback: (x: number, y: number) => void): void {
    for (const str of this.#set) {
      const index = this.stringToIndex(str);
      callback(index[0], index[1]);
    }
  }

  forEach(callback: (index: string) => void): void {
    for (const index of this.#set) {
      callback(index);
    }
  }

  *[Symbol.iterator]() {
    for (const item of this.#set) {
      yield item;
    }
  }

  hasIndex(x: number, y: number): boolean {
    return this.has(this.indexToString(x, y));
  }

  has(index: string): boolean {
    return this.#set.has(index);
  }

  xRange(): { min: ChunkIndex; max: ChunkIndex } | undefined {
    let min: ChunkIndex | undefined = undefined;
    let max: ChunkIndex | undefined = undefined;
    this.forEachIndex((x, y) => {
      if (min) {
        if (x < min[0]) {
          min = [x, y];
        }
      } else {
        min = [x, y];
      }
      if (max) {
        if (x > max[0]) {
          max = [x, y];
        }
      } else {
        max = [x, y];
      }
    });
    if (!min || !max) {
      return undefined;
    }
    return { min: min, max: max };
  }

  yRange(): { min: ChunkIndex; max: ChunkIndex } | undefined {
    let min: ChunkIndex | undefined = undefined;
    let max: ChunkIndex | undefined = undefined;
    this.forEachIndex((x, y) => {
      if (min) {
        if (y < min[1]) {
          min = [x, y];
        }
      } else {
        min = [x, y];
      }
      if (max) {
        if (y > max[1]) {
          max = [x, y];
        }
      } else {
        max = [x, y];
      }
    });
    if (!min || !max) {
      return undefined;
    }
    return { min: min, max: max };
  }

  private indexToString(x: number, y: number): string {
    return `${x},${y}`;
  }

  private stringToIndex(str: string): ChunkIndex {
    return str.split(',').map(num => Number(num)) as ChunkIndex;
  }
}

export function chunkIndexToString(chunkIndex: ChunkIndex): string {
  return `${chunkIndex[0]},${chunkIndex[1]}`;
}

export function stringToChunkIndex(str: string): ChunkIndex {
  return str.split(',').map(num => Number(num)) as ChunkIndex;
}

export function chunkIndexInsideRange(
  chunkIndex: ChunkIndex,
  range: Rect
): boolean {
  return (
    chunkIndex[0] >= range[0] &&
    chunkIndex[0] <= range[2] &&
    chunkIndex[1] >= range[1] &&
    chunkIndex[1] <= range[3]
  );
}

export function chunkIndexesInsideRange(
  chunkIndexes: ChunkIndexSet,
  range: Rect
): ChunkIndexSet {
  const result = new ChunkIndexSet();
  chunkIndexes.forEach(chunkIndex => {
    if (chunkIndexInsideRange(stringToChunkIndex(chunkIndex), range)) {
      result.add(chunkIndex);
    }
  });
  return result;
}

export function separateChunkIndexesInsideRange(
  chunkIndexes: ChunkIndexSet,
  range: Rect
): ChunkIndexesInRange {
  const inside = new ChunkIndexSet();
  const outside = new ChunkIndexSet();
  chunkIndexes.forEach(chunkIndex => {
    if (chunkIndexInsideRange(stringToChunkIndex(chunkIndex), range)) {
      inside.add(chunkIndex);
    } else {
      outside.add(chunkIndex);
    }
  });
  return { chunkIndexesInside: inside, chunkIndexesOutside: outside };
}
