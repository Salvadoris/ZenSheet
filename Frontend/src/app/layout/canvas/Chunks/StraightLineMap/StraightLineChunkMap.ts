import { StraightLineDrawingProperties } from '../../DrawingProperties/StraightLineDrawingProperties';
import { FormPropertyName } from '../../FormProperties/FormPropertyName';
import { Rect } from '../../Geometry';
import { StraightLineShapeProperties } from '../../ShapeProperties/StraightLineShapeProperties';
import { StraightLineStyle } from '../../ShapeStyles/StraightLineStyle';
import { StyleName } from '../../ShapeStyles/StyleName';
import { ChunkIndexSet, chunkIndexToString } from '../ChunkIndex';
import {
  chunkXMaxInChunkRange,
  chunkXMinInChunkRange,
  chunkYMaxInChunkRange,
  chunkYMinInChunkRange,
  NonLineChunkMap,
} from '../FormChunkMap';
import { segmentIntersectsRect } from '../LineChunkMap/LineChunkMap';

export abstract class StraightLineChunkMap extends NonLineChunkMap {
  declare protected readonly formProperties: Readonly<
    Required<StraightLineShapeProperties> | StraightLineDrawingProperties
  >;

  constructor(
    formProperties: Readonly<
      Required<StraightLineShapeProperties> | StraightLineDrawingProperties
    >
  ) {
    super(formProperties);
  }

  override get formStyle(): StraightLineStyle {
    return this.formProperties[FormPropertyName.style];
  }

  protected override newChunkIndexes(
    chunkSize: number,
    chunkRange: Rect
  ): ChunkIndexSet {
    const radius =
      this.formProperties[FormPropertyName.style][StyleName.LineWidth] / 2;
    return getChunksForThickLineInChunkRange(
      this.formOriginX,
      this.formOriginY,
      this.formOriginX + this.formWidth,
      this.formOriginY + this.formHeight,
      chunkSize,
      radius,
      radius,
      chunkRange
    );
  }

  override extendChunkMap(
    chunkSize: number,
    chunkRange: Rect,
    chunkIndexes: ChunkIndexSet
  ): ChunkIndexSet | undefined {
    const currentChunkIndexes = this.get(chunkSize);
    if (!currentChunkIndexes) {
      this.addChunkMap(chunkSize, chunkRange);
      return this.get(chunkSize)!;
    }

    const newChunkIndexes = this.newChunkIndexes(chunkSize, chunkRange);

    const chunkIndexesToAdd = new ChunkIndexSet();

    chunkIndexes.forEach(chunkIndex => {
      if (
        !currentChunkIndexes.has(chunkIndex) &&
        newChunkIndexes.has(chunkIndex)
      ) {
        chunkIndexesToAdd.add(chunkIndex);
        currentChunkIndexes.add(chunkIndex);
      }
    });

    if (chunkIndexesToAdd.size() > 0) {
      return chunkIndexesToAdd;
    }
    return undefined;
  }
}

export function getChunksForThickLineInChunkRange(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  chunkSize: number,
  radiusX: number,
  radiusY: number,
  chunkRange: Rect
): ChunkIndexSet {
  const minX = Math.min(x1, x2) - radiusX;
  const maxX = Math.max(x1, x2) + radiusX;
  const minY = Math.min(y1, y2) - radiusY;
  const maxY = Math.max(y1, y2) + radiusY;

  const minCol = chunkXMinInChunkRange(
    Math.floor(minX / chunkSize),
    chunkRange
  );
  const maxCol = chunkXMaxInChunkRange(
    Math.ceil(maxX / chunkSize) - 1,
    chunkRange
  );
  const minRow = chunkYMinInChunkRange(
    Math.floor(minY / chunkSize),
    chunkRange
  );
  const maxRow = chunkYMaxInChunkRange(
    Math.ceil(maxY / chunkSize) - 1,
    chunkRange
  );

  if (minCol === maxCol && minRow === maxRow) {
    return new ChunkIndexSet([chunkIndexToString([minCol, minRow])]);
  }

  const result = new ChunkIndexSet();

  if (minCol === maxCol) {
    for (let row = minRow; row <= maxRow; row++) {
      result.addIndex(minCol, row);
    }
    return result;
  }
  if (minRow === maxRow) {
    for (let col = minCol; col <= maxCol; col++) {
      result.addIndex(col, minRow);
    }
    return result;
  }

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
