import { EllipseDrawingProperties } from '../../DrawingProperties/EllipseDrawingProperties';
import { Rect } from '../../Geometry';
import { StyleName } from '../../ShapeStyles/StyleName';
import { ChunkIndexSet, stringToChunkIndex } from '../ChunkIndex';
import {
  ChunkChange,
  chunkXMaxInChunkRange,
  chunkXMinInChunkRange,
  chunkYMaxInChunkRange,
  chunkYMinInChunkRange,
} from '../FormChunkMap';

import {
  chunkRangeInRow,
  EllipseChunkMap,
  EllipseType,
} from './EllipseChunkMap';

interface EllipseChangeProperties {
  lastWidth: number;
  lastHeight: number;
}

export class EllipseDrawingChunkMap extends EllipseChunkMap {
  declare protected readonly formProperties: Readonly<EllipseDrawingProperties>;
  #lastPropertiesMap = new Map<number, EllipseChangeProperties>();

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

    if (this.ellipseType === EllipseType.Transparent) {
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

    if (this.ellipseType === EllipseType.Filled) {
      return this.updatedFilledEllipseChunkMap(chunkSize, chunkRange);
    } else if (this.ellipseType === EllipseType.FilledBorder) {
      return this.updatedFilledBorderEllipseChunkMap(chunkSize, chunkRange);
    }

    return this.updateFullChunkMap(chunkSize, chunkRange);
  }

  // private updatedFilledBorderEllipseChunkMap(chunkSize: number): ChunkChange {
  //   const lastProperties = this.#lastPropertiesMap.get(chunkSize);
  //   if (lastProperties === undefined) {
  //     throw new Error('lastWidth or lastHeight was not assigned a value');
  //   }

  //   const lineWidth = this.formStyle[StyleName.LineWidth] / chunkSize;
  //   const offset = lineWidth / 2;

  //   const originX = this.formOriginX / chunkSize;
  //   const originY = this.formOriginY / chunkSize;

  //   const lastWidth = lastProperties.lastWidth / chunkSize;
  //   const lastHeight = lastProperties.lastHeight / chunkSize;
  //   const lastCenterX = originX + lastWidth / 2;
  //   const lastCenterY = originY + lastHeight / 2;
  //   const lastRadiusX = Math.abs(lastWidth) / 2 + offset;
  //   const lastRadiusY = Math.abs(lastHeight) / 2 + offset;

  //   const lastInnerRadiusX = lastRadiusX - lineWidth;
  //   const lastInnerRadiusY = lastRadiusY - lineWidth;

  //   const lastXMin = Math.floor(lastCenterX - lastRadiusX);
  //   const lastXMax = Math.ceil(lastCenterX + lastRadiusX) - 1;
  //   const lastYMin = Math.floor(lastCenterY - lastRadiusY);
  //   const lastYMax = Math.ceil(lastCenterY + lastRadiusY) - 1;

  //   const width = this.formWidth / chunkSize;
  //   const height = this.formHeight / chunkSize;
  //   const centerX = originX + width / 2;
  //   const centerY = originY + height / 2;
  //   const radiusX = Math.abs(width) / 2 + offset;
  //   const radiusY = Math.abs(height) / 2 + offset;

  //   const innerRadiusX = radiusX - lineWidth;
  //   const innerRadiusY = radiusY - lineWidth;

  //   const xMin = Math.floor(centerX - radiusX);
  //   const xMax = Math.ceil(centerX + radiusX) - 1;
  //   const yMin = Math.floor(centerY - radiusY);
  //   const yMax = Math.ceil(centerY + radiusY) - 1;

  //   const chunkIndexes = this.get(chunkSize)!;
  //   const reloadChunkIndexes = new ChunkIndexSet();
  //   const removedChunkIndexes = new ChunkIndexSet();

