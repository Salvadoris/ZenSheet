import { RectangleDrawingProperties } from '../../DrawingProperties/RectangleDrawingProperties';
import { Rect } from '../../Geometry';
import { StyleName } from '../../ShapeStyles/StyleName';
import { ChunkIndexSet } from '../ChunkIndex';
import {
  ChunkChange,
  chunkXMaxInChunkRange,
  chunkXMinInChunkRange,
  chunkYMaxInChunkRange,
  chunkYMinInChunkRange,
} from '../FormChunkMap';

import { RectangleChunkMap, RectType } from './RectangleChunkMap';

interface RectangleChangeProperties {
  lastWidth: number;
  lastHeight: number;
}

export class RectangleDrawingChunkMap extends RectangleChunkMap {
  declare protected readonly formProperties: Readonly<RectangleDrawingProperties>;
  #lastPropertiesMap = new Map<number, RectangleChangeProperties>();

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

    if (this.rectType === RectType.Transparent) {
      lastProperties.lastWidth = this.formWidth;
      lastProperties.lastHeight = this.formHeight;
      return {
        chunkIndexesToReload: undefined,
        chunkIndexesToRemove: undefined,
      };
    }

    // return this.updateFullChunkMap(chunkSize, chunkRange);

    if (
      (lastProperties.lastWidth < 0 && this.formWidth > 0) ||
      (lastProperties.lastWidth > 0 && this.formWidth < 0) ||
      (lastProperties.lastHeight < 0 && this.formHeight > 0) ||
      (lastProperties.lastHeight > 0 && this.formHeight < 0)
    ) {
      return this.updateFullChunkMap(chunkSize, chunkRange);
    }

