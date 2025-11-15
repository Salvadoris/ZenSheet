import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  output,
} from '@angular/core';

export enum Mode {
  Hand,
  Select,
  Pen,
  FilledRect,
  StrokedRect,
}

@Component({
  selector: 'app-toolbar',
  imports: [NgClass],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent implements OnInit {
  Mode = Mode;
  mode!: Mode;
  modeChange = output<Mode>();

  cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.changeMode(Mode.Pen);
  }

  changeMode(mode: Mode) {
    this.mode = mode;
    this.cdr.markForCheck();
    this.modeChange.emit(mode);
  }
}
