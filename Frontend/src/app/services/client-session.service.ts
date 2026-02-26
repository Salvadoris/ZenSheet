import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ClientSessionService {
  readonly #CLIENT_ID_KEY = 'zen_client_id';
  readonly #CLIENT_SECRET_KEY = 'zen_client_secret';

  getClientId(): string {
    let clientId = localStorage.getItem(this.#CLIENT_ID_KEY);
    if (!clientId) {
      clientId = this.#generateUuid();
      localStorage.setItem(this.#CLIENT_ID_KEY, clientId);
    }
    return clientId;
  }

  getClientSecret(): string {
    let clientSecret = localStorage.getItem(this.#CLIENT_SECRET_KEY);
    if (!clientSecret) {
      clientSecret = this.#generateUuid() + this.#generateUuid(); // Longer secret
      localStorage.setItem(this.#CLIENT_SECRET_KEY, clientSecret);
    }
    return clientSecret;
  }

  #generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
