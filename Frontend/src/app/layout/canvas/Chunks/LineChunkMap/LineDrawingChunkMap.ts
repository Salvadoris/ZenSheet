import { LineDrawingProperties } from '../../DrawingProperties/LineDrawingProperties';
import { FormPropertyName } from '../../FormProperties/FormPropertyName';
import { Point, Rect } from '../../Geometry';
import { StyleName } from '../../ShapeStyles/StyleName';
import {
  chunkIndexesInsideRange,
  chunkIndexInsideRange,
  ChunkIndexSet,
  chunkIndexToString,
  stringToChunkIndex,
} from '../ChunkIndex';
import { ChunkChange } from '../FormChunkMap';

import {
  getChunksForThickLine,
  LineChunkMap,
  LineChunkSegmentMap,
  LineSegment,
} from './LineChunkMap';

export class LineDrawingChunkMap extends LineChunkMap {
  declare protected readonly formProperties: Readonly<LineDrawingProperties>;
  #lastPointIndex: number | undefined = undefined;

  override addChunkMap(chunkSize: number, chunkRange: Rect): void {
    super.addChunkMap(chunkSize, chunkRange);
    this.#lastPointIndex = this.formPoints.length - 1;
  }

  private updateNewChunkMap(chunkSize: number, chunkRange: Rect): ChunkChange {
    const existingMaxChunkSize = Math.max(...this.map.keys());
    const currentMaxChunkSize = this.maxChunkSize(chunkSize);

    let maxChunkSize = existingMaxChunkSize;
    if (currentMaxChunkSize > existingMaxChunkSize) {
      maxChunkSize = currentMaxChunkSize;

      const chunkMap = new Map<string, LineSegment[]>();
      this.addPointsToChunkMap(
        chunkMap,
        maxChunkSize,
        0,
        this.formPoints.length
      );
      this.set(maxChunkSize, chunkMap);
    }

    const maxChunkMap = this.get(maxChunkSize)!;
    const maxChunkIndexes = new ChunkIndexSet(Array.from(maxChunkMap.keys()));

    return this.updateLowerChunkMaps(
      chunkSize,
      chunkRange,
      maxChunkSize,
      maxChunkIndexes
    );
  }

  override updateChunkMap(chunkSize: number, chunkRange: Rect): ChunkChange {
    if (this.#lastPointIndex === undefined || !this.map.has(chunkSize)) {
      return {
        chunkIndexesToReload: this.chunkIndexes(chunkSize, chunkRange),
        chunkIndexesToRemove: undefined,
      };
    }

    if (this.#lastPointIndex === this.formPoints.length - 1) {
      this.updateNewChunkMap(chunkSize, chunkRange);
    }

    const maxChunkSize = this.maxChunkSize(chunkSize);
    let maxChunkMap = this.map.get(maxChunkSize);
    const prevMaxChunkMap = new Map<string, LineSegment[]>();
    if (maxChunkMap) {
      for (const [key, value] of maxChunkMap) {
        prevMaxChunkMap.set(key, JSON.parse(JSON.stringify(value)));
      }

      const segmentStarts = new Map<string, number>();
      for (const [chunkIndex, lineSegments] of maxChunkMap) {
        for (let i = 0; i < lineSegments.length; i++) {
          if (lineSegments[i][1] === this.#lastPointIndex) {
            segmentStarts.set(chunkIndex, lineSegments[i][0]);
            lineSegments.splice(i, 1);
            break;
          }
        }
      }
      this.addPointsToChunkMap(
        maxChunkMap,
        maxChunkSize,
        this.#lastPointIndex,
        this.formPoints.length,
        segmentStarts
      );
    } else {
      maxChunkMap = new Map<string, LineSegment[]>();
      this.addPointsToChunkMap(
        maxChunkMap,
        maxChunkSize,
        0,
        this.formPoints.length
      );
      this.set(maxChunkSize, maxChunkMap);
    }

    this.#lastPointIndex = this.formPoints.length - 1;

    const changedChunkIndexes = this.changedChunkIndexes(
      prevMaxChunkMap,
      maxChunkMap
    );

    if (maxChunkSize === chunkSize) {
      return {
        chunkIndexesToReload: chunkIndexesInsideRange(
          changedChunkIndexes,
          chunkRange
        ),
        chunkIndexesToRemove: undefined,
      };
    }

    return this.updateLowerChunkMaps(
      chunkSize,
      chunkRange,
      maxChunkSize,
      changedChunkIndexes
    );
  }

