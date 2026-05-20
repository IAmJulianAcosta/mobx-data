import type { RelationshipRef } from '@mobx-data/model';
import type { CacheEntryData, IndexedDBCacheOptions, CacheLike } from './types.js';

const DEFAULT_TTL = 3_600_000;

interface StoredEntry {
  id: string;
  attributes: Record<string, unknown>;
  relationships?: Record<string, RelationshipRef>;
  cachedAt: number;
  expiresAt: number;
}

export class IndexedDBCache implements CacheLike {
  private _databaseName: string;

  private _defaultTTL: number;

  private _database: IDBDatabase | null = null;

  private _openPromise: Promise<IDBDatabase> | null = null;

  private _writeQueue: Promise<void> = Promise.resolve();

  constructor(options: IndexedDBCacheOptions = {}) {
    this._databaseName = options.databaseName ?? 'mobx-data-cache';
    this._defaultTTL = options.defaultTTL ?? DEFAULT_TTL;
  }

  get defaultTTL(): number {
    return this._defaultTTL;
  }

  private async open(): Promise<IDBDatabase> {
    if (this._database) {
      return this._database;
    }
    if (this._openPromise) {
      return this._openPromise;
    }

    this._openPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this._databaseName);
      request.onsuccess = () => {
        this._database = request.result;
        resolve(this._database);
      };
      request.onerror = () => {
        this._openPromise = null;
        reject(request.error);
      };
    });
    return this._openPromise;
  }

  private async ensureObjectStore(modelName: string): Promise<IDBDatabase> {
    const database = await this.open();

    if (database.objectStoreNames.contains(modelName)) {
      return database;
    }

    const newVersion = database.version + 1;
    database.close();
    this._database = null;
    this._openPromise = null;

    this._openPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this._databaseName, newVersion);
      request.onupgradeneeded = () => {
        const upgraded = request.result;
        if (!upgraded.objectStoreNames.contains(modelName)) {
          upgraded.createObjectStore(modelName, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => {
        this._database = request.result;
        resolve(this._database);
      };
      request.onerror = () => {
        this._openPromise = null;
        reject(request.error);
      };
    });
    return this._openPromise;
  }

  private enqueueWrite<T>(operation: () => Promise<T>): Promise<T> {
    const result = this._writeQueue.then(operation);
    this._writeQueue = result.then(() => undefined, () => undefined);
    return result;
  }

  async get(modelName: string, id: string): Promise<CacheEntryData | null> {
    await this._writeQueue;
    const database = await this.open();

    if (!database.objectStoreNames.contains(modelName)) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(modelName, 'readonly');
      const store = transaction.objectStore(modelName);
      const request = store.get(id);
      request.onsuccess = () => {
        const entry = request.result as StoredEntry | undefined;
        if (!entry) {
          resolve(null);
          return;
        }
        if (Date.now() > entry.expiresAt) {
          this.invalidate(modelName, id);
          resolve(null);
          return;
        }
        resolve({
          modelName,
          id: entry.id,
          attributes: entry.attributes,
          relationships: entry.relationships,
          cachedAt: entry.cachedAt,
          expiresAt: entry.expiresAt,
        });
      };
      request.onerror = () => reject(request.error);
    });
  }

  async set(
    modelName: string,
    id: string,
    attributes: Record<string, unknown>,
    options: {
      relationships?: Record<string, RelationshipRef>;
      ttl?: number;
    } = {},
  ): Promise<void> {
    return this.enqueueWrite(async () => {
      const database = await this.ensureObjectStore(modelName);
      const now = Date.now();
      const ttl = options.ttl ?? this._defaultTTL;
      const entry: StoredEntry = {
        id,
        attributes,
        relationships: options.relationships,
        cachedAt: now,
        expiresAt: now + ttl,
      };
      return new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(modelName, 'readwrite');
        const store = transaction.objectStore(modelName);
        const request = store.put(entry);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  }

  async has(modelName: string, id: string): Promise<boolean> {
    const entry = await this.get(modelName, id);
    return entry !== null;
  }

  async invalidate(modelName: string, id: string): Promise<void> {
    await this._writeQueue;
    const database = await this.open();

    if (!database.objectStoreNames.contains(modelName)) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(modelName, 'readwrite');
      const store = transaction.objectStore(modelName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async invalidateAll(modelName?: string): Promise<void> {
    await this._writeQueue;
    const database = await this.open();

    if (modelName) {
      if (!database.objectStoreNames.contains(modelName)) {
        return;
      }
      return new Promise((resolve, reject) => {
        const transaction = database.transaction(modelName, 'readwrite');
        const store = transaction.objectStore(modelName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    const storeNames = Array.from(database.objectStoreNames);
    if (storeNames.length === 0) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeNames, 'readwrite');
      let remaining = storeNames.length;
      for (const name of storeNames) {
        const request = transaction.objectStore(name).clear();
        request.onsuccess = () => {
          remaining -= 1;
          if (remaining === 0) resolve();
        };
        request.onerror = () => reject(request.error);
      }
    });
  }

  async close(): Promise<void> {
    await this._writeQueue;
    if (this._database) {
      this._database.close();
      this._database = null;
      this._openPromise = null;
    }
  }
}
