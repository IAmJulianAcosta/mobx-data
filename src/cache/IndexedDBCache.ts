import type { RelationshipRef } from '@mobx-data/model';
import type { CacheEntryData, IndexedDBCacheOptions, CacheLike } from './types.js';

const STORE_NAME = 'cache-entries';
const DATABASE_VERSION = 1;
const DEFAULT_TTL = 3_600_000;

interface StoredEntry extends CacheEntryData {
  key: string;
}

export class IndexedDBCache implements CacheLike {
  private _databaseName: string;

  private _defaultTTL: number;

  private _database: IDBDatabase | null = null;

  private _openPromise: Promise<IDBDatabase> | null = null;

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
      const request = indexedDB.open(this._databaseName, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const store = database.createObjectStore(STORE_NAME, {
            keyPath: 'key',
          });
          store.createIndex('modelName', 'modelName', { unique: false });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
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

  static cacheKey(modelName: string, id: string): string {
    return `${modelName}:${id}`;
  }

  async get(modelName: string, id: string): Promise<CacheEntryData | null> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(IndexedDBCache.cacheKey(modelName, id));
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
        resolve(entry);
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
    const database = await this.open();
    const now = Date.now();
    const ttl = options.ttl ?? this._defaultTTL;
    const entry: StoredEntry = {
      key: IndexedDBCache.cacheKey(modelName, id),
      modelName,
      id,
      attributes,
      relationships: options.relationships,
      cachedAt: now,
      expiresAt: now + ttl,
    };
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async has(modelName: string, id: string): Promise<boolean> {
    const entry = await this.get(modelName, id);
    return entry !== null;
  }

  async invalidate(modelName: string, id: string): Promise<void> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(IndexedDBCache.cacheKey(modelName, id));
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async invalidateAll(modelName?: string): Promise<void> {
    const database = await this.open();
    if (!modelName) {
      return new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('modelName');
      const cursorRequest = index.openCursor(IDBKeyRange.only(modelName));
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      cursorRequest.onerror = () => reject(cursorRequest.error);
    });
  }

  async close(): Promise<void> {
    if (this._database) {
      this._database.close();
      this._database = null;
      this._openPromise = null;
    }
  }
}