  private updateLowerChunkMaps(
    chunkSize: number,
    chunkRange: Rect,
    maxChunkSize: number,
    maxChunkIndexes: ChunkIndexSet
  ): ChunkChange {
    const maxMultiplier = chunkSize / maxChunkSize;
    const maxChunkRange: Rect = [
      Math.floor(chunkRange[0] * maxMultiplier),
      Math.floor(chunkRange[1] * maxMultiplier),
      Math.ceil(chunkRange[2] * maxMultiplier),
      Math.ceil(chunkRange[3] * maxMultiplier),
    ];

    let chunkIndexesToReload: ChunkIndexSet | undefined =
      chunkIndexesInsideRange(maxChunkIndexes, maxChunkRange);
    let chunkIndexesToRemove: ChunkIndexSet | undefined = undefined;

    let upperChunkSize = maxChunkSize;
    let lowerChunkSize = upperChunkSize / 2;
    let multiplier = lowerChunkSize / chunkSize;
    let lowerChunkRange = maxChunkRange;
    while (upperChunkSize > chunkSize) {
      lowerChunkRange = [
        Math.floor(chunkRange[0] * multiplier),
        Math.floor(chunkRange[1] * multiplier),
        Math.ceil(chunkRange[2] * multiplier),
        Math.ceil(chunkRange[3] * multiplier),
      ];

      if (chunkIndexesToRemove) {
        chunkIndexesToRemove = this.removeUnderlyingChunks(
          upperChunkSize,
          lowerChunkSize,
          chunkIndexesToRemove
        );
      }

      if (chunkIndexesToReload) {
        const chunkChange = this.recalcUnderlyingChunks(
          upperChunkSize,
          lowerChunkSize,
          chunkIndexesToReload,
          lowerChunkRange
        );
        chunkIndexesToReload = chunkChange.chunkIndexesToReload;
        if (chunkChange.chunkIndexesToRemove !== undefined) {
          if (chunkIndexesToRemove === undefined) {
            chunkIndexesToRemove = chunkChange.chunkIndexesToRemove;
          } else {
            for (const chunkIndex of chunkChange.chunkIndexesToRemove) {
              chunkIndexesToRemove.add(chunkIndex);
            }
          }
        }
      }

      upperChunkSize = lowerChunkSize;
      lowerChunkSize /= 2;
      multiplier = lowerChunkSize / chunkSize;
    }

    for (const [otherChunkSize] of this.map) {
      if (otherChunkSize < chunkSize) {
        this.map.delete(otherChunkSize);
      }
    }

    return {
      chunkIndexesToReload: chunkIndexesToReload,
      chunkIndexesToRemove: chunkIndexesToRemove,
    };
  }

  // override updateChunkMap(chunkSize: number, chunkRange: Rect): ChunkChange {
  //   const lastPointIndex = this.#lastPointIndexMap.get(chunkSize);
  //   if (lastPointIndex === undefined || !this.map.has(chunkSize)) {
  //     return {
  //       reloadChunkIndexes: this.chunkIndexes(chunkSize, chunkRange),
  //       removeChunkIndexes: undefined,
  //     };
  //   }

  //   if (lastPointIndex === this.formPoints.length - 1) {
  //     return { reloadChunkIndexes: undefined, removeChunkIndexes: undefined };
  //   }

  //   const chunkMap = this.map.get(chunkSize)!;

  //   const segmentStarts = new Map<string, number>();
  //   for (const [chunkIndex, lineSegments] of chunkMap) {
  //     for (let i = 0; i < lineSegments.length; i++) {
  //       if (lineSegments[i][1] === lastPointIndex) {
  //         segmentStarts.set(chunkIndex, lineSegments[i][0]);
  //         lineSegments.splice(i, 1);
  //         break;
  //       }
  //     }
  //   }

  //   this.addPointsToChunkMap(
  //     chunkMap,
  //     chunkSize,
  //     lastPointIndex,
  //     this.formPoints.length,
  //     segmentStarts
  //   );

  //   const chunkIndexes = this.chunkIndexesFromPointRange(
  //     chunkSize,
  //     lastPointIndex,
  //     this.formPoints.length
  //   );
  //   this.#lastPointIndexMap.set(chunkSize, this.formPoints.length - 1);

  //   return {
  //     reloadChunkIndexes: chunkIndexes,
  //     removeChunkIndexes: undefined,
  //   };
  // }

  // private visibleChunkIndexesFromPointRange(
  //   chunkSize: number,
  //   chunkRange: Rect,
  //   pointStartIndex: number,
  //   pointEndIndex: number
  // ): ChunkIndexSet {
  //   const chunkMap = this.map.get(chunkSize)!;
  //   const chunkIndexes = new ChunkIndexSet();
  //   for (const [chunkIndex, lineSegments] of chunkMap) {
  //     for (const segment of lineSegments) {
  //       if (
  //         pointStartIndex <= segment[1] &&
  //         pointEndIndex > segment[0] &&
  //         chunkIndexInsideRange(stringToChunkIndex(chunkIndex), chunkRange)
  //       ) {
  //         chunkIndexes.add(chunkIndex);
  //         break;
  //       }
  //     }
  //   }
  //   return chunkIndexes;
  // }

