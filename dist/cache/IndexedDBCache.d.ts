import type { RelationshipRef } from '@mobx-data/model';
import type { CacheEntryData, IndexedDBCacheOptions, CacheLike } from './types.js';
export declare class IndexedDBCache implements CacheLike {
    private _databaseName;
    private _defaultTTL;
    private _database;
    private _openPromise;
    constructor(options?: IndexedDBCacheOptions);
    get defaultTTL(): number;
    private open;
    static cacheKey(modelName: string, id: string): string;
    get(modelName: string, id: string): Promise<CacheEntryData | null>;
    set(modelName: string, id: string, attributes: Record<string, unknown>, options?: {
        relationships?: Record<string, RelationshipRef>;
        ttl?: number;
    }): Promise<void>;
    has(modelName: string, id: string): Promise<boolean>;
    invalidate(modelName: string, id: string): Promise<void>;
    invalidateAll(modelName?: string): Promise<void>;
    close(): Promise<void>;
}
//# sourceMappingURL=IndexedDBCache.d.ts.map