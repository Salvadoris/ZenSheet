import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';

import { EConnectivityState } from '../../services/connectivity.service';

@Component({
  selector: 'app-connection-status-badge',
  imports: [CommonModule],
  templateUrl: './connection-status-badge.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectionStatusBadge { 
  readonly connectivityStateInput = input.required<EConnectivityState>();
  readonly eConnectivityState = EConnectivityState;

  readonly isDismissed = signal(false);

  constructor() {
    effect(() => {
      this.connectivityStateInput();
      this.isDismissed.set(false);
    });
  }

  dismiss() {
    this.isDismissed.set(true);
  }
}
