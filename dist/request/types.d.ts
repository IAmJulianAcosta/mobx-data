/**
 * Shared type definitions for the request pipeline.
 *
 * The request pipeline models each network call as a `StoreRequest` flowing
 * through a chain of `Handler` instances.  Each handler can inspect, mutate,
 * or short-circuit the request before passing it to `next`.
 *
 * Flow:
 * ```
 * RequestManager.request(StoreRequest)
 *   → CacheHandler.request(context, next)
 *     → FetchHandler.request(context, next)   ← terminal
 * ```
 */
/** HTTP methods supported by the request pipeline. */
export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS';
/** Store-level operation that triggered this request. */
export type RequestOp = 'findRecord' | 'findAll' | 'findMany' | 'query' | 'queryRecord' | 'createRecord' | 'updateRecord' | 'deleteRecord' | 'custom';
/** Stable identifier for a record — type + id pair. */
export interface RecordIdentifier {
    /** Model name. */
    type: string;
    /** Server-assigned id, or `null` for new records. */
    id: string | null;
    /** Optional local id for identity tracking before the server assigns an id. */
    lid?: string;
}
/**
 * A fully-described outgoing HTTP request.
 *
 * Passed to the first handler in the chain and forwarded (possibly mutated)
 * to subsequent handlers via `next`.
 */
export interface StoreRequest {
    /** HTTP method. */
    method: HttpMethod;
    /** Fully-qualified URL. */
    url: string;
    /** HTTP headers. */
    headers?: Record<string, string>;
    /** Request body.  `null` / `undefined` = no body. */
    body?: string | FormData | Blob | ArrayBuffer | null;
    /** Store operation that initiated this request. */
    op?: RequestOp;
    /** Records involved in this request (for cache invalidation, etc.). */
    records?: RecordIdentifier[];
    /** Store reference — passed through so handlers can access it if needed. */
    store?: unknown;
    /** Cache behavior overrides. */
    cacheOptions?: {
        /** When `true`, bypass the cache and always hit the network. */
        reload?: boolean;
        /** When `true`, return the cached value and refetch in the background. */
        backgroundReload?: boolean;
        /** Custom cache key.  Defaults to `"${method} ${url}"`. */
        key?: string;
    };
    /** `AbortSignal` for request cancellation. */
    signal?: AbortSignal;
    /** Arbitrary additional metadata forwarded to handlers. */
    [key: string]: unknown;
}
/** The response produced by the terminal handler and returned up the chain. */
export interface StoreResponse<T = unknown> {
    /** Parsed response body. */
    content: T;
    /** HTTP status code. */
    status?: number;
    /** Response headers. */
    headers?: Record<string, string>;
    /** The originating request. */
    request?: StoreRequest;
}
/**
 * Context object passed to each handler.
 * Handlers read `request`, may call `setResponse` to stash an intermediate
 * result, and call `next` to forward to the next handler.
 */
export interface RequestContext<T = unknown> {
    /** The current request (may have been mutated by earlier handlers). */
    request: StoreRequest;
    /** Response set by a previous handler, if any. */
    response?: StoreResponse<T>;
    /** Allows a handler to record the response without ending the chain. */
    setResponse(response: StoreResponse<T>): void;
}
/**
 * Function passed to each handler that invokes the next handler in the chain.
 * Handlers call `next(request)` to continue, or return a response directly to
 * short-circuit remaining handlers.
 */
export type NextFn<T = unknown> = (request: StoreRequest) => Promise<StoreResponse<T>>;
/**
 * Interface that every request handler must implement.
 *
 * @example
 * ```ts
 * class LoggingHandler implements Handler {
 *   async request(context, next) {
 *     console.log('→', context.request.method, context.request.url);
 *     const response = await next(context.request);
 *     console.log('←', response.status);
 *     return response;
 *   }
 * }
 * ```
 */
export interface Handler<T = unknown> {
    request(context: RequestContext<T>, next: NextFn<T>): Promise<StoreResponse<T>> | StoreResponse<T>;
}
//# sourceMappingURL=types.d.ts.map