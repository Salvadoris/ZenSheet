import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { Rect } from '../Geometry';

import {
  ChunkIndex,
  ChunkIndexSet,
  chunkIndexToString,
  stringToChunkIndex,
} from './ChunkIndex';
import { Form } from './Form';

enum ImageLoadState {
  reload = 'reload',
  loading = 'loading',
  loaded = 'loaded',
}

enum ReloadImageSaveAction {
  None = 'None',
  Save = 'Save',
  DelaySave = 'DelaySave',
}

interface FormImage {
  image: HTMLImageElement;
  loadState: ImageLoadState;
  layerIndex: number;
  formId: string;
  form: Form;
  opacity?: number | null;
}

interface CanvasChunk {
  formImages: FormImage[];
  visible: boolean;
}

export interface IndexedForm {
  form: Form;
  chunkIndexes: ChunkIndexSet;
  layerIndex: number;
}

export class CanvasChunkMap extends Map<string, CanvasChunk> {
  ctx: CanvasRenderingContext2D;
  #canvasChunkSize: number;
  #formChunksToSave: Map<string, FormImage>;

  constructor(ctx: CanvasRenderingContext2D, canvasChunkSize: number) {
    super();
    this.#canvasChunkSize = canvasChunkSize;
    this.ctx = ctx;
    this.#formChunksToSave = new Map<string, FormImage>();
  }

  render(
    canvasScale: number,
    reloadChunkIndexes?: ChunkIndexSet,
    removeChunkIndexes?: ChunkIndexSet
  ) {
    const screenChunkSize = this.#canvasChunkSize * canvasScale;
    if (reloadChunkIndexes || removeChunkIndexes) {
      if (reloadChunkIndexes) {
        this.saveFormImages(reloadChunkIndexes);
        reloadChunkIndexes.forEach(chunkIndex => {
          const chunk = this.get(chunkIndex);
          if (chunk && chunk.visible) {
            this.drawChunk(
              screenChunkSize,
              stringToChunkIndex(chunkIndex),
              chunk,
              ReloadImageSaveAction.DelaySave
            );
            if (chunk.formImages.length === 0) {
              this.delete(chunkIndex);
            }
          }
        });
      }
      if (removeChunkIndexes) {
        removeChunkIndexes.forEach(chunkIndex => {
          const chunk = this.get(chunkIndex);
          if (chunk && chunk.visible) {
            this.drawChunk(
              screenChunkSize,
              stringToChunkIndex(chunkIndex),
              chunk,
              ReloadImageSaveAction.None
            );
            if (chunk.formImages.length === 0) {
              this.delete(chunkIndex);
            }
          }
        });
      }
    } else {
      this.saveFormImages();
      for (const [chunkIndex, chunk] of this) {
        if (chunk && chunk.visible) {
          this.drawChunk(
            screenChunkSize,
            stringToChunkIndex(chunkIndex),
            chunk,
            ReloadImageSaveAction.Save
          );
          if (chunk.formImages.length === 0) {
            this.delete(chunkIndex);
          }
        }
      }
    }
  }

  removeForm(form: Form, chunkIndexes?: ChunkIndexSet) {
    if (chunkIndexes) {
      chunkIndexes.forEach(chunkIndex => {
        const chunk = this.get(chunkIndex);
        if (chunk) {
          const idx = chunk.formImages.findIndex(
            i => i.formId === form.properties[FormPropertyName.id]
          );
          if (idx !== -1) {
            chunk.formImages.splice(idx, 1);
          }
        }
      });
    } else {
      for (const chunk of this.values()) {
        const idx = chunk.formImages.findIndex(
          i => i.formId === form.properties[FormPropertyName.id]
        );
        if (idx !== -1) {
          chunk.formImages.splice(idx, 1);
        }
      }
    }
  }

  removeChunkIndexes(chunkIndexes: ChunkIndexSet) {
    chunkIndexes.forEach(index => this.delete(index));
  }

