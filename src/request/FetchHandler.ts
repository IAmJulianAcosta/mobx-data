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

import { injectable } from 'tsyringe';
import type {
  Handler,
  NextFn,
  RequestContext,
  StoreResponse,
} from './types.js';

/**
 * Error thrown by `FetchHandler` for non-2xx HTTP responses.
 * Carries the status code, parsed body content, and response headers.
 */
export class FetchError extends Error {
  readonly status: number;
  readonly content: unknown;
  readonly headers: Record<string, string>;
  constructor(
    status: number,
    content: unknown,
    headers: Record<string, string>,
    message?: string,
  ) {
    super(message ?? `Request failed with status ${status}`);
    this.status = status;
    this.content = content;
    this.headers = headers;
  }
}

@injectable()
export class FetchHandler implements Handler {
  static headersToObject(headers: Headers): Record<string, string> {
    const out: Record<string, string> = {};
    headers.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }

  static async parseBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get('Content-Type') ?? '';
    if (
      response.status === 204
      || response.headers.get('Content-Length') === '0'
    ) {
      return null;
    }
    const isJson = contentType.includes('application/json')
      || contentType.includes('application/vnd.api+json');
    if (isJson) {
      const text = await response.text();
      if (!text) {
        return null;
      }
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }
    return response.text();
  }

  /**
   * Issues the HTTP request and returns a `StoreResponse`.
   * This is a terminal handler — it never calls `next`.
   *
   * @throws `FetchError` on non-2xx responses.
   */
  async request<T = unknown>(
    context: RequestContext<T>,
    _next: NextFn<T>,
  ): Promise<StoreResponse<T>> {
    const req = context.request;
    const init: RequestInit = {
      method: req.method,
      headers: req.headers,
    };
    if (req.body !== undefined && req.body !== null) {
      init.body = req.body;
    }
    if (req.signal) {
      init.signal = req.signal;
    }

    const response = await fetch(req.url, init);
    const content = await FetchHandler.parseBody(response);
    const headers = FetchHandler.headersToObject(response.headers);

    if (!response.ok) {
      throw new FetchError(response.status, content, headers);
    }
    return {
      content: content as T,
      status: response.status,
      headers,
      request: req,
    };
  }
}
