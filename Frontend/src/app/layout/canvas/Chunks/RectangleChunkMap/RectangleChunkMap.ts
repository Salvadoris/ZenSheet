import { RectangleDrawingProperties } from '../../DrawingProperties/RectangleDrawingProperties';
import { FormPropertyName } from '../../FormProperties/FormPropertyName';
import { Rect } from '../../Geometry';
import { RectangleShapeProperties } from '../../ShapeProperties/RectangleShapeProperties';
import { RectangleStyle } from '../../ShapeStyles/RectangleStyle';
import { StyleName } from '../../ShapeStyles/StyleName';
import { ChunkIndexSet, stringToChunkIndex } from '../ChunkIndex';
import {
  chunkXMaxInChunkRange,
  chunkXMinInChunkRange,
  chunkYMaxInChunkRange,
  chunkYMinInChunkRange,
  NonLineChunkMap,
} from '../FormChunkMap';

export enum RectType {
  Filled = 'Filled',
  Border = 'Border',
  Transparent = 'Transparent',
  FilledBorder = 'FilledBorder',
}

export abstract class RectangleChunkMap extends NonLineChunkMap {
  declare protected readonly formProperties: Readonly<
    Required<RectangleShapeProperties> | RectangleDrawingProperties
  >;
  protected readonly rectType: RectType;

  constructor(
    formProperties: Readonly<
      Required<RectangleShapeProperties> | RectangleDrawingProperties
    >
  ) {
    super(formProperties);
    const isColorTransparent =
      this.formStyle[StyleName.Color] === 'transparent';
    const isBackgroundColorTransparent =
      this.formStyle[StyleName.BackgroundColor] === 'transparent';
    if (isColorTransparent && isBackgroundColorTransparent) {
      this.rectType = RectType.Transparent;
    } else if (isColorTransparent) {
      this.rectType = RectType.Filled;
    } else if (isBackgroundColorTransparent) {
      this.rectType = RectType.Border;
    } else {
      this.rectType = RectType.FilledBorder;
    }
  }

  override get formStyle(): RectangleStyle {
    return this.formProperties[FormPropertyName.style];
  }

