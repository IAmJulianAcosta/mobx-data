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

import { injectable } from 'tsyringe';
import type {
  Handler,
  NextFn,
  RequestContext,
  StoreRequest,
  StoreResponse,
} from './types.js';

@injectable()
export class RequestManager {
  private _handlers: Handler[] = [];
  private _cache: Handler | null = null;

  /**
   * Appends one or more handlers to the pipeline.
   * Returns `this` for chaining.
   */
  use(handlers: Handler[] | Handler): this {
    if (Array.isArray(handlers)) {
      this._handlers.push(...handlers);
    } else {
      this._handlers.push(handlers);
    }
    return this;
  }

  /**
   * Registers the cache handler.  It is always inserted at the front of
   * the chain so it can intercept requests before any other handler sees them.
   * Returns `this` for chaining.
   */
  useCache(handler: Handler): this {
    this._cache = handler;
    return this;
  }

  /** All non-cache handlers in registration order. */
  get handlers(): readonly Handler[] {
    return this._handlers;
  }

  /** The registered cache handler, or `null`. */
  get cacheHandler(): Handler | null {
    return this._cache;
  }

  /**
   * Executes `request` through the full handler chain and returns the final
   * `StoreResponse`.
   *
   * @throws when no handlers have been registered.
   * @throws when the chain ends without any handler returning a response
   *         (i.e. no terminal handler such as `FetchHandler`).
   */
  async request<T = unknown>(request: StoreRequest): Promise<StoreResponse<T>> {
    const chain: Handler[] = this._cache
      ? [this._cache, ...this._handlers]
      : [...this._handlers];

    if (chain.length === 0) {
      throw new Error(
        'RequestManager has no handlers registered — cannot complete request',
      );
    }

    let index = 0;
    const invoke = async (req: StoreRequest): Promise<StoreResponse<T>> => {
      const handler = chain[index];
      if (!handler) {
        throw new Error(
          'Handler chain ended without producing a response (no terminal handler)',
        );
      }
      index++;
      const context: RequestContext<T> = {
        request: req,
        response: undefined,
        setResponse(r) {
          this.response = r;
        },
      };
      const next: NextFn<T> = (nextRequest) => invoke(nextRequest);
      return handler.request(context, next) as Promise<StoreResponse<T>>;
    };

    return invoke(request);
  }
}
