import { Injectable } from '@angular/core';

import { generateUuid } from '../utils/uuid';

@Injectable({
  providedIn: 'root',
})
export class ClientSessionService {
  readonly #CLIENT_ID_KEY = 'client_id';
  readonly #CLIENT_SECRET_KEY = 'client_secret';

  getClientId(): string {
    let clientId = localStorage.getItem(this.#CLIENT_ID_KEY);
    if (!clientId) {
      clientId = generateUuid();
      localStorage.setItem(this.#CLIENT_ID_KEY, clientId);
    }
    return clientId;
  }

  getClientSecret(): string {
    let clientSecret = localStorage.getItem(this.#CLIENT_SECRET_KEY);
    if (!clientSecret) {
      clientSecret = generateUuid() + generateUuid();
      localStorage.setItem(this.#CLIENT_SECRET_KEY, clientSecret);
    }
    return clientSecret;
  }
}
