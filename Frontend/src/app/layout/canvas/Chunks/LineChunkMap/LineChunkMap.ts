import { LineDrawingProperties } from '../../DrawingProperties/LineDrawingProperties';
import { FormPropertyName } from '../../FormProperties/FormPropertyName';
import { Point, Rect } from '../../Geometry';
import { LineShapeProperties } from '../../ShapeProperties/LineShapeProperties';
import { LineStyle } from '../../ShapeStyles/LineStyle';
import {
  chunkIndexInsideRange,
  ChunkIndexSet,
  chunkIndexToString,
  stringToChunkIndex,
} from '../ChunkIndex';
import { chunkRangeInRow } from '../EllipseChunkMap/EllipseChunkMap';
import { ChunkChange, FormChunkMap } from '../FormChunkMap';

/** An inclusive range of point indices defined as [start, end]. */
export type LineSegment = [number, number];

export type LineChunkSegmentMap = Map<string, LineSegment[]>;

export abstract class LineChunkMap extends FormChunkMap {
  protected map = new Map<number, LineChunkSegmentMap>();
  declare protected readonly formProperties: Readonly<
    Required<LineShapeProperties> | LineDrawingProperties
  >;

  override get formStyle(): LineStyle {
    return this.formProperties[FormPropertyName.style];
  }

  get formPoints() {
    return this.formProperties[FormPropertyName.points];
  }

  override set(chunkSize: number, chunkMap: LineChunkSegmentMap): void {
    this.map.set(chunkSize, chunkMap);
  }