  //   for (let y = yMin; y <= yMax; y++) {
  //     const [min, max] = this.chunkRangeInRow(
  //       y,
  //       xMin,
  //       xMax,
  //       centerX,
  //       centerY,
  //       radiusX,
  //       radiusY
  //     );
  //     if (y >= lastYMin && y <= lastYMax) {
  //       const [lastMin, lastMax] = this.chunkRangeInRow(
  //         y,
  //         lastXMin,
  //         lastXMax,
  //         lastCenterX,
  //         lastCenterY,
  //         lastRadiusX,
  //         lastRadiusY
  //       );

  //       for (let x = lastMin; x <= lastMax; x++) {
  //         if (x < min || x > max) {
  //           removedChunkIndexes.addIndex(x, y);
  //         }
  //       }

  //       for (let x = min; x <= max; x++) {
  //         if (x < lastMin || x > lastMax) {
  //           chunkIndexes.addIndex(x, y);
  //         }
  //       }
  //     } else {
  //       for (let x = min; x <= max; x++) {
  //         chunkIndexes.addIndex(x, y);
  //       }
  //     }

  //     if (min < max - 1) {
  //       const filledRange = this.filledChunkRangeInRow(
  //         y,
  //         min,
  //         max,
  //         centerX,
  //         centerY,
  //         innerRadiusX,
  //         innerRadiusY,
  //         lastCenterX,
  //         lastCenterY,
  //         lastInnerRadiusX,
  //         lastInnerRadiusY
  //       );
  //       if (filledRange) {
  //         for (let x = min; x < filledRange[0]; x++) {
  //           reloadChunkIndexes.addIndex(x, y);
  //         }
  //         for (let x = max; x > filledRange[1]; x--) {
  //           reloadChunkIndexes.addIndex(x, y);
  //         }
  //       } else {
  //         for (let x = min; x <= max; x++) {
  //           reloadChunkIndexes.addIndex(x, y);
  //         }
  //       }
  //     } else {
  //       for (let x = min; x <= max; x++) {
  //         reloadChunkIndexes.addIndex(x, y);
  //       }
  //     }
  //   }

  //   for (let y = lastYMin; y <= lastYMax; y++) {
  //     if (y < yMin || y > yMax) {
  //       const [min, max] = this.chunkRangeInRow(
  //         y,
  //         lastXMin,
  //         lastXMax,
  //         lastCenterX,
  //         lastCenterY,
  //         lastRadiusX,
  //         lastRadiusY
  //       );
  //       for (let x = min; x <= max; x++) {
  //         removedChunkIndexes.addIndex(x, y);
  //       }
  //     }
  //   }

  //   removedChunkIndexes.forEach(index => chunkIndexes.delete(index));

  //   this.#lastPropertiesMap.set(chunkSize, {
  //     lastWidth: this.formWidth,
  //     lastHeight: this.formHeight,
  //   });
  //   return {
  //     reloadChunkIndexes: reloadChunkIndexes,
  //     removeChunkIndexes: removedChunkIndexes,
  //   };
  // }

  // private updatedFilledEllipseChunkMap(chunkSize: number): ChunkChange {
  //   const lastProperties = this.#lastPropertiesMap.get(chunkSize);
  //   if (lastProperties === undefined) {
  //     throw new Error('lastWidth or lastHeight was not assigned a value');
  //   }

  //   const originX = this.formOriginX / chunkSize;
  //   const originY = this.formOriginY / chunkSize;

  //   const lastWidth = lastProperties.lastWidth / chunkSize;
  //   const lastHeight = lastProperties.lastHeight / chunkSize;
  //   const lastCenterX = originX + lastWidth / 2;
  //   const lastCenterY = originY + lastHeight / 2;
  //   const lastRadiusX = Math.abs(lastWidth) / 2;
  //   const lastRadiusY = Math.abs(lastHeight) / 2;

  //   const lastXMin = Math.floor(lastCenterX - lastRadiusX);
  //   const lastXMax = Math.ceil(lastCenterX + lastRadiusX) - 1;
  //   const lastYMin = Math.floor(lastCenterY - lastRadiusY);
  //   const lastYMax = Math.ceil(lastCenterY + lastRadiusY) - 1;

