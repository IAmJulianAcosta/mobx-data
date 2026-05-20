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

import { injectable } from 'tsyringe';
import type {
  Handler,
  NextFn,
  RequestContext,
  StoreRequest,
  StoreResponse,
} from './types.js';

interface CacheEntry {
  response: StoreResponse;
  cachedAt: number;
}

@injectable()
export class CacheHandler implements Handler {
  private cache = new Map<string, CacheEntry>();

  maxSize: number = 256;

  ttl: number = 300_000;

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.cachedAt > this.ttl;
  }

  private evictLRU(): void {
    while (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value as string;
      this.cache.delete(firstKey);
    }
  }

  static keyFor(req: StoreRequest): string {
    return req.cacheOptions?.key ?? `${req.method} ${req.url}`;
  }

  static isCacheable(req: StoreRequest): boolean {
    return req.method === 'GET';
  }

  /**
   * Handles a request by checking the in-memory cache before forwarding to
   * the next handler.
   *
   * - Non-GET requests skip the cache entirely.
   * - `cacheOptions.reload: true` forces a network request and refreshes the entry.
   * - Cached entries expire after `ttl` milliseconds (default 5 minutes).
   * - The cache uses LRU eviction when it exceeds `maxSize` entries (default 256).
   */
  async request<T = unknown>(
    context: RequestContext<T>,
    next: NextFn<T>,
  ): Promise<StoreResponse<T>> {
    const req = context.request;
    if (!CacheHandler.isCacheable(req)) {
      return next(req);
    }

    const key = CacheHandler.keyFor(req);
    const reload = req.cacheOptions?.reload === true;

    if (!reload) {
      const hit = this.cache.get(key);
      if (hit) {
        if (this.isExpired(hit)) {
          this.cache.delete(key);
        } else {
          // LRU promotion: delete and re-set to move to end
          this.cache.delete(key);
          this.cache.set(key, hit);
          return hit.response as StoreResponse<T>;
        }
      }
    }

    const response = await next(req);
    this.cache.set(key, { response: response as StoreResponse, cachedAt: Date.now() });
    this.evictLRU();
    return response;
  }

  /** Returns the number of entries currently in the cache. */
  get size(): number {
    return this.cache.size;
  }

  /** Removes all entries from the cache. */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Removes a single entry by key.
   * @returns `true` when the entry existed and was deleted.
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
}