  override has(scaleIndex: number): boolean {
    return this.map.has(scaleIndex);
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

  override chunkIndexes(chunkSize: number, chunkRange: Rect): ChunkIndexSet {
    const chunkMap = this.map.get(chunkSize);
    if (chunkMap) {
      return new ChunkIndexSet(Array.from(chunkMap.keys()));
    } else {
      this.addChunkMap(chunkSize, chunkRange);
      return new ChunkIndexSet(Array.from(this.map.get(chunkSize)!.keys()));
    }
  }

  chunkMap(chunkSize: number, chunkRange: Rect): LineChunkSegmentMap {
    const chunkMap = this.map.get(chunkSize);
    if (chunkMap) {
      return chunkMap;
    } else {
      this.addChunkMap(chunkSize, chunkRange);
      return this.map.get(chunkSize)!;
    }
  }

  override addChunkMap(chunkSize: number, chunkRange: Rect): void {
    if (this.formPoints.length < 2) {
      return;
    }

    // this.map.set(chunkSize, this.newChunkMap(chunkSize, chunkRange));
    this.setChunkMap(chunkSize, chunkRange);

    // if (this.map.size > 0) {
    //   this.addAdditionalChunkMap(chunkSize, chunkRange);
    // } else {
    //   this.map.set(chunkSize, this.newChunkMap(chunkSize, chunkRange));
    // }
  }

  abstract override updateChunkMap(
    chunkSize: number,
    chunkRange: Rect
  ): ChunkChange;

  override extendChunkMap(
    chunkSize: number,
    chunkRange: Rect,
    chunkIndexes: ChunkIndexSet
  ): ChunkIndexSet | undefined {
    const chunkMap = this.map.get(chunkSize);

    if (!chunkMap) {
      return this.chunkIndexes(chunkSize, chunkRange);
    }

    const currentChunkIndexes = new ChunkIndexSet(Array.from(chunkMap.keys()));

    this.setChunkMap(chunkSize, chunkRange);

    const newChunkIndexes = this.chunkIndexes(chunkSize, chunkRange);

    const chunkIndexesToAdd = new ChunkIndexSet();

    chunkIndexes.forEach(chunkIndex => {
      if (
        !currentChunkIndexes.has(chunkIndex) &&
        newChunkIndexes.has(chunkIndex)
      ) {
        chunkIndexesToAdd.add(chunkIndex);
      }
    });

    if (chunkIndexesToAdd.size() > 0) {
      return chunkIndexesToAdd;
    }
    return undefined;
  }

  // protected override addAdditionalChunkMap(
  //   chunkSize: number,
  //   chunkRange: Rect
  // ): void {
  //   const smallerChunkSizes = Array.from(this.map.keys()).filter(
  //     k => k < chunkSize
  //   );
  //   if (smallerChunkSizes.length === 0) {
  //     this.map.set(chunkSize, this.newChunkMap(chunkSize, chunkRange));
  //   } else {
  //     const otherChunkSize = Math.max(...smallerChunkSizes);
  //     const otherchunkMap = this.get(otherChunkSize)!;
  //     const newChunkMap = new Map<string, LineSegment[]>();
  //     const multiplier = chunkSize / otherChunkSize;
  //     for (const [chunkIndex, lineSegments] of otherchunkMap) {
  //       const [x, y] = stringToChunkIndex(chunkIndex);
  //       const newChunkIndex = chunkIndexToString([
  //         Math.floor(x / multiplier),
  //         Math.floor(y / multiplier),
  //       ]);
  //       const newlineSegments = newChunkMap.get(newChunkIndex);

  //       if (newlineSegments) {
  //         for (const segment of lineSegments) {
  //           let overlapped = false;
  //           for (let i = 0; i < newlineSegments.length; i++) {
  //             const newSegment = newlineSegments[i];
  //             if (segment[0] <= newSegment[1] && newSegment[0] <= segment[1]) {
  //               newlineSegments[i] = [
  //                 Math.min(segment[0], newSegment[0]),
  //                 Math.max(segment[1], newSegment[1]),
  //               ];
  //               overlapped = true;
  //               break;
  //             }
  //           }
  //           if (!overlapped) {
  //             newlineSegments.push(segment);
  //           }
  //         }
  //       } else {
  //         newChunkMap.set(newChunkIndex, lineSegments);
  //       }
  //     }
  //     this.map.set(chunkSize, newChunkMap);
  //   }
  // }

  // protected newChunkMap(
  //   chunkSize: number,
  //   chunkRange: Rect
  // ): LineChunkSegmentMap {
  //   const chunkMap = new Map<string, LineSegment[]>();
  //   this.addPointsToChunkMap(chunkMap, chunkSize, 0, this.formPoints.length);
  //   return chunkMap;
  // }

  setChunkMap(chunkSize: number, chunkRange: Rect) {
    this.map.clear();

    const maxChunkSize = this.maxChunkSize(chunkSize);

    const chunkMap = new Map<string, LineSegment[]>();
    this.addPointsToChunkMap(chunkMap, maxChunkSize, 0, this.formPoints.length);
    this.set(maxChunkSize, chunkMap);

    if (maxChunkSize !== chunkSize) {
      for (
        let currentChunkSize = maxChunkSize;
        currentChunkSize > chunkSize;
        currentChunkSize /= 2
      ) {
        const map = this.get(currentChunkSize);
        if (map === undefined) {
          throw new Error(
            `LineChunkMap does not have chunkSize: ${currentChunkSize}`
          );
        }

        const nextChunkSize = currentChunkSize / 2;
        const multiplier = currentChunkSize / chunkSize;
        const currentChunkRange: Rect = [
          Math.floor(chunkRange[0] / multiplier),
          Math.floor(chunkRange[1] / multiplier),
          Math.ceil(chunkRange[2] / multiplier) - 1,
          Math.ceil(chunkRange[3] / multiplier) - 1,
        ];

        const chunkMap = new Map<string, LineSegment[]>();

        for (const [upperChunkIndex, lineSegments] of map) {
          const tmpChunkMap = new Map<string, LineSegment[]>();
          if (
            chunkIndexInsideRange(
              stringToChunkIndex(upperChunkIndex),
              currentChunkRange
            )
          ) {
            for (const segment of lineSegments) {
              this.addPointsToChunkMap(
                tmpChunkMap,
                nextChunkSize,
                segment[0],
                segment[1] + 1
              );

              const [upperX, upperY] = stringToChunkIndex(upperChunkIndex);
              const startX = Math.floor(upperX / multiplier);
              const startY = Math.floor(upperY / multiplier);

              for (const [chunkIndex, lineSegments] of tmpChunkMap) {
                const [x, y] = stringToChunkIndex(chunkIndex);
                if (
                  x >= startX &&
                  x < startX + multiplier &&
                  y >= startY &&
                  y < startY + multiplier
                ) {
                  chunkMap.set(chunkIndex, lineSegments);
                }
              }
            }
          }
        }

        if (chunkMap.size > 0) {
          this.set(nextChunkSize, chunkMap);
        }
      }
    }
  }

  protected maxChunkSize(chunkSize: number): number {
    const formXMin = Math.min(
      this.formOriginX,
      this.formOriginX + this.formWidth
    );
    const formXMax = Math.max(
      this.formOriginX,
      this.formOriginX + this.formWidth
    );
    const formYMin = Math.min(
      this.formOriginY,
      this.formOriginY + this.formHeight
    );
    const formYMax = Math.max(
      this.formOriginY,
      this.formOriginY + this.formHeight
    );

    let maxChunkSize = chunkSize;

    while (true) {
      const chunkXMin = Math.floor(formXMin / maxChunkSize);
      const chunkXMax = Math.ceil(formXMax / maxChunkSize) - 1;
      const chunkYMin = Math.floor(formYMin / maxChunkSize);
      const chunkYMax = Math.ceil(formYMax / maxChunkSize) - 1;

      if (
        (chunkXMin === chunkXMax || chunkXMin + 1 === chunkXMax) &&
        (chunkYMin === chunkYMax || chunkYMin + 1 === chunkYMax)
      ) {
        if (maxChunkSize === chunkSize) {
          break;
        }
        maxChunkSize /= 2;
        break;
      }
      maxChunkSize *= 2;
    }
    return maxChunkSize;
  }

  protected addPointsToChunkMap(
    chunkMap: LineChunkSegmentMap,
    chunkSize: number,
    pointStartIndex: number,
    pointEndIndex: number,
    segmentStarts = new Map<string, number>()
  ) {
    const radiusX = this.radiusX();
    const radiusY = this.radiusY();
    let prevPoint = this.point(pointStartIndex);
    let prevPointChunks = getChunksFromEllipse(
      prevPoint[0],
      prevPoint[1],
      radiusX,
      radiusY,
      chunkSize
    );
    for (let i = pointStartIndex + 1; i < pointEndIndex; i++) {
      const currentPoint = this.point(i);
      const currentPointChunks = getChunksFromEllipse(
        currentPoint[0],
        currentPoint[1],
        radiusX,
        radiusY,
        chunkSize
      );
      let chunkIndexes = getChunksForSimpleThickLine(
        prevPointChunks,
        currentPointChunks
      );

      if (!chunkIndexes) {
        chunkIndexes = getChunksForThickLine(
          prevPoint[0],
          prevPoint[1],
          currentPoint[0],
          currentPoint[1],
          chunkSize,
          radiusX,
          radiusY
        );
      }

      prevPoint = currentPoint;
      prevPointChunks = currentPointChunks;

      if (i === 1) {
        chunkIndexes.forEach(chunkIndex => {
          segmentStarts.set(chunkIndex, 0);
        });
      }

      for (const [chunkIndex, firstPointIndex] of segmentStarts) {
        if (!chunkIndexes.has(chunkIndex)) {
          const lineSegments = chunkMap.get(chunkIndex);
          if (lineSegments) {
            lineSegments.push([firstPointIndex, i - 1]);
          } else {
            chunkMap.set(chunkIndex, [[firstPointIndex, i - 1]]);
          }
          segmentStarts.delete(chunkIndex);
        }
      }

      chunkIndexes.forEach(chunkIndex => {
        if (!segmentStarts.has(chunkIndex)) {
          segmentStarts.set(chunkIndex, i - 1);
        }
      });

      if (i === pointEndIndex - 1) {
        for (const [chunkIndex, firstPointIndex] of segmentStarts) {
          const lineSegments = chunkMap.get(chunkIndex);
          if (lineSegments) {
            lineSegments.push([firstPointIndex, i]);
          } else {
            chunkMap.set(chunkIndex, [[firstPointIndex, i]]);
          }
        }
      }
    }
  }

  // protected addPointsToChunkMap(
  //   chunkMap: LineChunkSegmentMap,
  //   chunkSize: number,
  //   pointStartIndex: number,
  //   pointEndIndex: number,
  //   segmentStarts = new Map<string, number>()
  // ) {
  //   const radiusX = this.radiusX();
  //   const radiusY = this.radiusY();
  //   for (let i = pointStartIndex + 1; i < pointEndIndex; i++) {
  //     const p1 = this.point(i - 1);
  //     const p2 = this.point(i);
  //     const chunkIndexes = getChunksForThickLine(
  //       p1[0],
  //       p1[1],
  //       p2[0],
  //       p2[1],
  //       chunkSize,
  //       radiusX,
  //       radiusY
  //     );

  //     if (i === 1) {
  //       chunkIndexes.forEach(chunkIndex => {
  //         segmentStarts.set(chunkIndex, 0);
  //       });
  //     }

  //     for (const [chunkIndex, firstPointIndex] of segmentStarts) {
  //       if (!chunkIndexes.has(chunkIndex)) {
  //         const lineSegments = chunkMap.get(chunkIndex);
  //         if (lineSegments) {
  //           lineSegments.push([firstPointIndex, i - 1]);
  //         } else {
  //           chunkMap.set(chunkIndex, [[firstPointIndex, i - 1]]);
  //         }
  //         segmentStarts.delete(chunkIndex);
  //       }
  //     }

  //     chunkIndexes.forEach(chunkIndex => {
  //       if (!segmentStarts.has(chunkIndex)) {
  //         segmentStarts.set(chunkIndex, i - 1);
  //       }
  //     });

  //     if (i === pointEndIndex - 1) {
  //       for (const [chunkIndex, firstPointIndex] of segmentStarts) {
  //         const lineSegments = chunkMap.get(chunkIndex);
  //         if (lineSegments) {
  //           lineSegments.push([firstPointIndex, i]);
  //         } else {
  //           chunkMap.set(chunkIndex, [[firstPointIndex, i]]);
  //         }
  //       }
  //     }
  //   }
  // }

  // protected abstract getChunksForThickLine(
  //   x1: number,
  //   y1: number,
  //   x2: number,
  //   y2: number,
  //   chunkSize: number
  // ): ChunkIndexSet;

  protected abstract radiusX(): number;

  protected abstract radiusY(): number;

  protected abstract point(index: number): Point;
}

function getChunksFromEllipse(
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  chunkSize: number
): ChunkIndexSet {
  const xMin = Math.floor((centerX - radiusX) / chunkSize);
  const xMax = Math.ceil((centerX + radiusX) / chunkSize) - 1;
  const yMin = Math.floor((centerY - radiusY) / chunkSize);
  const yMax = Math.ceil((centerY + radiusY) / chunkSize) - 1;

  if (xMin === xMax && yMin === yMax) {
    return new ChunkIndexSet([chunkIndexToString([xMin, yMin])]);
  }

  const result = new ChunkIndexSet();

  if (xMin === xMax) {
    for (let y = yMin; y <= yMax; y++) {
      result.addIndex(xMin, y);
    }
    return result;
  }

  if (yMin === yMax) {
    for (let x = xMin; x <= xMax; x++) {
      result.addIndex(x, yMin);
    }
    return result;
  }

  const sizedCenterX = centerX / chunkSize;
  const sizedCenterY = centerY / chunkSize;
  const sizedRadiusX = radiusX / chunkSize;
  const sizedRadiusY = radiusY / chunkSize;
  for (let y = yMin; y <= yMax; y++) {
    const range = chunkRangeInRow(
      y,
      xMin,
      xMax,
      sizedCenterX,
      sizedCenterY,
      sizedRadiusX,
      sizedRadiusY
    );
    if (range) {
      const [min, max] = range;
      for (let x = min; x <= max; x++) {
        result.addIndex(x, y);
      }
    }
  }

  return result;
}

function getChunksForSimpleThickLine(
  firstChunkIndexes: ChunkIndexSet,
  secondChunkIndexes: ChunkIndexSet
): ChunkIndexSet | undefined {
  if (
    JSON.stringify(firstChunkIndexes.toArray()) ===
    JSON.stringify(secondChunkIndexes.toArray())
  ) {
    return secondChunkIndexes;
  }

  const firstXRange = firstChunkIndexes.xRange();
  const secondXRange = secondChunkIndexes.xRange();
  if (firstXRange && secondXRange) {
    if (
      firstXRange.min[0] === firstXRange.max[0] &&
      secondXRange.min[0] === secondXRange.max[0]
    ) {
      const result = new ChunkIndexSet();
      firstChunkIndexes.forEach(chunkIndex => result.add(chunkIndex));
      secondChunkIndexes.forEach(chunkIndex => result.add(chunkIndex));

      for (let x = firstXRange.min[0]; x <= firstXRange.max[0]; x++) {
        for (
          let y = Math.min(firstXRange.min[1], secondXRange.min[1]);
          y <= Math.max(firstXRange.max[1], secondXRange.max[1]);
          y++
        ) {
          result.addIndex(x, y);
        }
      }

      return result;
    }
  } else {
    return undefined;
  }

  const firstYRange = firstChunkIndexes.yRange();
  const secondYRange = secondChunkIndexes.yRange();
  if (firstYRange && secondYRange) {
    if (
      firstYRange.min[0] === firstYRange.max[0] &&
      secondYRange.min[0] === secondYRange.max[0]
    ) {
      const result = new ChunkIndexSet();
      firstChunkIndexes.forEach(chunkIndex => result.add(chunkIndex));
      secondChunkIndexes.forEach(chunkIndex => result.add(chunkIndex));

      for (let y = firstYRange.min[1]; y <= firstYRange.max[1]; y++) {
        for (
          let x = Math.min(firstYRange.min[0], secondYRange.min[0]);
          x <= Math.max(firstYRange.max[0], secondYRange.max[0]);
          x++
        ) {
          result.addIndex(x, y);
        }
      }
      return result;
    }
  } else {
    return undefined;
  }

  return undefined;
}

export function getChunksForThickLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  chunkSize: number,
  radiusX: number,
  radiusY: number
): ChunkIndexSet {
  const minX = Math.min(x1, x2) - radiusX;
  const maxX = Math.max(x1, x2) + radiusX;
  const minY = Math.min(y1, y2) - radiusY;
  const maxY = Math.max(y1, y2) + radiusY;

  const minCol = Math.floor(minX / chunkSize);
  const maxCol = Math.ceil(maxX / chunkSize) - 1;
  const minRow = Math.floor(minY / chunkSize);
  const maxRow = Math.ceil(maxY / chunkSize) - 1;

  const result = new ChunkIndexSet();

  const sx = 1 / radiusX;
  const sy = 1 / radiusY;

  const ax = x1 * sx;
  const ay = y1 * sy;
  const bx = x2 * sx;
  const by = y2 * sy;

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const rx = col * chunkSize;
      const ry = row * chunkSize;

      const rxMin = rx * sx - 1;
      const ryMin = ry * sy - 1;
      const rxMax = (rx + chunkSize) * sx + 1;
      const ryMax = (ry + chunkSize) * sy + 1;

      if (segmentIntersectsRect(ax, ay, bx, by, rxMin, ryMin, rxMax, ryMax)) {
        result.addIndex(col, row);
      }
    }
  }

  return result;
}

export function segmentIntersectsRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rxMin: number,
  ryMin: number,
  rxMax: number,
  ryMax: number
): boolean {
  let t0 = 0;
  let t1 = 1;

  const dx = x2 - x1;
  const dy = y2 - y1;

  const checks = [
    [-dx, x1 - rxMin],
    [dx, rxMax - x1],
    [-dy, y1 - ryMin],
    [dy, ryMax - y1],
  ];

  for (const [p, q] of checks) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }

  return true;
}
