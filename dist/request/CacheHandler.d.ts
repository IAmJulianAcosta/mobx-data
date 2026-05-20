/**
 * In-memory caching handler for the request pipeline.
 *
 * `CacheHandler` is registered via `RequestManager.useCache()` so it always
 * runs first in the chain.  It caches `GET` responses and replays them on
 * subsequent requests with the same key — unless `cacheOptions.reload: true`
 * is set, in which case it bypasses the cache and stores the fresh response.
 *
 * Cache key: `cacheOptions.key` when provided, otherwise `"<METHOD> <URL>"`.
 *
 * Only `GET` requests are cached; mutations (POST, PUT, PATCH, DELETE) are
 * always forwarded to `next` without touching the cache.
 *
 * Usage:
 * ```ts
 * const manager = new RequestManager()
 *   .useCache(new CacheHandler())
 *   .use(new FetchHandler());
 * ```
 */
import type { Handler, NextFn, RequestContext, StoreRequest, StoreResponse } from './types.js';
export declare class CacheHandler implements Handler {
    private cache;
    maxSize: number;
    ttl: number;
    private isExpired;
    private evictLRU;
    static keyFor(req: StoreRequest): string;
    static isCacheable(req: StoreRequest): boolean;
    /**
     * Handles a request by checking the in-memory cache before forwarding to
     * the next handler.
     *
     * - Non-GET requests skip the cache entirely.
     * - `cacheOptions.reload: true` forces a network request and refreshes the entry.
     * - Cached entries expire after `ttl` milliseconds (default 5 minutes).
     * - The cache uses LRU eviction when it exceeds `maxSize` entries (default 256).
     */
    request<T = unknown>(context: RequestContext<T>, next: NextFn<T>): Promise<StoreResponse<T>>;
    /** Returns the number of entries currently in the cache. */
    get size(): number;
    /** Removes all entries from the cache. */
    clear(): void;
    /**
     * Removes a single entry by key.
     * @returns `true` when the entry existed and was deleted.
     */
    delete(key: string): boolean;
}
//# sourceMappingURL=CacheHandler.d.ts.map