    switch (this.rectType) {
      case RectType.Border:
        return this.updateBorderChunkMap(chunkSize, chunkRange);
      case RectType.Filled:
      case RectType.FilledBorder:
        return this.updateFilledChunkMap(chunkSize, chunkRange);
      default:
        throw new Error(`RectType '${this.rectType}' doesn't exists`);
    }
  }

  // private updateBorderChunkMap(chunkSize: number): ChunkChange {
  //   const lastProperties = this.#lastPropertiesMap.get(chunkSize);
  //   if (lastProperties === undefined) {
  //     throw new Error('lastWidth or lastHeight was not assigned a value');
  //   }

  //   const offset = this.formStyle[StyleName.LineWidth] / 2;

  //   const widthChanged = this.formWidth !== lastProperties.lastWidth;
  //   const heightChanged = this.formHeight !== lastProperties.lastHeight;

  //   const lastMinColumn = Math.floor(
  //     (this.formOriginX + lastProperties.lastWidth - offset) / chunkSize
  //   );
  //   const lastMaxColumn =
  //     Math.ceil(
  //       (this.formOriginX + lastProperties.lastWidth + offset) / chunkSize
  //     ) - 1;

  //   const newMinColumn = Math.floor(
  //     (this.formOriginX + this.formWidth - offset) / chunkSize
  //   );
  //   const newMaxColumn =
  //     Math.ceil((this.formOriginX + this.formWidth + offset) / chunkSize) - 1;

  //   const lastMinRow = Math.floor(
  //     (this.formOriginY + lastProperties.lastHeight - offset) / chunkSize
  //   );
  //   const lastMaxRow =
  //     Math.ceil(
  //       (this.formOriginY + lastProperties.lastHeight + offset) / chunkSize
  //     ) - 1;

  //   const newMinRow = Math.floor(
  //     (this.formOriginY + this.formHeight - offset) / chunkSize
  //   );
  //   const newMaxRow =
  //     Math.ceil((this.formOriginY + this.formHeight + offset) / chunkSize) - 1;

  //   const originXMin = Math.floor((this.formOriginX - offset) / chunkSize);
  //   const originXMax = Math.ceil((this.formOriginX + offset) / chunkSize) - 1;

  //   const originYMin = Math.floor((this.formOriginY - offset) / chunkSize);
  //   const originYMax = Math.ceil((this.formOriginY + offset) / chunkSize) - 1;

  //   const chunkIndexes = this.get(chunkSize)!;
  //   const reloadChunkIndexes = new ChunkIndexSet();
  //   const removeChunkIndexes = new ChunkIndexSet();

  //   if (widthChanged) {
  //     const widthSmaller =
  //       Math.abs(this.formWidth) < Math.abs(lastProperties.lastWidth);
  //     const inverted = this.formWidth < 0;

  //     const lastYMin = Math.min(lastMinRow, originYMin);
  //     const lastYMax = Math.max(lastMaxRow, originYMax);

  //     const newYMin = Math.min(newMinRow, originYMin);
  //     const newYMax = Math.max(newMaxRow, originYMax);

  //     if (widthSmaller) {
  //       // remove outer chunkIndexes
  //       for (
  //         let x = inverted
  //           ? Math.min(lastMinColumn, newMinColumn - 1)
  //           : Math.max(lastMinColumn, newMaxColumn + 1);
  //         x <=
  //         (inverted
  //           ? Math.min(lastMaxColumn, newMinColumn - 1)
  //           : lastMaxColumn);
  //         x++
  //       ) {
  //         for (let y = lastYMin; y <= lastYMax; y++) {
  //           removeChunkIndexes.addIndex(x, y);
  //         }
  //       }

  //       for (
  //         let x = inverted ? lastMaxColumn + 1 : newMaxColumn + 1;
  //         x <= (inverted ? newMinColumn - 1 : lastMinColumn - 1);
  //         x++
  //       ) {
  //         for (let y = lastMinRow; y <= lastMaxRow; y++) {
  //           removeChunkIndexes.addIndex(x, y);
  //         }
  //         for (let y = originYMin; y <= originYMax; y++) {
  //           removeChunkIndexes.addIndex(x, y);
  //         }
  //       }

  //       // reload and add inner chunkIndexes
  //       for (let x = newMinColumn; x <= newMaxColumn; x++) {
  //         const isNew = inverted ? x > lastMaxColumn : x < lastMinColumn;
  //         for (let y = newYMin; y <= newYMax; y++) {
  //           reloadChunkIndexes.addIndex(x, y);
  //           if (isNew) {
  //             chunkIndexes.addIndex(x, y);
  //           }
  //         }
  //       }
  //     } else {
  //       // remove inner chunkIndexes
  //       if (
  //         inverted ? lastMaxColumn > newMaxColumn : lastMinColumn < newMinColumn
  //       ) {
  //         for (
  //           let x = inverted
  //             ? Math.max(lastMinColumn, newMaxColumn + 1)
  //             : Math.max(lastMinColumn, originXMax + 1);
  //           x <=
  //           (inverted
  //             ? Math.min(lastMaxColumn, originXMin - 1)
  //             : Math.min(lastMaxColumn, newMinColumn - 1));
  //           x++
  //         ) {
  //           for (
  //             let y = Math.min(
  //               originYMax + 1,
  //               Math.max(newMaxRow + 1, lastMaxRow)
  //             );
  //             y <=
  //             Math.max(originYMin - 1, Math.min(newMinRow - 1, lastMinRow));
  //             y++
  //           ) {
  //             removeChunkIndexes.addIndex(x, y);
  //           }
  //         }
  //       }

  //       // reload inner and add outer chunkIndexes
  //       for (let x = lastMinColumn; x <= lastMaxColumn; x++) {
  //         for (let y = newYMin; y <= newYMax; y++) {
  //           reloadChunkIndexes.addIndex(x, y);
  //         }
  //       }

  //       for (let x = newMinColumn; x <= newMaxColumn; x++) {
  //         for (let y = newYMin; y <= newYMax; y++) {
  //           reloadChunkIndexes.addIndex(x, y);
  //           chunkIndexes.addIndex(x, y);
  //         }
  //       }

  //       for (
  //         let x = inverted ? newMaxColumn + 1 : lastMaxColumn + 1;
  //         x <= (inverted ? lastMinColumn - 1 : newMinColumn - 1);
  //         x++
  //       ) {
  //         for (let y = newMinRow; y <= newMaxRow; y++) {
  //           reloadChunkIndexes.addIndex(x, y);
  //           chunkIndexes.addIndex(x, y);
  //         }
  //         for (let y = originYMin; y <= originYMax; y++) {
  //           reloadChunkIndexes.addIndex(x, y);
  //           chunkIndexes.addIndex(x, y);
  //         }
  //       }
  //     }
  //   }

  //   if (heightChanged) {
  //     const heightSmaller =
  //       Math.abs(this.formHeight) < Math.abs(lastProperties.lastHeight);
  //     const inverted = this.formHeight < 0;

  //     const lastXMin = Math.min(lastMinColumn, originXMin);
  //     const lastXMax = Math.max(lastMaxColumn, originXMax);

  //     const newXMin = Math.min(newMinColumn, originXMin);
  //     const newXMax = Math.max(newMaxColumn, originXMax);

  //     if (heightSmaller) {
  //       // remove outer chunkIndexes
  //       for (
  //         let y = inverted
  //           ? Math.min(lastMinRow, newMinRow - 1)
  //           : Math.max(lastMinRow, newMaxRow + 1);
  //         y <= (inverted ? Math.min(lastMaxRow, newMinRow - 1) : lastMaxRow);
  //         y++
  //       ) {
  //         for (let x = lastXMin; x <= lastXMax; x++) {
  //           removeChunkIndexes.addIndex(x, y);
  //         }
  //       }

  //       for (
  //         let y = inverted ? lastMaxRow + 1 : newMaxRow + 1;
  //         y <= (inverted ? newMinRow - 1 : lastMinRow - 1);
  //         y++
  //       ) {
  //         for (let x = lastMinColumn; x <= lastMaxColumn; x++) {
  //           removeChunkIndexes.addIndex(x, y);
  //         }
  //         for (let x = originXMin; x <= originXMax; x++) {
  //           removeChunkIndexes.addIndex(x, y);
  //         }
  //       }

  //       // reload and add outer chunkIndexes
  //       for (let y = newMinRow; y <= newMaxRow; y++) {
  //         const isNew = inverted ? y > lastMaxRow : y < lastMinRow;
  //         for (let x = newXMin; x <= newXMax; x++) {
  //           reloadChunkIndexes.addIndex(x, y);
  //           if (isNew) {
  //             chunkIndexes.addIndex(x, y);
  //           }
  //         }
  //       }
  //     } else {
  //       // remove inner chunkIndexes
  //       if (inverted ? lastMaxRow > newMaxRow : lastMinRow < newMinRow) {
  //         for (
  //           let y = inverted
  //             ? Math.max(lastMinRow, newMaxRow + 1)
  //             : Math.max(lastMinRow, originYMax + 1);
  //           y <=
  //           (inverted
  //             ? Math.min(lastMaxRow, originYMin - 1)
  //             : Math.min(lastMaxRow, newMinRow - 1));
  //           y++
  //         ) {
  //           for (
  //             let x = Math.min(
  //               originXMax + 1,
  //               Math.max(newMaxColumn + 1, lastMaxColumn)
  //             );
  //             x <=
  //             Math.max(
  //               originXMin - 1,
  //               Math.min(newMinColumn - 1, lastMinColumn)
  //             );
  //             x++
  //           ) {
  //             removeChunkIndexes.addIndex(x, y);
  //           }
  //         }
  //       }

  //       // reload inner and add outer chunkIndexes
  //       for (let y = lastMinRow; y <= lastMaxRow; y++) {
  //         for (let x = newXMin; x <= newXMax; x++) {
  //           reloadChunkIndexes.addIndex(x, y);
  //         }
  //       }

  //       for (let y = newMinRow; y <= newMaxRow; y++) {
  //         for (let x = newXMin; x <= newXMax; x++) {
  //           reloadChunkIndexes.addIndex(x, y);
  //           chunkIndexes.addIndex(x, y);
  //         }
  //       }

  //       for (
  //         let y = inverted ? newMaxRow + 1 : lastMaxRow + 1;
  //         y <= (inverted ? lastMinRow - 1 : newMinRow - 1);
  //         y++
  //       ) {
  //         for (let x = newMinColumn; x <= newMaxColumn; x++) {
  //           reloadChunkIndexes.addIndex(x, y);
  //           chunkIndexes.addIndex(x, y);
  //         }
  //         for (let x = originXMin; x <= originXMax; x++) {
  //           reloadChunkIndexes.addIndex(x, y);
  //           chunkIndexes.addIndex(x, y);
  //         }
  //       }
  //     }
  //   }

  //   removeChunkIndexes.forEach(index => chunkIndexes.delete(index));

  //   this.#lastPropertiesMap.set(chunkSize, {
  //     lastWidth: this.formWidth,
  //     lastHeight: this.formHeight,
  //   });
  //   return {
  //     reloadChunkIndexes: reloadChunkIndexes,
  //     removeChunkIndexes: removeChunkIndexes,
  //   };
  // }

  // private updateFilledChunkMap(chunkSize: number): ChunkChange {
  //   const lastProperties = this.#lastPropertiesMap.get(chunkSize);
  //   if (lastProperties === undefined) {
  //     throw new Error('lastWidth or lastHeight was not assigned a value');
  //   }

  //   const offset =
  //     this.rectType === RectType.Filled
  //       ? 0
  //       : this.formStyle[StyleName.LineWidth] / 2;

  //   const widthChanged = this.formWidth !== lastProperties.lastWidth;
  //   const heightChanged = this.formHeight !== lastProperties.lastHeight;

  //   const lastMinColumn = Math.floor(
  //     (this.formOriginX + lastProperties.lastWidth - offset) / chunkSize
  //   );
  //   const lastMaxColumn =
  //     Math.ceil(
  //       (this.formOriginX + lastProperties.lastWidth + offset) / chunkSize
  //     ) - 1;

  //   const newMinColumn = Math.floor(
  //     (this.formOriginX + this.formWidth - offset) / chunkSize
  //   );
  //   const newMaxColumn =
  //     Math.ceil((this.formOriginX + this.formWidth + offset) / chunkSize) - 1;

  //   const lastMinRow = Math.floor(
  //     (this.formOriginY + lastProperties.lastHeight - offset) / chunkSize
  //   );
  //   const lastMaxRow =
  //     Math.ceil(
  //       (this.formOriginY + lastProperties.lastHeight + offset) / chunkSize
  //     ) - 1;

  //   const newMinRow = Math.floor(
  //     (this.formOriginY + this.formHeight - offset) / chunkSize
  //   );
  //   const newMaxRow =
  //     Math.ceil((this.formOriginY + this.formHeight + offset) / chunkSize) - 1;

  //   const originXMin = Math.floor((this.formOriginX - offset) / chunkSize);
  //   const originXMax = Math.ceil((this.formOriginX + offset) / chunkSize) - 1;

  //   const originYMin = Math.floor((this.formOriginY - offset) / chunkSize);
  //   const originYMax = Math.ceil((this.formOriginY + offset) / chunkSize) - 1;

  //   const chunkIndexes = this.get(chunkSize)!;
  //   const reloadChunkIndexes = new ChunkIndexSet();
  //   const removeChunkIndexes = new ChunkIndexSet();

  //   if (widthChanged) {
  //     const widthSmaller =
  //       Math.abs(this.formWidth) < Math.abs(lastProperties.lastWidth);
  //     const inverted = this.formWidth < 0;

  //     const lastYMin = Math.min(lastMinRow, originYMin);
  //     const lastYMax = Math.max(lastMaxRow, originYMax);

  //     const newYMin = Math.min(newMinRow, originYMin);
  //     const newYMax = Math.max(newMaxRow, originYMax);

  //     if (widthSmaller) {
  //       // remove outer chunkIndexes
  //       for (
  //         let x = inverted ? lastMinColumn : newMaxColumn + 1;
  //         x <= (inverted ? newMinColumn - 1 : lastMaxColumn);
  //         x++
  //       ) {
  //         for (let y = lastYMin; y <= lastYMax; y++) {
  //           removeChunkIndexes.addIndex(x, y);
  //         }
  //       }

  //       // reload chunkIndexes
  //       for (let x = newMinColumn; x <= newMaxColumn; x++) {
  //         for (let y = newYMin; y <= newYMax; y++) {
  //           reloadChunkIndexes.addIndex(x, y);
  //         }
  //       }
  //     } else {
  //       // reload and add outer chunkIndexes
  //       for (
  //         let x = inverted ? newMinColumn : lastMinColumn;
  //         x <= (inverted ? lastMaxColumn : newMaxColumn);
  //         x++
  //       ) {
  //         for (let y = newYMin; y <= newYMax; y++) {
  //           reloadChunkIndexes.addIndex(x, y);
  //           chunkIndexes.addIndex(x, y);
  //         }
  //       }
  //     }
  //   }

  //   if (heightChanged) {
  //     const heightSmaller =
  //       Math.abs(this.formHeight) < Math.abs(lastProperties.lastHeight);
  //     const inverted = this.formHeight < 0;

  //     const lastXMin = Math.min(lastMinColumn, originXMin);
  //     const lastXMax = Math.max(lastMaxColumn, originXMax);

  //     const newXMin = Math.min(newMinColumn, originXMin);
  //     const newXMax = Math.max(newMaxColumn, originXMax);

  //     if (heightSmaller) {
  //       // remove outer chunkIndexes
  //       for (
  //         let y = inverted ? lastMinRow : newMaxRow + 1;
  //         y <= (inverted ? newMinRow - 1 : lastMaxRow);
  //         y++
  //       ) {
  //         for (let x = lastXMin; x <= lastXMax; x++) {
  //           removeChunkIndexes.addIndex(x, y);
  //         }
  //       }

  //       // reload chunkIndexes
  //       for (let y = newMinRow; y <= newMaxRow; y++) {
  //         for (let x = newXMin; x <= newXMax; x++) {
  //           reloadChunkIndexes.addIndex(x, y);
  //         }
  //       }
  //     } else {
  //       // reload and add outer chunkIndexes
  //       for (
  //         let y = inverted ? newMinRow : lastMinRow;
  //         y <= (inverted ? lastMaxRow : newMaxRow);
  //         y++
  //       ) {
  //         for (let x = newXMin; x <= newXMax; x++) {
  //           reloadChunkIndexes.addIndex(x, y);
  //           chunkIndexes.addIndex(x, y);
  //         }
  //       }
  //     }
  //   }

  //   removeChunkIndexes.forEach(index => chunkIndexes.delete(index));

  //   this.#lastPropertiesMap.set(chunkSize, {
  //     lastWidth: this.formWidth,
  //     lastHeight: this.formHeight,
  //   });
  //   return {
  //     reloadChunkIndexes: reloadChunkIndexes,
  //     removeChunkIndexes: removeChunkIndexes,
  //   };
  // }

  private updateBorderChunkMap(
    chunkSize: number,
    chunkRange: Rect
  ): ChunkChange {
    const lastProperties = this.#lastPropertiesMap.get(chunkSize);
    if (lastProperties === undefined) {
      throw new Error('lastWidth or lastHeight was not assigned a value');
    }

    const offset = this.formStyle[StyleName.LineWidth] / 2;

    const widthChanged = this.formWidth !== lastProperties.lastWidth;
    const heightChanged = this.formHeight !== lastProperties.lastHeight;

    const lastMinColumn = Math.floor(
      (this.formOriginX + lastProperties.lastWidth - offset) / chunkSize
    );
    const lastMaxColumn =
      Math.ceil(
        (this.formOriginX + lastProperties.lastWidth + offset) / chunkSize
      ) - 1;

    const newMinColumn = Math.floor(
      (this.formOriginX + this.formWidth - offset) / chunkSize
    );
    const newMaxColumn =
      Math.ceil((this.formOriginX + this.formWidth + offset) / chunkSize) - 1;

    const lastMinRow = Math.floor(
      (this.formOriginY + lastProperties.lastHeight - offset) / chunkSize
    );
    const lastMaxRow =
      Math.ceil(
        (this.formOriginY + lastProperties.lastHeight + offset) / chunkSize
      ) - 1;

    const newMinRow = Math.floor(
      (this.formOriginY + this.formHeight - offset) / chunkSize
    );
    const newMaxRow =
      Math.ceil((this.formOriginY + this.formHeight + offset) / chunkSize) - 1;

    const originXMin = Math.floor((this.formOriginX - offset) / chunkSize);
    const originXMax = Math.ceil((this.formOriginX + offset) / chunkSize) - 1;

    const originYMin = Math.floor((this.formOriginY - offset) / chunkSize);
    const originYMax = Math.ceil((this.formOriginY + offset) / chunkSize) - 1;

    const chunkIndexes = this.get(chunkSize)!;
    const reloadChunkIndexes = new ChunkIndexSet();
    const removeChunkIndexes = new ChunkIndexSet();

    this.map.clear();
    this.map.set(chunkSize, chunkIndexes);
    this.removeChunkIndexesOutsideOfChunkRange(chunkSize, chunkRange);

    if (widthChanged) {
      const widthSmaller =
        Math.abs(this.formWidth) < Math.abs(lastProperties.lastWidth);
      const inverted = this.formWidth < 0;

      const lastYMin = Math.min(lastMinRow, originYMin);
      const lastYMax = Math.max(lastMaxRow, originYMax);

      const newYMin = Math.min(newMinRow, originYMin);
      const newYMax = Math.max(newMaxRow, originYMax);

      if (widthSmaller) {
        // remove outer chunkIndexes
        for (
          let x = chunkXMinInChunkRange(
            inverted
              ? Math.min(lastMinColumn, newMinColumn - 1)
              : Math.max(lastMinColumn, newMaxColumn + 1),
            chunkRange
          );
          x <=
          chunkXMaxInChunkRange(
            inverted
              ? Math.min(lastMaxColumn, newMinColumn - 1)
              : lastMaxColumn,
            chunkRange
          );
          x++
        ) {
          for (
            let y = chunkYMinInChunkRange(lastYMin, chunkRange);
            y <= chunkYMaxInChunkRange(lastYMax, chunkRange);
            y++
          ) {
            removeChunkIndexes.addIndex(x, y);
          }
        }

        for (
          let x = chunkXMinInChunkRange(
            inverted ? lastMaxColumn + 1 : newMaxColumn + 1,
            chunkRange
          );
          x <=
          chunkXMaxInChunkRange(
            inverted ? newMinColumn - 1 : lastMinColumn - 1,
            chunkRange
          );
          x++
        ) {
          for (
            let y = chunkYMinInChunkRange(lastMinRow, chunkRange);
            y <= chunkYMaxInChunkRange(lastMaxRow, chunkRange);
            y++
          ) {
            removeChunkIndexes.addIndex(x, y);
          }
          for (
            let y = chunkYMinInChunkRange(originYMin, chunkRange);
            y <= chunkYMaxInChunkRange(originYMax, chunkRange);
            y++
          ) {
            removeChunkIndexes.addIndex(x, y);
          }
        }

        // reload and add inner chunkIndexes
        for (
          let x = chunkXMinInChunkRange(newMinColumn, chunkRange);
          x <= chunkXMaxInChunkRange(newMaxColumn, chunkRange);
          x++
        ) {
          const isNew = inverted ? x > lastMaxColumn : x < lastMinColumn;
          for (
            let y = chunkYMinInChunkRange(newYMin, chunkRange);
            y <= chunkYMaxInChunkRange(newYMax, chunkRange);
            y++
          ) {
            reloadChunkIndexes.addIndex(x, y);
            if (isNew) {
              chunkIndexes.addIndex(x, y);
            }
          }
        }
      } else {
        // remove inner chunkIndexes
        if (
          inverted ? lastMaxColumn > newMaxColumn : lastMinColumn < newMinColumn
        ) {
          for (
            let x = chunkXMinInChunkRange(
              inverted
                ? Math.max(lastMinColumn, newMaxColumn + 1)
                : Math.max(lastMinColumn, originXMax + 1),
              chunkRange
            );
            x <=
            chunkXMaxInChunkRange(
              inverted
                ? Math.min(lastMaxColumn, originXMin - 1)
                : Math.min(lastMaxColumn, newMinColumn - 1),
              chunkRange
            );
            x++
          ) {
            for (
              let y = chunkYMinInChunkRange(
                Math.min(originYMax + 1, Math.max(newMaxRow + 1, lastMaxRow)),
                chunkRange
              );
              y <=
              chunkYMaxInChunkRange(
                Math.max(originYMin - 1, Math.min(newMinRow - 1, lastMinRow)),
                chunkRange
              );
              y++
            ) {
              removeChunkIndexes.addIndex(x, y);
            }
          }
        }

        // reload inner and add outer chunkIndexes
        for (
          let x = chunkXMinInChunkRange(lastMinColumn, chunkRange);
          x <= chunkXMaxInChunkRange(lastMaxColumn, chunkRange);
          x++
        ) {
          for (
            let y = chunkYMinInChunkRange(newYMin, chunkRange);
            y <= chunkYMaxInChunkRange(newYMax, chunkRange);
            y++
          ) {
            reloadChunkIndexes.addIndex(x, y);
          }
        }

        for (
          let x = chunkXMinInChunkRange(newMinColumn, chunkRange);
          x <= chunkXMaxInChunkRange(newMaxColumn, chunkRange);
          x++
        ) {
          for (
            let y = chunkYMinInChunkRange(newYMin, chunkRange);
            y <= chunkYMaxInChunkRange(newYMax, chunkRange);
            y++
          ) {
            reloadChunkIndexes.addIndex(x, y);
            chunkIndexes.addIndex(x, y);
          }
        }

        for (
          let x = chunkXMinInChunkRange(
            inverted ? newMaxColumn + 1 : lastMaxColumn + 1,
            chunkRange
          );
          x <=
          chunkXMaxInChunkRange(
            inverted ? lastMinColumn - 1 : newMinColumn - 1,
            chunkRange
          );
          x++
        ) {
          for (
            let y = chunkYMinInChunkRange(newMinRow, chunkRange);
            y <= chunkYMaxInChunkRange(newMaxRow, chunkRange);
            y++
          ) {
            reloadChunkIndexes.addIndex(x, y);
            chunkIndexes.addIndex(x, y);
          }
          for (
            let y = chunkYMinInChunkRange(originYMin, chunkRange);
            y <= chunkYMaxInChunkRange(originYMax, chunkRange);
            y++
          ) {
            reloadChunkIndexes.addIndex(x, y);
            chunkIndexes.addIndex(x, y);
          }
        }
      }
    }

    if (heightChanged) {
      const heightSmaller =
        Math.abs(this.formHeight) < Math.abs(lastProperties.lastHeight);
      const inverted = this.formHeight < 0;

      const lastXMin = Math.min(lastMinColumn, originXMin);
      const lastXMax = Math.max(lastMaxColumn, originXMax);

      const newXMin = Math.min(newMinColumn, originXMin);
      const newXMax = Math.max(newMaxColumn, originXMax);

      if (heightSmaller) {
        // remove outer chunkIndexes
        for (
          let y = chunkYMinInChunkRange(
            inverted
              ? Math.min(lastMinRow, newMinRow - 1)
              : Math.max(lastMinRow, newMaxRow + 1),
            chunkRange
          );
          y <=
          chunkYMaxInChunkRange(
            inverted ? Math.min(lastMaxRow, newMinRow - 1) : lastMaxRow,
            chunkRange
          );
          y++
        ) {
          for (
            let x = chunkXMinInChunkRange(lastXMin, chunkRange);
            x <= chunkXMaxInChunkRange(lastXMax, chunkRange);
            x++
          ) {
            removeChunkIndexes.addIndex(x, y);
          }
        }

        for (
          let y = chunkYMinInChunkRange(
            inverted ? lastMaxRow + 1 : newMaxRow + 1,
            chunkRange
          );
          y <=
          chunkYMaxInChunkRange(
            inverted ? newMinRow - 1 : lastMinRow - 1,
            chunkRange
          );
          y++
        ) {
          for (
            let x = chunkXMinInChunkRange(lastMinColumn, chunkRange);
            x <= chunkXMaxInChunkRange(lastMaxColumn, chunkRange);
            x++
          ) {
            removeChunkIndexes.addIndex(x, y);
          }
          for (
            let x = chunkXMinInChunkRange(originXMin, chunkRange);
            x <= chunkXMaxInChunkRange(originXMax, chunkRange);
            x++
          ) {
            removeChunkIndexes.addIndex(x, y);
          }
        }

        // reload and add outer chunkIndexes
        for (
          let y = chunkYMinInChunkRange(newMinRow, chunkRange);
          y <= chunkYMaxInChunkRange(newMaxRow, chunkRange);
          y++
        ) {
          const isNew = inverted ? y > lastMaxRow : y < lastMinRow;
          for (
            let x = chunkXMinInChunkRange(newXMin, chunkRange);
            x <= chunkXMaxInChunkRange(newXMax, chunkRange);
            x++
          ) {
            reloadChunkIndexes.addIndex(x, y);
            if (isNew) {
              chunkIndexes.addIndex(x, y);
            }
          }
        }
      } else {
        // remove inner chunkIndexes
        if (inverted ? lastMaxRow > newMaxRow : lastMinRow < newMinRow) {
          for (
            let y = chunkYMinInChunkRange(
              inverted
                ? Math.max(lastMinRow, newMaxRow + 1)
                : Math.max(lastMinRow, originYMax + 1),
              chunkRange
            );
            y <=
            chunkYMaxInChunkRange(
              inverted
                ? Math.min(lastMaxRow, originYMin - 1)
                : Math.min(lastMaxRow, newMinRow - 1),
              chunkRange
            );
            y++
          ) {
            for (
              let x = chunkXMinInChunkRange(
                Math.min(
                  originXMax + 1,
                  Math.max(newMaxColumn + 1, lastMaxColumn)
                ),
                chunkRange
              );
              x <=
              chunkXMaxInChunkRange(
                Math.max(
                  originXMin - 1,
                  Math.min(newMinColumn - 1, lastMinColumn)
                ),
                chunkRange
              );
              x++
            ) {
              removeChunkIndexes.addIndex(x, y);
            }
          }
        }

        // reload inner and add outer chunkIndexes
        for (
          let y = chunkYMinInChunkRange(lastMinRow, chunkRange);
          y <= chunkYMaxInChunkRange(lastMaxRow, chunkRange);
          y++
        ) {
          for (
            let x = chunkXMinInChunkRange(newXMin, chunkRange);
            x <= chunkXMaxInChunkRange(newXMax, chunkRange);
            x++
          ) {
            reloadChunkIndexes.addIndex(x, y);
          }
        }

        for (
          let y = chunkYMinInChunkRange(newMinRow, chunkRange);
          y <= chunkYMaxInChunkRange(newMaxRow, chunkRange);
          y++
        ) {
          for (
            let x = chunkXMinInChunkRange(newXMin, chunkRange);
            x <= chunkXMaxInChunkRange(newXMax, chunkRange);
            x++
          ) {
            reloadChunkIndexes.addIndex(x, y);
            chunkIndexes.addIndex(x, y);
          }
        }

        for (
          let y = chunkYMinInChunkRange(
            inverted ? newMaxRow + 1 : lastMaxRow + 1,
            chunkRange
          );
          y <=
          chunkYMaxInChunkRange(
            inverted ? lastMinRow - 1 : newMinRow - 1,
            chunkRange
          );
          y++
        ) {
          for (
            let x = chunkXMinInChunkRange(newMinColumn, chunkRange);
            x <= chunkXMaxInChunkRange(newMaxColumn, chunkRange);
            x++
          ) {
            reloadChunkIndexes.addIndex(x, y);
            chunkIndexes.addIndex(x, y);
          }
          for (
            let x = chunkXMinInChunkRange(originXMin, chunkRange);
            x <= chunkXMaxInChunkRange(originXMax, chunkRange);
            x++
          ) {
            reloadChunkIndexes.addIndex(x, y);
            chunkIndexes.addIndex(x, y);
          }
        }
      }
    }

    removeChunkIndexes.forEach(index => chunkIndexes.delete(index));

    this.#lastPropertiesMap.set(chunkSize, {
      lastWidth: this.formWidth,
      lastHeight: this.formHeight,
    });
    return {
      chunkIndexesToReload: reloadChunkIndexes,
      chunkIndexesToRemove: removeChunkIndexes,
    };
  }

  private updateFilledChunkMap(
    chunkSize: number,
    chunkRange: Rect
  ): ChunkChange {
    const lastProperties = this.#lastPropertiesMap.get(chunkSize);
    if (lastProperties === undefined) {
      throw new Error('lastWidth or lastHeight was not assigned a value');
    }

    const offset =
      this.rectType === RectType.Filled
        ? 0
        : this.formStyle[StyleName.LineWidth] / 2;

    const widthChanged = this.formWidth !== lastProperties.lastWidth;
    const heightChanged = this.formHeight !== lastProperties.lastHeight;

    const lastMinColumn = Math.floor(
      (this.formOriginX + lastProperties.lastWidth - offset) / chunkSize
    );
    const lastMaxColumn =
      Math.ceil(
        (this.formOriginX + lastProperties.lastWidth + offset) / chunkSize
      ) - 1;

    const newMinColumn = Math.floor(
      (this.formOriginX + this.formWidth - offset) / chunkSize
    );
    const newMaxColumn =
      Math.ceil((this.formOriginX + this.formWidth + offset) / chunkSize) - 1;

    const lastMinRow = Math.floor(
      (this.formOriginY + lastProperties.lastHeight - offset) / chunkSize
    );
    const lastMaxRow =
      Math.ceil(
        (this.formOriginY + lastProperties.lastHeight + offset) / chunkSize
      ) - 1;

    const newMinRow = Math.floor(
      (this.formOriginY + this.formHeight - offset) / chunkSize
    );
    const newMaxRow =
      Math.ceil((this.formOriginY + this.formHeight + offset) / chunkSize) - 1;

    const originXMin = Math.floor((this.formOriginX - offset) / chunkSize);
    const originXMax = Math.ceil((this.formOriginX + offset) / chunkSize) - 1;

    const originYMin = Math.floor((this.formOriginY - offset) / chunkSize);
    const originYMax = Math.ceil((this.formOriginY + offset) / chunkSize) - 1;

    const chunkIndexes = this.get(chunkSize)!;
    const reloadChunkIndexes = new ChunkIndexSet();
    const removeChunkIndexes = new ChunkIndexSet();

    this.map.clear();
    this.map.set(chunkSize, chunkIndexes);
    this.removeChunkIndexesOutsideOfChunkRange(chunkSize, chunkRange);

    if (widthChanged) {
      const widthSmaller =
        Math.abs(this.formWidth) < Math.abs(lastProperties.lastWidth);
      const inverted = this.formWidth < 0;

      const lastYMin = Math.min(lastMinRow, originYMin);
      const lastYMax = Math.max(lastMaxRow, originYMax);

      const newYMin = Math.min(newMinRow, originYMin);
      const newYMax = Math.max(newMaxRow, originYMax);

      if (widthSmaller) {
        // remove outer chunkIndexes
        for (
          let x = chunkXMinInChunkRange(
            inverted ? lastMinColumn : newMaxColumn + 1,
            chunkRange
          );
          x <=
          chunkXMaxInChunkRange(
            inverted ? newMinColumn - 1 : lastMaxColumn,
            chunkRange
          );
          x++
        ) {
          for (
            let y = chunkYMinInChunkRange(lastYMin, chunkRange);
            y <= chunkYMaxInChunkRange(lastYMax, chunkRange);
            y++
          ) {
            removeChunkIndexes.addIndex(x, y);
          }
        }

        // reload chunkIndexes
        for (
          let x = chunkXMinInChunkRange(newMinColumn, chunkRange);
          x <= chunkXMaxInChunkRange(newMaxColumn, chunkRange);
          x++
        ) {
          for (
            let y = chunkYMinInChunkRange(newYMin, chunkRange);
            y <= chunkYMaxInChunkRange(newYMax, chunkRange);
            y++
          ) {
            reloadChunkIndexes.addIndex(x, y);
          }
        }
      } else {
        // reload and add outer chunkIndexes
        for (
          let x = chunkXMinInChunkRange(
            inverted ? newMinColumn : lastMinColumn,
            chunkRange
          );
          x <=
          chunkXMaxInChunkRange(
            inverted ? lastMaxColumn : newMaxColumn,
            chunkRange
          );
          x++
        ) {
          for (
            let y = chunkYMinInChunkRange(newYMin, chunkRange);
            y <= chunkYMaxInChunkRange(newYMax, chunkRange);
            y++
          ) {
            reloadChunkIndexes.addIndex(x, y);
            chunkIndexes.addIndex(x, y);
          }
        }
      }
    }

    if (heightChanged) {
      const heightSmaller =
        Math.abs(this.formHeight) < Math.abs(lastProperties.lastHeight);
      const inverted = this.formHeight < 0;

      const lastXMin = Math.min(lastMinColumn, originXMin);
      const lastXMax = Math.max(lastMaxColumn, originXMax);

      const newXMin = Math.min(newMinColumn, originXMin);
      const newXMax = Math.max(newMaxColumn, originXMax);

      if (heightSmaller) {
        // remove outer chunkIndexes
        for (
          let y = chunkYMinInChunkRange(
            inverted ? lastMinRow : newMaxRow + 1,
            chunkRange
          );
          y <=
          chunkYMaxInChunkRange(
            inverted ? newMinRow - 1 : lastMaxRow,
            chunkRange
          );
          y++
        ) {
          for (
            let x = chunkXMinInChunkRange(lastXMin, chunkRange);
            x <= chunkXMaxInChunkRange(lastXMax, chunkRange);
            x++
          ) {
            removeChunkIndexes.addIndex(x, y);
          }
        }

        // reload chunkIndexes
        for (
          let y = chunkYMinInChunkRange(newMinRow, chunkRange);
          y <= chunkYMaxInChunkRange(newMaxRow, chunkRange);
          y++
        ) {
          for (
            let x = chunkXMinInChunkRange(newXMin, chunkRange);
            x <= chunkXMaxInChunkRange(newXMax, chunkRange);
            x++
          ) {
            reloadChunkIndexes.addIndex(x, y);
          }
        }
      } else {
        // reload and add outer chunkIndexes
        for (
          let y = chunkYMinInChunkRange(
            inverted ? newMinRow : lastMinRow,
            chunkRange
          );
          y <=
          chunkYMaxInChunkRange(inverted ? lastMaxRow : newMaxRow, chunkRange);
          y++
        ) {
          for (
            let x = chunkXMinInChunkRange(newXMin, chunkRange);
            x <= chunkXMaxInChunkRange(newXMax, chunkRange);
            x++
          ) {
            reloadChunkIndexes.addIndex(x, y);
            chunkIndexes.addIndex(x, y);
          }
        }
      }
    }

    removeChunkIndexes.forEach(index => chunkIndexes.delete(index));

    this.#lastPropertiesMap.set(chunkSize, {
      lastWidth: this.formWidth,
      lastHeight: this.formHeight,
    });
    return {
      chunkIndexesToReload: reloadChunkIndexes,
      chunkIndexesToRemove: removeChunkIndexes,
    };
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

    this.map.clear();

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
