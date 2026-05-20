/**
 * Terminal request handler that executes HTTP calls via the browser / Node
 * `fetch` API.
 *
 * `FetchHandler` is designed to sit at the end of the `RequestManager` chain.
 * It does not call `next` — it issues the network request and returns the
 * parsed response directly.
 *
 * Response body parsing:
 * - `204 No Content` or `Content-Length: 0` → `null`
 * - `application/json` or `application/vnd.api+json` → parsed JSON (falls
 *   back to raw text if parsing fails)
 * - Everything else → raw text string
 *
 * Error handling:
 * - Non-2xx responses throw a `FetchError` that includes `status`, `content`,
 *   and `headers` for downstream error handling.
 */
import type { Handler, NextFn, RequestContext, StoreResponse } from './types.js';
/**
 * Error thrown by `FetchHandler` for non-2xx HTTP responses.
 * Carries the status code, parsed body content, and response headers.
 */
export declare class FetchError extends Error {
    readonly status: number;
    readonly content: unknown;
    readonly headers: Record<string, string>;
    constructor(status: number, content: unknown, headers: Record<string, string>, message?: string);
}
export declare class FetchHandler implements Handler {
    static headersToObject(headers: Headers): Record<string, string>;
    static parseBody(response: Response): Promise<unknown>;
    /**
     * Issues the HTTP request and returns a `StoreResponse`.
     * This is a terminal handler — it never calls `next`.
     *
     * @throws `FetchError` on non-2xx responses.
     */
    request<T = unknown>(context: RequestContext<T>, _next: NextFn<T>): Promise<StoreResponse<T>>;
}
//# sourceMappingURL=FetchHandler.d.ts.map