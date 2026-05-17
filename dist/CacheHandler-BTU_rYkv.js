import { injectable as u } from "tsyringe";
var p = Object.getOwnPropertyDescriptor, f = (e, r, t, s) => {
  for (var n = s > 1 ? void 0 : s ? p(r, t) : r, a = e.length - 1, c; a >= 0; a--)
    (c = e[a]) && (n = c(n) || n);
  return n;
};
let d = class {
  constructor() {
    this._handlers = [], this._cache = null;
  }
  /**
   * Appends one or more handlers to the pipeline.
   * Returns `this` for chaining.
   */
  use(e) {
    return Array.isArray(e) ? this._handlers.push(...e) : this._handlers.push(e), this;
  }
  /**
   * Registers the cache handler.  It is always inserted at the front of
   * the chain so it can intercept requests before any other handler sees them.
   * Returns `this` for chaining.
   */
  useCache(e) {
    return this._cache = e, this;
  }
  /** All non-cache handlers in registration order. */
  get handlers() {
    return this._handlers;
  }
  /** The registered cache handler, or `null`. */
  get cacheHandler() {
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
  async request(e) {
    const r = this._cache ? [this._cache, ...this._handlers] : [...this._handlers];
    if (r.length === 0)
      throw new Error(
        "RequestManager has no handlers registered — cannot complete request"
      );
    let t = 0;
    const s = async (n) => {
      const a = r[t];
      if (!a)
        throw new Error(
          "Handler chain ended without producing a response (no terminal handler)"
        );
      t++;
      const c = {
        request: n,
        response: void 0,
        setResponse(l) {
          this.response = l;
        }
      }, i = (l) => s(l);
      return a.request(c, i);
    };
    return s(e);
  }
};
d = f([
  u()
], d);
var y = Object.getOwnPropertyDescriptor, _ = (e, r, t, s) => {
  for (var n = s > 1 ? void 0 : s ? y(r, t) : r, a = e.length - 1, c; a >= 0; a--)
    (c = e[a]) && (n = c(n) || n);
  return n;
};
class v extends Error {
  constructor(r, t, s, n) {
    super(n ?? `Request failed with status ${r}`), this.status = r, this.content = t, this.headers = s;
  }
}
let h = class {
  static headersToObject(e) {
    const r = {};
    return e.forEach((t, s) => {
      r[s] = t;
    }), r;
  }
  static async parseBody(e) {
    const r = e.headers.get("Content-Type") ?? "";
    if (e.status === 204 || e.headers.get("Content-Length") === "0")
      return null;
    if (r.includes("application/json") || r.includes("application/vnd.api+json")) {
      const s = await e.text();
      if (!s)
        return null;
      try {
        return JSON.parse(s);
      } catch {
        return s;
      }
    }
    return e.text();
  }
  /**
   * Issues the HTTP request and returns a `StoreResponse`.
   * This is a terminal handler — it never calls `next`.
   *
   * @throws `FetchError` on non-2xx responses.
   */
  async request(e, r) {
    const t = e.request, s = {
      method: t.method,
      headers: t.headers
    };
    t.body !== void 0 && t.body !== null && (s.body = t.body), t.signal && (s.signal = t.signal);
    const n = await fetch(t.url, s), a = await h.parseBody(n), c = h.headersToObject(n.headers);
    if (!n.ok)
      throw new v(n.status, a, c);
    return {
      content: a,
      status: n.status,
      headers: c,
      request: t
    };
  }
};
h = _([
  u()
], h);
var w = Object.getOwnPropertyDescriptor, g = (e, r, t, s) => {
  for (var n = s > 1 ? void 0 : s ? w(r, t) : r, a = e.length - 1, c; a >= 0; a--)
    (c = e[a]) && (n = c(n) || n);
  return n;
};
let o = class {
  constructor() {
    this.cache = /* @__PURE__ */ new Map(), this.maxSize = 256, this.ttl = 3e5;
  }
  isExpired(e) {
    return Date.now() - e.cachedAt > this.ttl;
  }
  evictLRU() {
    for (; this.cache.size > this.maxSize; ) {
      const e = this.cache.keys().next().value;
      if (e !== void 0)
        this.cache.delete(e);
      else
        break;
    }
  }
  static keyFor(e) {
    var r;
    return ((r = e.cacheOptions) == null ? void 0 : r.key) ?? `${e.method} ${e.url}`;
  }
  static isCacheable(e) {
    return e.method === "GET";
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
  async request(e, r) {
    var c;
    const t = e.request;
    if (!o.isCacheable(t))
      return r(t);
    const s = o.keyFor(t);
    if (!(((c = t.cacheOptions) == null ? void 0 : c.reload) === !0)) {
      const i = this.cache.get(s);
      if (i)
        if (this.isExpired(i))
          this.cache.delete(s);
        else
          return this.cache.delete(s), this.cache.set(s, i), i.response;
    }
    const a = await r(t);
    return this.cache.set(s, { response: a, cachedAt: Date.now() }), this.evictLRU(), a;
  }
  /** Returns the number of entries currently in the cache. */
  get size() {
    return this.cache.size;
  }
  /** Removes all entries from the cache. */
  clear() {
    this.cache.clear();
  }
  /**
   * Removes a single entry by key.
   * @returns `true` when the entry existed and was deleted.
   */
  delete(e) {
    return this.cache.delete(e);
  }
};
o = g([
  u()
], o);
export {
  o as C,
  h as F,
  d as R
};
//# sourceMappingURL=CacheHandler-BTU_rYkv.js.map