  reloadFormChunks(
    form: Form,
    formLayerIndex: number,
    loadedChunkRange: Rect,
    reloadChunkIndexes?: ChunkIndexSet,
    removeChunkIndexes?: ChunkIndexSet,
    addedChunkIndexes?: ChunkIndexSet
  ) {
    if (reloadChunkIndexes) {
      reloadChunkIndexes.forEach(chunkIndex => {
        if (this.chunkIndexInsideChunkRange(chunkIndex, loadedChunkRange)) {
          this.reloadFormChunk(chunkIndex, formLayerIndex, form);
        } else {
          const chunk = this.get(chunkIndex);
          if (chunk) {
            const formImage = chunk.formImages.find(
              formImage =>
                formImage.formId === form.properties[FormPropertyName.id]
            );
            if (formImage !== undefined) {
              formImage.loadState = ImageLoadState.reload;
            }
          }
        }
      });
    }

    // only reload when chunkIndex has no formImage
    if (addedChunkIndexes) {
      addedChunkIndexes.forEach(chunkIndex => {
        if (
          this.chunkIndexInsideChunkRange(chunkIndex, loadedChunkRange) &&
          !reloadChunkIndexes?.has(chunkIndex)
        ) {
          const chunk = this.get(chunkIndex);
          if (chunk) {
            const formImage = chunk.formImages.find(
              formImage =>
                formImage.formId === form.properties[FormPropertyName.id]
            );
            if (formImage === undefined) {
              this.reloadFormChunk(chunkIndex, formLayerIndex, form);
            }
          } else {
            this.reloadFormChunk(chunkIndex, formLayerIndex, form);
          }
        }
      });
    }

    if (removeChunkIndexes) {
      removeChunkIndexes.forEach(chunkIndex => {
        this.reloadRemoveFormChunk(chunkIndex, form);
      });
    }
  }

  showChunkIndexes(chunkIndexes: ChunkIndexSet) {
    chunkIndexes.forEach(chunkIndex => {
      const chunk = this.get(chunkIndex);
      if (chunk) {
        chunk.visible = true;
      }
    });
  }

  showChunkIndexRange(range: Rect) {
    for (let x = range[0]; x <= range[2]; x++) {
      for (let y = range[1]; y <= range[3]; y++) {
        const chunk = this.get(chunkIndexToString([x, y]));
        if (chunk) {
          chunk.visible = true;
        }
      }
    }
  }

  hideChunkIndexes(chunkIndexes: ChunkIndexSet) {
    chunkIndexes.forEach(chunkIndex => {
      const chunk = this.get(chunkIndex);
      if (chunk) {
        chunk.visible = false;
      }
    });
  }

  changeFormsLayers(chunkIndexes: ChunkIndexSet): void {
    chunkIndexes.forEach(chunkIndex => {
      const chunk = this.get(chunkIndex);
      if (chunk) {
        chunk.formImages.sort((a, b) => a.layerIndex - b.layerIndex);
      }
    });
  }

