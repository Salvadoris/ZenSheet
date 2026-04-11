import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  readonly #dbName = 'ZenSheetClientDB';
  readonly #dbVersion = 1;
  readonly #storeName = 'notes';
  #db: IDBDatabase | null = null;


  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.#dbName, this.#dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.#db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.#storeName)) {
          db.createObjectStore(this.#storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async save(key: string, data: unknown): Promise<void> {
    if (!this.#db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.#db) {
        reject(new Error('Local database not initialized'));
        return;
      }

      const transaction = this.#db.transaction([this.#storeName], 'readwrite');
      const store = transaction.objectStore(this.#storeName);
      store.put({ id: key, data: data });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async load<T>(key: string): Promise<T | null> {
    if (!this.#db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.#db) {
        reject(new Error('Local database not initialized'));
        return;
      }

      const transaction = this.#db.transaction([this.#storeName], 'readonly');
      const store = transaction.objectStore(this.#storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? (result.data as T) : null);
      };
    });
  }

  async delete(key: string): Promise<void> {
    if (!this.#db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.#db) {
        reject(new Error('Local database not initialized'));
        return;
      }

      const transaction = this.#db.transaction([this.#storeName], 'readwrite');
      const store = transaction.objectStore(this.#storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAllKeys(): Promise<string[]> {
    if (!this.#db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.#db) {
        reject(new Error('Local database not initialized'));
        return;
      }

      const transaction = this.#db.transaction([this.#storeName], 'readonly');
      const store = transaction.objectStore(this.#storeName);
      const request = store.getAllKeys();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result.map(key => key.toString()));
      };
    });
  }
}

