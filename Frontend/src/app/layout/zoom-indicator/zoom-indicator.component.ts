import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';

@Component({
  selector: 'app-zoom-indicator',
  imports: [CommonModule, FormsModule],
  templateUrl: './zoom-indicator.component.html',
  styleUrl: './zoom-indicator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoomIndicatorComponent {
  Math = Math;
  zoom = 1;
  #zoomstep = 0.1;
  isEditing = false;
  customZoomValue: number | null = null;

  #cdr = inject(ChangeDetectorRef);
  #zoomAction$ = new Subject<'reset' | 'cancel'>();

  constructor() {
    this.#zoomAction$
      .pipe(
        debounceTime(250),
        filter((action) => action === 'reset'),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        this.zoomChanged.emit(1);
      });
  }

  setZoom(zoom: number) {
    this.zoom = zoom;
    this.#cdr.markForCheck();
  }

  zoomIn() {
    this.zoomChanged.emit(this.zoom + this.#zoomstep);
  }

  zoomOut() {
    this.zoomChanged.emit(this.zoom - this.#zoomstep);
  }

  resetZoom() {
    // Debounce to allow double click to happen.
    this.#zoomAction$.next('reset');
  }

  enableEdit() {
    this.#zoomAction$.next('cancel');
    
    this.isEditing = true;
    this.customZoomValue = Math.round(this.zoom * 100);
  }

  disableEdit() {
    this.isEditing = false;
    this.customZoomValue = null;
  }

  onInputBlur() {
    this.finishEdit();
  }

  onInputEnter() {
    this.finishEdit();
  }

  onZoomInput() {
    this.applyCustomZoom();
  }

  private finishEdit() {
    this.applyCustomZoom();
    this.disableEdit();
  }

  private applyCustomZoom() {
    if (this.customZoomValue !== null) {
      let val = this.customZoomValue;
      if (val < 10) val = 10;
      if (val > 500) val = 500;
      
      this.zoomChanged.emit(val / 100);
    }
  }
  
  // Helper for context menu (long press on mobile).
  onContextMenu(event: Event) {
    event.preventDefault();
    this.enableEdit();
  }

  zoomChanged = output<number>();
}
