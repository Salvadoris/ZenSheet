import { EllipseDrawingProperties } from '../../DrawingProperties/EllipseDrawingProperties';
import { FormPropertyName } from '../../FormProperties/FormPropertyName';
import { Rect } from '../../Geometry';
import { EllipseShapeProperties } from '../../ShapeProperties/EllipseShapeProperties';
import { EllipseStyle } from '../../ShapeStyles/EllipseStyle';
import { StyleName } from '../../ShapeStyles/StyleName';
import { ChunkIndexSet, stringToChunkIndex } from '../ChunkIndex';
import {
  chunkXMaxInChunkRange,
  chunkXMinInChunkRange,
  chunkYMaxInChunkRange,
  chunkYMinInChunkRange,
  NonLineChunkMap,
} from '../FormChunkMap';

export enum EllipseType {
  Filled = 'Filled',
  Border = 'Border',
  Transparent = 'Transparent',
  FilledBorder = 'FilledBorder',
}

export abstract class EllipseChunkMap extends NonLineChunkMap {
  declare protected readonly formProperties: Readonly<
    Required<EllipseShapeProperties> | EllipseDrawingProperties
  >;
  protected readonly ellipseType: EllipseType;

  constructor(
    formProperties: Readonly<
      Required<EllipseShapeProperties> | EllipseDrawingProperties
    >
  ) {
    super(formProperties);
    const isColorTransparent =
      this.formStyle[StyleName.Color] === 'transparent';
    const isBackgroundColorTransparent =
      this.formStyle[StyleName.BackgroundColor] === 'transparent';
    if (isColorTransparent && isBackgroundColorTransparent) {
      this.ellipseType = EllipseType.Transparent;
    } else if (isColorTransparent) {
      this.ellipseType = EllipseType.Filled;
    } else if (isBackgroundColorTransparent) {
      this.ellipseType = EllipseType.Border;
    } else {
      this.ellipseType = EllipseType.FilledBorder;
    }
  }

  override get formStyle(): EllipseStyle {
    return this.formProperties[FormPropertyName.style];
  }

  protected override newChunkIndexes(
    chunkSize: number,
    chunkRange: Rect
  ): ChunkIndexSet {
    if (this.ellipseType === EllipseType.Transparent) {
      return new ChunkIndexSet();
    }

    const width = this.formWidth / chunkSize;
    const height = this.formHeight / chunkSize;
    const originX = this.formOriginX / chunkSize;
    const originY = this.formOriginY / chunkSize;
    const centerX = originX + width / 2;
    const centerY = originY + height / 2;

    switch (this.ellipseType) {
      case EllipseType.Filled:
        return this.getEllipseChunksInRange(
          centerX,
          centerY,
          Math.abs(width) / 2,
          Math.abs(height) / 2,
          chunkRange
        );
      case EllipseType.FilledBorder: {
        const offset = this.formStyle[StyleName.LineWidth] / 2 / chunkSize;
        return this.getEllipseChunksInRange(
          centerX,
          centerY,
          Math.abs(width) / 2 + offset,
          Math.abs(height) / 2 + offset,
          chunkRange
        );
      }
      case EllipseType.Border: {
        const offset = this.formStyle[StyleName.LineWidth] / 2 / chunkSize;
        return this.getEllipseRingChunksInRange(
          centerX,
          centerY,
          Math.abs(width) / 2 + offset,
          Math.abs(height) / 2 + offset,
          offset * 2,
          chunkRange
        );
      }
    }
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

    const width = this.formWidth / chunkSize;
    const height = this.formHeight / chunkSize;
    const originX = this.formOriginX / chunkSize;
    const originY = this.formOriginY / chunkSize;
    const centerX = originX + width / 2;
    const centerY = originY + height / 2;

    const offset =
      this.ellipseType === EllipseType.Filled
        ? 0
        : this.formStyle[StyleName.LineWidth] / 2 / chunkSize;
    const radiusX = Math.abs(width) / 2 + offset;
    const radiusY = Math.abs(height) / 2 + offset;

    const chunkIndexesToAdd = new ChunkIndexSet();

    if (
      this.ellipseType === EllipseType.Filled ||
      this.ellipseType === EllipseType.FilledBorder
    ) {
      chunkIndexes.forEach(chunkIndex => {
        const [x, y] = stringToChunkIndex(chunkIndex);
        if (
          !currentChunkIndexes.has(chunkIndex) &&
          ellipseIntersectsRect(centerX, centerY, radiusX, radiusY, x, y)
        ) {
          chunkIndexesToAdd.add(chunkIndex);
          currentChunkIndexes.add(chunkIndex);
        }
      });
    } else if (this.ellipseType === EllipseType.Border) {
      const innerRadiusX = Math.max(0, radiusX - offset * 2);
      const innerRadiusY = Math.max(0, radiusY - offset * 2);

      chunkIndexes.forEach(chunkIndex => {
        const [x, y] = stringToChunkIndex(chunkIndex);
        if (!currentChunkIndexes.has(chunkIndex)) {
          const outer = ellipseIntersectsRect(
            centerX,
            centerY,
            radiusX,
            radiusY,
            x,
            y
          );
          const inner = rectFullyInsideEllipse(
            centerX,
            centerY,
            innerRadiusX,
            innerRadiusY,
            x,
            y
          );
          if (outer && !inner) {
            chunkIndexesToAdd.add(chunkIndex);
            currentChunkIndexes.add(chunkIndex);
          }
        }
      });
    }
    if (chunkIndexesToAdd.size() > 0) {
      return chunkIndexesToAdd;
    }

    return undefined;
  }