  protected override newChunkIndexes(
    chunkSize: number,
    chunkRange: Rect
  ): ChunkIndexSet {
    if (this.rectType === RectType.Transparent) {
      return new ChunkIndexSet();
    }

    const formXMin = Math.min(
      this.formOriginX,
      this.formOriginX + this.formWidth
    );
    const formYMin = Math.min(
      this.formOriginY,
      this.formOriginY + this.formHeight
    );
    const formXMax = Math.max(
      this.formOriginX,
      this.formOriginX + this.formWidth
    );
    const formYMax = Math.max(
      this.formOriginY,
      this.formOriginY + this.formHeight
    );

    if (
      this.rectType === RectType.Filled ||
      this.rectType === RectType.FilledBorder
    ) {
      const offset =
        this.rectType === RectType.Filled
          ? 0
          : this.formStyle[StyleName.LineWidth] / 2;
      const chunkXMin = Math.max(
        chunkRange[0],
        Math.floor((formXMin - offset) / chunkSize)
      );
      const chunkYMin = Math.max(
        chunkRange[1],
        Math.floor((formYMin - offset) / chunkSize)
      );
      const chunkXMax = Math.min(
        chunkRange[2],
        Math.ceil((formXMax + offset) / chunkSize) - 1
      );
      const chunkYMax = Math.min(
        chunkRange[3],
        Math.ceil((formYMax + offset) / chunkSize) - 1
      );
      const chunkIndexes = new ChunkIndexSet();
      for (let x = chunkXMin; x <= chunkXMax; x++) {
        for (let y = chunkYMin; y <= chunkYMax; y++) {
          chunkIndexes.addIndex(x, y);
        }
      }
      return chunkIndexes;
    } else if (this.rectType === RectType.Border) {
      const offset = this.formStyle[StyleName.LineWidth] / 2;

      const innerChunkXMin = Math.floor((formXMin + offset) / chunkSize);
      const innerChunkYMin = Math.floor((formYMin + offset) / chunkSize);
      const innerChunkXMax = Math.ceil((formXMax - offset) / chunkSize) - 1;
      const innerChunkYMax = Math.ceil((formYMax - offset) / chunkSize) - 1;

      const outerChunkXMin = Math.floor((formXMin - offset) / chunkSize);
      const outerChunkYMin = Math.floor((formYMin - offset) / chunkSize);
      const outerChunkXMax = Math.ceil((formXMax + offset) / chunkSize) - 1;
      const outerChunkYMax = Math.ceil((formYMax + offset) / chunkSize) - 1;

      const chunkIndexes = new ChunkIndexSet();

      // top line
      for (
        let x = chunkXMinInChunkRange(outerChunkXMin, chunkRange);
        x <= chunkXMaxInChunkRange(outerChunkXMax, chunkRange);
        x++
      ) {
        for (
          let y = chunkYMinInChunkRange(outerChunkYMin, chunkRange);
          y <= chunkYMaxInChunkRange(innerChunkYMin, chunkRange);
          y++
        ) {
          chunkIndexes.addIndex(x, y);
        }
      }
      // bottom line
      if (innerChunkYMin <= innerChunkYMax) {
        for (
          let x = chunkXMinInChunkRange(outerChunkXMin, chunkRange);
          x <= chunkXMaxInChunkRange(outerChunkXMax, chunkRange);
          x++
        ) {
          for (
            let y = chunkYMinInChunkRange(innerChunkYMax, chunkRange);
            y <= chunkYMinInChunkRange(outerChunkYMax, chunkRange);
            y++
          ) {
            chunkIndexes.addIndex(x, y);
          }
        }
      }
      // left line
      for (
        let y = chunkYMinInChunkRange(outerChunkYMin + 1, chunkRange);
        y <= chunkYMinInChunkRange(outerChunkYMax - 1, chunkRange);
        y++
      ) {
        for (
          let x = chunkXMinInChunkRange(outerChunkXMin, chunkRange);
          x <= chunkXMaxInChunkRange(innerChunkXMin, chunkRange);
          x++
        ) {
          chunkIndexes.addIndex(x, y);
        }
      }
      // right
      if (innerChunkXMin <= innerChunkXMax) {
        for (
          let y = chunkYMinInChunkRange(outerChunkYMin + 1, chunkRange);
          y <= chunkYMinInChunkRange(outerChunkYMax - 1, chunkRange);
          y++
        ) {
          for (
            let x = chunkXMinInChunkRange(innerChunkXMax, chunkRange);
            x <= chunkXMaxInChunkRange(outerChunkXMax, chunkRange);
            x++
          ) {
            chunkIndexes.addIndex(x, y);
          }
        }
      }
      return chunkIndexes;
    }
    throw new Error(`rectType ${this.rectType} not implemented`);
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

    if (
      this.rectType === RectType.Filled ||
      this.rectType === RectType.FilledBorder
    ) {
      const formXMin = Math.min(
        this.formOriginX,
        this.formOriginX + this.formWidth
      );
      const formYMin = Math.min(
        this.formOriginY,
        this.formOriginY + this.formHeight
      );
      const formXMax = Math.max(
        this.formOriginX,
        this.formOriginX + this.formWidth
      );
      const formYMax = Math.max(
        this.formOriginY,
        this.formOriginY + this.formHeight
      );

      const offset =
        this.rectType === RectType.Filled
          ? 0
          : this.formStyle[StyleName.LineWidth] / 2;
      const chunkXMin = Math.floor((formXMin - offset) / chunkSize);
      const chunkYMin = Math.floor((formYMin - offset) / chunkSize);
      const chunkXMax = Math.ceil((formXMax + offset) / chunkSize) - 1;
      const chunkYMax = Math.ceil((formYMax + offset) / chunkSize) - 1;

      const chunkIndexesToAdd = new ChunkIndexSet();

      chunkIndexes.forEach(chunkIndex => {
        const [x, y] = stringToChunkIndex(chunkIndex);
        if (
          !currentChunkIndexes.has(chunkIndex) &&
          x >= chunkXMin &&
          x <= chunkXMax &&
          y >= chunkYMin &&
          y <= chunkYMax
        ) {
          chunkIndexesToAdd.add(chunkIndex);
          currentChunkIndexes.add(chunkIndex);
        }
      });

      if (chunkIndexesToAdd.size() > 0) {
        return chunkIndexesToAdd;
      }
      return undefined;
    } else if (this.rectType === RectType.Border) {
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
    throw new Error(`rectType ${this.rectType} not implemented`);
  }
}