  private saveFormImages(chunkIndexes?: ChunkIndexSet) {
    for (const [chunkIndex, formImage] of this.#formChunksToSave) {
      if (
        chunkIndexes === undefined ||
        (this.has(chunkIndex) && !chunkIndexes.has(chunkIndex))
      ) {
        if (
          formImage.form.chunkMap.get(this.#canvasChunkSize)?.has(chunkIndex)
        ) {
          const canvas = formImage.form.loadChunkImage(
            this.#canvasChunkSize,
            stringToChunkIndex(chunkIndex)
          );
          formImage.image.src = canvas.toDataURL();
          formImage.loadState = ImageLoadState.loading;
          formImage.image.onload = () => {
            formImage.loadState = ImageLoadState.loaded;
          };
        }
        this.#formChunksToSave.delete(chunkIndex);
      }
    }
  }

  private reloadFormChunk(
    chunkIndex: string,
    formLayerIndex: number,
    form: Form
  ) {
    if (!this.has(chunkIndex)) {
      this.addChunk(chunkIndex);
    }
    const chunk = this.get(chunkIndex);
    if (chunk) {
      const formImage = chunk.formImages.find(
        formImage => formImage.formId === form.properties[FormPropertyName.id]
      );
      if (formImage !== undefined) {
        formImage.loadState = ImageLoadState.reload;
      } else {
        chunk.formImages.push({
          formId: form.properties[FormPropertyName.id],
          form: form,
          layerIndex: formLayerIndex,
          image: new Image(),
          loadState: ImageLoadState.reload,
          opacity: form.style.Opacity,
        });
        chunk.formImages.sort((a, b) => a.layerIndex - b.layerIndex);
      }
    }
  }

  private reloadRemoveFormChunk(chunkIndex: string, form: Form) {
    const chunk = this.get(chunkIndex);
    if (chunk) {
      const idx = chunk.formImages.findIndex(
        i => i.formId === form.properties[FormPropertyName.id]
      );
      if (idx !== -1) {
        chunk.formImages.splice(idx, 1);
      }
    }
  }

  removeFormImages(form: Form, chunkIndexes?: ChunkIndexSet) {
    if (chunkIndexes) {
      chunkIndexes.forEach(chunkIndex => {
        this.reloadRemoveFormChunk(chunkIndex, form);
      });
    } else {
      for (const [chunkIndex] of this) {
        this.reloadRemoveFormChunk(chunkIndex, form);
      }
    }
  }

  removeFormImagesOutsideOfChunkRange(form: Form, chunkRange: Rect) {
    for (const [chunkIndex, chunk] of this) {
      if (chunk) {
        const idx = chunk.formImages.findIndex(
          i => i.formId === form.properties[FormPropertyName.id]
        );
        if (idx !== -1) {
          const [x, y] = stringToChunkIndex(chunkIndex);
          const outside = !(
            x >= chunkRange[0] &&
            x <= chunkRange[2] &&
            y >= chunkRange[1] &&
            y <= chunkRange[3]
          );
          if (outside) {
            chunk.formImages.splice(idx, 1);
            if (chunk.formImages.length === 0) {
              this.delete(chunkIndex);
            }
          }
        }
      }
    }
  }

  private addChunk(chunkIndex: string) {
    this.set(chunkIndex, {
      formImages: [],
      visible: false,
    });
  }

  clearChunks() {
    this.clear();
  }

  isEmpty() {
    return this.size === 0;
  }

  private drawChunk(
    screenChunkSize: number,
    chunkIndex: ChunkIndex,
    chunk: CanvasChunk,
    saveAction: ReloadImageSaveAction
  ) {
    const xDecimal = chunkIndex[0] * screenChunkSize;
    const yDecimal = chunkIndex[1] * screenChunkSize;
    const x = Math.round(xDecimal);
    const y = Math.round(yDecimal);
    const width = Math.round(xDecimal + screenChunkSize) - x;
    const height = Math.round(yDecimal + screenChunkSize) - y;

    this.ctx.clearRect(x, y, width, height);
    for (const formImage of chunk.formImages) {
      switch (formImage.loadState) {
        case ImageLoadState.reload: {
          const canvas = formImage.form.loadChunkImage(
            this.#canvasChunkSize,
            chunkIndex
          );

          if (formImage.opacity !== null && formImage.opacity !== undefined) {
            this.ctx.globalAlpha = formImage.opacity;
          }
          this.ctx.drawImage(canvas, x, y, width, height);

          if (saveAction === ReloadImageSaveAction.DelaySave) {
            this.#formChunksToSave.set(
              chunkIndexToString(chunkIndex),
              formImage
            );
          } else if (saveAction === ReloadImageSaveAction.Save) {
            formImage.image.src = canvas.toDataURL();
            formImage.loadState = ImageLoadState.loading;
            formImage.image.onload = () => {
              formImage.loadState = ImageLoadState.loaded;
            };
          }

          break;
        }
        case ImageLoadState.loading:
          if (formImage.opacity !== null && formImage.opacity !== undefined) {
            this.ctx.globalAlpha = formImage.opacity;
          }
          this.ctx.drawImage(
            formImage.form.loadChunkImage(this.#canvasChunkSize, chunkIndex),
            x,
            y,
            width,
            height
          );
          break;
        case ImageLoadState.loaded:
          if (formImage.opacity !== null && formImage.opacity !== undefined) {
            this.ctx.globalAlpha = formImage.opacity;
          }
          this.ctx.drawImage(formImage.image, x, y, width, height);
          break;
      }
    }
  }

  private chunkIndexInsideChunkRange(chunkIndex: string, chunkRange: Rect) {
    const [x, y] = stringToChunkIndex(chunkIndex);
    return (
      x >= chunkRange[0] &&
      y >= chunkRange[1] &&
      x <= chunkRange[2] &&
      y <= chunkRange[3]
    );
  }
}
