/**
 * Middleware-style manager that runs a `StoreRequest` through an ordered chain
 * of `Handler` instances.
 *
 * Handlers are invoked in registration order.  Each handler receives a
 * `RequestContext` and a `next` function; it may:
 * - Call `next(request)` to pass control to the next handler.
 * - Return a `StoreResponse` directly to short-circuit the chain.
 * - Wrap `next` to inspect or transform the response (e.g. logging).
 *
 * An optional *cache handler* registered via `useCache()` is always prepended
 * to the chain so it runs before every other handler.
 *
 * Usage:
 * ```ts
 * const manager = new RequestManager()
 *   .useCache(new CacheHandler())
 *   .use([new AuthHandler(), new FetchHandler()]);
 *
 * const response = await manager.request({ method: 'GET', url: '/posts' });
 * ```
 */
import type { Handler, StoreRequest, StoreResponse } from './types.js';
export declare class RequestManager {
    private _handlers;
    private _cache;
    /**
     * Appends one or more handlers to the pipeline.
     * Returns `this` for chaining.
     */
    use(handlers: Handler[] | Handler): this;
    /**
     * Registers the cache handler.  It is always inserted at the front of
     * the chain so it can intercept requests before any other handler sees them.
     * Returns `this` for chaining.
     */
    useCache(handler: Handler): this;
    /** All non-cache handlers in registration order. */
    get handlers(): readonly Handler[];
    /** The registered cache handler, or `null`. */
    get cacheHandler(): Handler | null;
    /**
     * Executes `request` through the full handler chain and returns the final
     * `StoreResponse`.
     *
     * @throws when no handlers have been registered.
     * @throws when the chain ends without any handler returning a response
     *         (i.e. no terminal handler such as `FetchHandler`).
     */
    request<T = unknown>(request: StoreRequest): Promise<StoreResponse<T>>;
}
//# sourceMappingURL=RequestManager.d.ts.map