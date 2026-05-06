import { Rect } from '../Geometry';

import { CanvasChunkMap } from './CanvasChunkMap';
import { ChunkIndexSet } from './ChunkIndex';
import { Form } from './Form';

export class ScalableCanvasChunkMap extends Map<number, CanvasChunkMap> {
  render(
    scaleIndex: number,
    canvasScale: number,
    reloadChunkIndexes?: ChunkIndexSet,
    removeChunkIndexes?: ChunkIndexSet
  ) {
    this.get(scaleIndex)!.render(
      canvasScale,
      reloadChunkIndexes,
      removeChunkIndexes
    );
  }

  removeForm(scaleIndex: number, form: Form, chunkIndexes?: ChunkIndexSet) {
    this.get(scaleIndex)!.removeForm(form, chunkIndexes);
  }

  removeChunkIndexes(scaleIndex: number, chunkIndexes: ChunkIndexSet) {
    this.get(scaleIndex)!.removeChunkIndexes(chunkIndexes);
  }

  reloadFormChunks(
    scaleIndex: number,
    form: Form,
    formLayerIndex: number,
    loadedChunkRange: Rect,
    reloadChunkIndexes?: ChunkIndexSet,
    removeChunkIndexes?: ChunkIndexSet,
    addedChunkIndexes?: ChunkIndexSet
  ) {
    this.get(scaleIndex)!.reloadFormChunks(
      form,
      formLayerIndex,
      loadedChunkRange,
      reloadChunkIndexes,
      removeChunkIndexes,
      addedChunkIndexes
    );
  }

  showChunkIndexes(scaleIndex: number, chunkIndexes: ChunkIndexSet) {
    this.get(scaleIndex)?.showChunkIndexes(chunkIndexes);
  }

  showChunkIndexRange(scaleIndex: number, range: Rect) {
    this.get(scaleIndex)?.showChunkIndexRange(range);
  }

  hideChunkIndexes(scaleIndex: number, chunkIndexes: ChunkIndexSet) {
    this.get(scaleIndex)?.hideChunkIndexes(chunkIndexes);
  }

  changeFormsLayers(scaleIndex: number, chunkIndexes: ChunkIndexSet) {
    this.get(scaleIndex)!.changeFormsLayers(chunkIndexes);
  }

  removeFormImages(
    scaleIndex: number,
    form: Form,
    chunkIndexes?: ChunkIndexSet
  ) {
    this.get(scaleIndex)?.removeFormImages(form, chunkIndexes);
  }

  removeFormImagesOutsideOfChunkRange(
    scaleIndex: number,
    form: Form,
    chunkRange: Rect
  ) {
    this.get(scaleIndex)?.removeFormImagesOutsideOfChunkRange(form, chunkRange);
  }
}
