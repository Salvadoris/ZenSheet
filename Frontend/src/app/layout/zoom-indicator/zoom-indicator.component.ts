import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  output,
} from '@angular/core';

@Component({
  selector: 'app-zoom-indicator',
  imports: [],
  templateUrl: './zoom-indicator.component.html',
  styleUrl: './zoom-indicator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoomIndicatorComponent {
  Math = Math;
  zoom = 1;
  #zoomstep = 0.1;

  #cdr = inject(ChangeDetectorRef);

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

  zoomChanged = output<number>();
}