  // protected override getChunksForThickLine(
  //   x1: number,
  //   y1: number,
  //   x2: number,
  //   y2: number,
  //   chunkSize: number
  // ): ChunkIndexSet {
  //   const radius =
  //     this.formProperties[FormPropertyName.style][StyleName.LineWidth] / 2;
  //   return getChunksForThickLine(x1, y1, x2, y2, chunkSize, radius, radius);
  // }

  private recalcUnderlyingChunks(
    upperChunkSize: number,
    lowerChunkSize: number,
    upperChunkIndexes: ChunkIndexSet,
    lowerRange: Rect
  ): ChunkChange {
    let lineChunks = this.get(lowerChunkSize);
    if (!lineChunks) {
      lineChunks = new Map<string, LineSegment[]>();
      this.set(lowerChunkSize, lineChunks);
    }

    const upperChunkMap = this.get(upperChunkSize);
    if (upperChunkMap) {
      const chunkIndexesToReload = new ChunkIndexSet();
      const chunkIndexesToRemove = new ChunkIndexSet();
      const multiplier = lowerChunkSize / upperChunkSize;
      const sideLength = 1 / multiplier;

      upperChunkIndexes.forEach(upperChunkIndex => {
        const chunkMap = new Map<string, LineSegment[]>();
        const lineSegments = upperChunkMap.get(upperChunkIndex);
        if (lineSegments) {
          for (const segment of lineSegments) {
            this.addPointsToChunkMap(
              chunkMap,
              lowerChunkSize,
              segment[0],
              segment[1] + 1
            );
          }

          const [upperX, upperY] = stringToChunkIndex(upperChunkIndex);
          const startX = Math.floor(upperX / multiplier);
          const startY = Math.floor(upperY / multiplier);
          for (const [chunkIndex, lineSegments] of chunkMap) {
            const [x, y] = stringToChunkIndex(chunkIndex);
            if (
              x >= startX &&
              x < startX + sideLength &&
              y >= startY &&
              y < startY + sideLength
            ) {
              const prevLineSegments = lineChunks.get(chunkIndex);
              if (
                prevLineSegments === undefined ||
                (prevLineSegments !== undefined &&
                  this.changedLineSegments(prevLineSegments, lineSegments))
              ) {
                if (chunkIndexInsideRange([x, y], lowerRange)) {
                  lineChunks.set(chunkIndex, lineSegments);
                  chunkIndexesToReload.add(chunkIndex);
                } else {
                  lineChunks.delete(chunkIndex);
                  chunkIndexesToRemove.add(chunkIndex);
                }
              }
            }
          }
        }
      });

      return {
        chunkIndexesToReload: chunkIndexesToReload,
        chunkIndexesToRemove: chunkIndexesToRemove,
      };
    }
    return { chunkIndexesToReload: undefined, chunkIndexesToRemove: undefined };
  }

  private removeUnderlyingChunks(
    upperChunkSize: number,
    lowerChunkSize: number,
    upperChunkIndexes: ChunkIndexSet
  ): ChunkIndexSet | undefined {
    const lineSegments = this.get(lowerChunkSize);
    if (lineSegments) {
      const chunkIndexesToRemove = new ChunkIndexSet();
      const multiplier = upperChunkSize / lowerChunkSize;
      upperChunkIndexes.forEach(chunkIndex => {
        const [x, y] = stringToChunkIndex(chunkIndex);
        const startX = Math.floor(x / multiplier);
        const startY = Math.floor(y / multiplier);
        for (let newX = startX; newX < startX + multiplier; newX++) {
          for (let newY = startY; newY < startY + multiplier; newY++) {
            const newChunkIndex = chunkIndexToString([newX, newY]);
            if (lineSegments.has(newChunkIndex)) {
              lineSegments.delete(newChunkIndex);
              chunkIndexesToRemove.add(newChunkIndex);
            }
          }
        }
      });
      return chunkIndexesToRemove;
    }
    return undefined;
  }

  private changedChunkIndexes(
    prev: LineChunkSegmentMap,
    current: LineChunkSegmentMap
  ): ChunkIndexSet {
    const chunkIndexes = new ChunkIndexSet();
    for (const [chunkIndex, lineSegments] of current) {
      const prevLineSegments = prev.get(chunkIndex);
      if (prevLineSegments) {
        if (this.changedLineSegments(prevLineSegments, lineSegments)) {
          chunkIndexes.add(chunkIndex);
        }
      } else {
        chunkIndexes.add(chunkIndex);
      }
    }
    return chunkIndexes;
  }

  private changedLineSegments(prev: LineSegment[], current: LineSegment[]) {
    return JSON.stringify(prev) !== JSON.stringify(current);
  }

  protected override radiusX(): number {
    return this.formProperties[FormPropertyName.style][StyleName.LineWidth] / 2;
  }

  protected override radiusY(): number {
    return this.formProperties[FormPropertyName.style][StyleName.LineWidth] / 2;
  }

  protected override point(index: number): Point {
    return this.formPoints[index];
  }
}