  //   const width = this.formWidth / chunkSize;
  //   const height = this.formHeight / chunkSize;
  //   const centerX = originX + width / 2;
  //   const centerY = originY + height / 2;
  //   const radiusX = Math.abs(width) / 2;
  //   const radiusY = Math.abs(height) / 2;

  //   const xMin = Math.floor(centerX - radiusX);
  //   const xMax = Math.ceil(centerX + radiusX) - 1;
  //   const yMin = Math.floor(centerY - radiusY);
  //   const yMax = Math.ceil(centerY + radiusY) - 1;

  //   const chunkIndexes = this.get(chunkSize)!;
  //   const reloadChunkIndexes = new ChunkIndexSet();
  //   const removedChunkIndexes = new ChunkIndexSet();

  //   for (let y = yMin; y <= yMax; y++) {
  //     const [min, max] = this.chunkRangeInRow(
  //       y,
  //       xMin,
  //       xMax,
  //       centerX,
  //       centerY,
  //       radiusX,
  //       radiusY
  //     );
  //     if (y >= lastYMin && y <= lastYMax) {
  //       const [lastMin, lastMax] = this.chunkRangeInRow(
  //         y,
  //         lastXMin,
  //         lastXMax,
  //         lastCenterX,
  //         lastCenterY,
  //         lastRadiusX,
  //         lastRadiusY
  //       );

  //       for (let x = lastMin; x <= lastMax; x++) {
  //         if (x < min || x > max) {
  //           removedChunkIndexes.addIndex(x, y);
  //         }
  //       }

  //       for (let x = min; x <= max; x++) {
  //         if (x < lastMin || x > lastMax) {
  //           chunkIndexes.addIndex(x, y);
  //         }
  //       }
  //     } else {
  //       for (let x = min; x <= max; x++) {
  //         chunkIndexes.addIndex(x, y);
  //       }
  //     }

  //     if (min < max - 1) {
  //       const filledRange = this.filledChunkRangeInRow(
  //         y,
  //         min,
  //         max,
  //         centerX,
  //         centerY,
  //         radiusX,
  //         radiusY,
  //         lastCenterX,
  //         lastCenterY,
  //         lastRadiusX,
  //         lastRadiusY
  //       );
  //       if (filledRange) {
  //         for (let x = min; x < filledRange[0]; x++) {
  //           reloadChunkIndexes.addIndex(x, y);
  //         }
  //         for (let x = max; x > filledRange[1]; x--) {
  //           reloadChunkIndexes.addIndex(x, y);
  //         }
  //       } else {
  //         for (let x = min; x <= max; x++) {
  //           reloadChunkIndexes.addIndex(x, y);
  //         }
  //       }
  //     } else {
  //       for (let x = min; x <= max; x++) {
  //         reloadChunkIndexes.addIndex(x, y);
  //       }
  //     }
  //   }

  //   for (let y = lastYMin; y <= lastYMax; y++) {
  //     if (y < yMin || y > yMax) {
  //       const [min, max] = this.chunkRangeInRow(
  //         y,
  //         lastXMin,
  //         lastXMax,
  //         lastCenterX,
  //         lastCenterY,
  //         lastRadiusX,
  //         lastRadiusY
  //       );
  //       for (let x = min; x <= max; x++) {
  //         removedChunkIndexes.addIndex(x, y);
  //       }
  //     }
  //   }

  //   removedChunkIndexes.forEach(index => chunkIndexes.delete(index));

  //   this.#lastPropertiesMap.set(chunkSize, {
  //     lastWidth: this.formWidth,
  //     lastHeight: this.formHeight,
  //   });
  //   return {
  //     reloadChunkIndexes: reloadChunkIndexes,
  //     removeChunkIndexes: removedChunkIndexes,
  //   };
  // }