  private getEllipseChunksInRange(
    centerX: number,
    centerY: number,
    radiusX: number,
    radiusY: number,
    chunkRange: Rect
  ): ChunkIndexSet {
    const xMin = chunkXMinInChunkRange(
      Math.floor(centerX - radiusX),
      chunkRange
    );
    const xMax = chunkXMaxInChunkRange(
      Math.ceil(centerX + radiusX) - 1,
      chunkRange
    );
    const yMin = chunkYMinInChunkRange(
      Math.floor(centerY - radiusY),
      chunkRange
    );
    const yMax = chunkYMaxInChunkRange(
      Math.ceil(centerY + radiusY) - 1,
      chunkRange
    );

    const chunkIndexes = new ChunkIndexSet();

    for (let y = yMin; y <= yMax; y++) {
      const range = chunkRangeInRow(
        y,
        xMin,
        xMax,
        centerX,
        centerY,
        radiusX,
        radiusY
      );
      if (range) {
        const [min, max] = range;
        for (let x = min; x <= max; x++) {
          chunkIndexes.addIndex(x, y);
        }
      }
    }

    return chunkIndexes;
  }

  private getEllipseRingChunksInRange(
    centerX: number,
    centerY: number,
    radiusX: number,
    radiusY: number,
    width: number,
    chunkRange: Rect
  ): ChunkIndexSet {
    const innerRx = Math.max(0, radiusX - width);
    const innerRy = Math.max(0, radiusY - width);

    const minX = chunkXMinInChunkRange(
      Math.floor(centerX - radiusX),
      chunkRange
    );
    const maxX = chunkXMaxInChunkRange(
      Math.floor(centerX + radiusX),
      chunkRange
    );
    const minY = chunkYMinInChunkRange(
      Math.floor(centerY - radiusY),
      chunkRange
    );
    const maxY = chunkYMaxInChunkRange(
      Math.floor(centerY + radiusY),
      chunkRange
    );

    const chunkIndexes = new ChunkIndexSet();

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const outer = ellipseIntersectsRect(
          centerX,
          centerY,
          radiusX,
          radiusY,
          x,
          y
        );
        const inner = rectFullyInsideEllipse(
          centerX,
          centerY,
          innerRx,
          innerRy,
          x,
          y
        );

        if (outer && !inner) {
          chunkIndexes.addIndex(x, y);
        }
      }
    }

    return chunkIndexes;
  }
}

function ellipseIntersectsRect(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rx0: number,
  ry0: number
): boolean {
  // closest point in rectangle to ellipse center
  const closestX = Math.max(rx0, Math.min(cx, rx0 + 1));
  const closestY = Math.max(ry0, Math.min(cy, ry0 + 1));

  const dx = (closestX - cx) / rx;
  const dy = (closestY - cy) / ry;

  return dx * dx + dy * dy <= 1;
}

export function chunkRangeInRow(
  y: number,
  xMin: number,
  xMax: number,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number
): [number, number] | undefined {
  let min = xMin;
  let foundIntersection = false;
  for (let x = xMin; x <= xMax; x++) {
    if (ellipseIntersectsRect(centerX, centerY, radiusX, radiusY, x, y)) {
      min = x;
      foundIntersection = true;
      break;
    }
  }
  if (!foundIntersection) {
    return undefined;
  }
  let max = xMax;
  if (min !== xMax) {
    for (let x = xMax; x >= xMin; x--) {
      if (ellipseIntersectsRect(centerX, centerY, radiusX, radiusY, x, y)) {
        max = x;
        break;
      }
    }
  }
  return [min, max];
}

function rectFullyInsideEllipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rx0: number,
  ry0: number
): boolean {
  if (rx <= 0 || ry <= 0) return false;

  const corners = [
    [rx0, ry0],
    [rx0 + 1, ry0],
    [rx0, ry0 + 1],
    [rx0 + 1, ry0 + 1],
  ];

  for (const [x, y] of corners) {
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    if (dx * dx + dy * dy > 1) {
      return false;
    }
  }

  return true;
}
