import { RESPONSE_HEADERS } from './types.js';

const DEFAULT_TTL = 3_600_000;

export function parseCacheTTLFromHeaders(headers: Record<string, string>): number {
  const cacheControl = headers['cache-control'];
  if (cacheControl) {
    if (/no-store/i.test(cacheControl) || /no-cache/i.test(cacheControl)) {
      return 0;
    }
    const sMaxAge = /s-maxage=(\d+)/i.exec(cacheControl);
    if (sMaxAge) {
      return parseInt(sMaxAge[1]!, 10) * 1000;
    }
    const maxAge = /max-age=(\d+)/i.exec(cacheControl);
    if (maxAge) {
      return parseInt(maxAge[1]!, 10) * 1000;
    }
  }

  const expires = headers['expires'];
  if (expires) {
    const expiresMilliseconds = new Date(expires).getTime();
    if (!Number.isNaN(expiresMilliseconds)) {
      return Math.max(0, expiresMilliseconds - Date.now());
    }
  }

  return DEFAULT_TTL;
}

export function extractResponseHeaders(
  payload: unknown,
): Record<string, string> | null {
  if (payload !== null && typeof payload === 'object') {
    return (
      (payload as Record<symbol, unknown>)[RESPONSE_HEADERS] as
        | Record<string, string>
        | undefined
    ) ?? null;
  }
  return null;
}

export function attachResponseHeaders(
  payload: unknown,
  headers: Record<string, string>,
): void {
  if (payload !== null && typeof payload === 'object') {
    Object.defineProperty(payload, RESPONSE_HEADERS, {
      value: headers,
      enumerable: false,
      writable: false,
      configurable: false,
    });
  }
}