  private updatedFilledBorderEllipseChunkMap(
    chunkSize: number,
    chunkRange: Rect
  ): ChunkChange {
    const lastProperties = this.#lastPropertiesMap.get(chunkSize);
    if (lastProperties === undefined) {
      throw new Error('lastWidth or lastHeight was not assigned a value');
    }

    const lineWidth = this.formStyle[StyleName.LineWidth] / chunkSize;
    const offset = lineWidth / 2;

    const originX = this.formOriginX / chunkSize;
    const originY = this.formOriginY / chunkSize;

    const lastWidth = lastProperties.lastWidth / chunkSize;
    const lastHeight = lastProperties.lastHeight / chunkSize;
    const lastCenterX = originX + lastWidth / 2;
    const lastCenterY = originY + lastHeight / 2;
    const lastRadiusX = Math.abs(lastWidth) / 2 + offset;
    const lastRadiusY = Math.abs(lastHeight) / 2 + offset;

    const lastInnerRadiusX = lastRadiusX - lineWidth;
    const lastInnerRadiusY = lastRadiusY - lineWidth;

    const lastXMin = chunkXMinInChunkRange(
      Math.floor(lastCenterX - lastRadiusX),
      chunkRange
    );
    const lastXMax = chunkXMaxInChunkRange(
      Math.ceil(lastCenterX + lastRadiusX) - 1,
      chunkRange
    );
    const lastYMin = chunkYMinInChunkRange(
      Math.floor(lastCenterY - lastRadiusY),
      chunkRange
    );
    const lastYMax = chunkYMaxInChunkRange(
      Math.ceil(lastCenterY + lastRadiusY) - 1,
      chunkRange
    );

    const width = this.formWidth / chunkSize;
    const height = this.formHeight / chunkSize;
    const centerX = originX + width / 2;
    const centerY = originY + height / 2;
    const radiusX = Math.abs(width) / 2 + offset;
    const radiusY = Math.abs(height) / 2 + offset;

    const innerRadiusX = radiusX - lineWidth;
    const innerRadiusY = radiusY - lineWidth;

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

    const chunkIndexes = this.get(chunkSize)!;
    const reloadChunkIndexes = new ChunkIndexSet();
    const removedChunkIndexes = new ChunkIndexSet();

    this.map.clear();
    this.map.set(chunkSize, chunkIndexes);
    this.removeChunkIndexesOutsideOfChunkRange(chunkSize, chunkRange);

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
        if (y >= lastYMin && y <= lastYMax) {
          const lastRange = chunkRangeInRow(
            y,
            lastXMin,
            lastXMax,
            lastCenterX,
            lastCenterY,
            lastRadiusX,
            lastRadiusY
          );

          if (lastRange) {
            const [lastMin, lastMax] = lastRange;

            for (let x = lastMin; x <= lastMax; x++) {
              if (x < min || x > max) {
                removedChunkIndexes.addIndex(x, y);
              }
            }

            for (let x = min; x <= max; x++) {
              if (x < lastMin || x > lastMax) {
                chunkIndexes.addIndex(x, y);
                reloadChunkIndexes.addIndex(x, y);
              }
            }
          } else {
            for (let x = min; x <= max; x++) {
              chunkIndexes.addIndex(x, y);
              reloadChunkIndexes.addIndex(x, y);
            }
          }
        } else {
          for (let x = min; x <= max; x++) {
            chunkIndexes.addIndex(x, y);
            reloadChunkIndexes.addIndex(x, y);
          }
        }

        if (min < max - 1) {
          const filledRange = this.filledChunkRangeInRow(
            y,
            min,
            max,
            centerX,
            centerY,
            innerRadiusX,
            innerRadiusY,
            lastCenterX,
            lastCenterY,
            lastInnerRadiusX,
            lastInnerRadiusY
          );
          if (filledRange) {
            for (let x = min; x < filledRange[0]; x++) {
              reloadChunkIndexes.addIndex(x, y);
            }
            for (let x = max; x > filledRange[1]; x--) {
              reloadChunkIndexes.addIndex(x, y);
            }
          } else {
            for (let x = min; x <= max; x++) {
              reloadChunkIndexes.addIndex(x, y);
            }
          }
        } else {
          for (let x = min; x <= max; x++) {
            reloadChunkIndexes.addIndex(x, y);
          }
        }
      } else {
        chunkIndexes.forEach(chunkIndex => {
          const [_cx, cy] = stringToChunkIndex(chunkIndex);
          if (y === cy) {
            chunkIndexes.delete(chunkIndex);
            removedChunkIndexes.add(chunkIndex);
          }
        });
      }
    }

    for (let y = lastYMin; y <= lastYMax; y++) {
      if (y < yMin || y > yMax) {
        const range = chunkRangeInRow(
          y,
          lastXMin,
          lastXMax,
          lastCenterX,
          lastCenterY,
          lastRadiusX,
          lastRadiusY
        );
        if (range) {
          const [min, max] = range;
          for (let x = min; x <= max; x++) {
            removedChunkIndexes.addIndex(x, y);
          }
        }
      }
    }

    removedChunkIndexes.forEach(index => chunkIndexes.delete(index));

    this.#lastPropertiesMap.set(chunkSize, {
      lastWidth: this.formWidth,
      lastHeight: this.formHeight,
    });
    return {
      chunkIndexesToReload: reloadChunkIndexes,
      chunkIndexesToRemove: removedChunkIndexes,
    };
  }

  private updatedFilledEllipseChunkMap(
    chunkSize: number,
    chunkRange: Rect
  ): ChunkChange {
    const lastProperties = this.#lastPropertiesMap.get(chunkSize);
    if (lastProperties === undefined) {
      throw new Error('lastWidth or lastHeight was not assigned a value');
    }

    const originX = this.formOriginX / chunkSize;
    const originY = this.formOriginY / chunkSize;

    const lastWidth = lastProperties.lastWidth / chunkSize;
    const lastHeight = lastProperties.lastHeight / chunkSize;
    const lastCenterX = originX + lastWidth / 2;
    const lastCenterY = originY + lastHeight / 2;
    const lastRadiusX = Math.abs(lastWidth) / 2;
    const lastRadiusY = Math.abs(lastHeight) / 2;

    const lastXMin = chunkXMinInChunkRange(
      Math.floor(lastCenterX - lastRadiusX),
      chunkRange
    );
    const lastXMax = chunkXMaxInChunkRange(
      Math.ceil(lastCenterX + lastRadiusX) - 1,
      chunkRange
    );
    const lastYMin = chunkYMinInChunkRange(
      Math.floor(lastCenterY - lastRadiusY),
      chunkRange
    );
    const lastYMax = chunkYMaxInChunkRange(
      Math.ceil(lastCenterY + lastRadiusY) - 1,
      chunkRange
    );

    const width = this.formWidth / chunkSize;
    const height = this.formHeight / chunkSize;
    const centerX = originX + width / 2;
    const centerY = originY + height / 2;
    const radiusX = Math.abs(width) / 2;
    const radiusY = Math.abs(height) / 2;

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

    const chunkIndexes = this.get(chunkSize)!;
    const reloadChunkIndexes = new ChunkIndexSet();
    const removedChunkIndexes = new ChunkIndexSet();

    this.map.clear();
    this.map.set(chunkSize, chunkIndexes);
    this.removeChunkIndexesOutsideOfChunkRange(chunkSize, chunkRange);

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

        if (y >= lastYMin && y <= lastYMax) {
          const lastRange = chunkRangeInRow(
            y,
            lastXMin,
            lastXMax,
            lastCenterX,
            lastCenterY,
            lastRadiusX,
            lastRadiusY
          );
          if (lastRange) {
            const [lastMin, lastMax] = lastRange;
            for (let x = lastMin; x <= lastMax; x++) {
              if (x < min || x > max) {
                removedChunkIndexes.addIndex(x, y);
              }
            }

            for (let x = min; x <= max; x++) {
              if (x < lastMin || x > lastMax) {
                chunkIndexes.addIndex(x, y);
                reloadChunkIndexes.addIndex(x, y);
              }
            }
          } else {
            for (let x = min; x <= max; x++) {
              chunkIndexes.addIndex(x, y);
              reloadChunkIndexes.addIndex(x, y);
            }
          }
        } else {
          for (let x = min; x <= max; x++) {
            chunkIndexes.addIndex(x, y);
            reloadChunkIndexes.addIndex(x, y);
          }
        }

        if (min < max - 1) {
          const filledRange = this.filledChunkRangeInRow(
            y,
            min,
            max,
            centerX,
            centerY,
            radiusX,
            radiusY,
            lastCenterX,
            lastCenterY,
            lastRadiusX,
            lastRadiusY
          );
          if (filledRange) {
            for (let x = min; x < filledRange[0]; x++) {
              reloadChunkIndexes.addIndex(x, y);
            }
            for (let x = max; x > filledRange[1]; x--) {
              reloadChunkIndexes.addIndex(x, y);
            }
          } else {
            for (let x = min; x <= max; x++) {
              reloadChunkIndexes.addIndex(x, y);
            }
          }
        } else {
          for (let x = min; x <= max; x++) {
            reloadChunkIndexes.addIndex(x, y);
          }
        }
      } else {
        chunkIndexes.forEach(chunkIndex => {
          const [_cx, cy] = stringToChunkIndex(chunkIndex);
          if (y === cy) {
            chunkIndexes.delete(chunkIndex);
            removedChunkIndexes.add(chunkIndex);
          }
        });
      }
    }

    for (let y = lastYMin; y <= lastYMax; y++) {
      if (y < yMin || y > yMax) {
        const range = chunkRangeInRow(
          y,
          lastXMin,
          lastXMax,
          lastCenterX,
          lastCenterY,
          lastRadiusX,
          lastRadiusY
        );
        if (range) {
          const [min, max] = range;
          for (let x = min; x <= max; x++) {
            removedChunkIndexes.addIndex(x, y);
          }
        }
      }
    }

    removedChunkIndexes.forEach(index => chunkIndexes.delete(index));

    this.#lastPropertiesMap.set(chunkSize, {
      lastWidth: this.formWidth,
      lastHeight: this.formHeight,
    });
    return {
      chunkIndexesToReload: reloadChunkIndexes,
      chunkIndexesToRemove: removedChunkIndexes,
    };
  }

  private filledChunkRangeInRow(
    y: number,
    xMin: number,
    xMax: number,
    centerX: number,
    centerY: number,
    radiusX: number,
    radiusY: number,
    lastCenterX: number,
    lastCenterY: number,
    lastRadiusX: number,
    lastRadiusY: number
  ): [number, number] | undefined {
    let filledMin: number | null = null;
    for (let x = xMin + 1; x < xMax; x++) {
      if (
        this.ellipseSubmergesRect(centerX, centerY, radiusX, radiusY, x, y) &&
        this.ellipseSubmergesRect(
          lastCenterX,
          lastCenterY,
          lastRadiusX,
          lastRadiusY,
          x,
          y
        )
      ) {
        filledMin = x;
        break;
      }
    }

    if (filledMin) {
      let filledMax = filledMin;
      for (let x = xMax - 1; x > filledMin; x--) {
        if (
          this.ellipseSubmergesRect(centerX, centerY, radiusX, radiusY, x, y) &&
          this.ellipseSubmergesRect(
            lastCenterX,
            lastCenterY,
            lastRadiusX,
            lastRadiusY,
            x,
            y
          )
        ) {
          filledMax = x;
          break;
        }
      }
      return [filledMin, filledMax];
    }
    return undefined;
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

  private ellipseSubmergesRect(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    rx0: number,
    ry0: number
  ): boolean {
    const corners = [
      [rx0, ry0],
      [rx0 + 1, ry0],
      [rx0, ry0 + 1],
      [rx0 + 1, ry0 + 1],
    ];

    return corners.every(([x, y]) => {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      return dx * dx + dy * dy <= 1;
    });
  }
}
