import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

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
}
