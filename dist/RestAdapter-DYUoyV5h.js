import { injectable as _ } from "tsyringe";
import y from "pluralize";
const d = Symbol("response-headers");
function w(n) {
  const e = n["cache-control"];
  if (e) {
    if (/no-store/i.test(e) || /no-cache/i.test(e))
      return 0;
    const t = /s-maxage=(\d+)/i.exec(e);
    if (t)
      return parseInt(t[1], 10) * 1e3;
    const s = /max-age=(\d+)/i.exec(e);
    if (s)
      return parseInt(s[1], 10) * 1e3;
  }
  const r = n.expires;
  if (r) {
    const t = new Date(r).getTime();
    if (!Number.isNaN(t))
      return Math.max(0, t - Date.now());
  }
  return null;
}
function j(n) {
  return n !== null && typeof n == "object" ? n[d] ?? null : null;
}
function b(n, e) {
  n !== null && typeof n == "object" && Object.defineProperty(n, d, {
    value: e,
    enumerable: !1,
    writable: !1,
    configurable: !1
  });
}
const F = new RegExp("([\\p{Ll}\\d])(\\p{Lu})", "gu"), L = new RegExp("(\\p{Lu})([\\p{Lu}][\\p{Ll}])", "gu"), m = new RegExp("(\\d)\\p{Ll}|(\\p{L})\\d", "u"), U = /[^\p{L}\d]+/giu, i = "$1\0$2", l = "";
function h(n) {
  let e = n.trim();
  e = e.replace(F, i).replace(L, i), e = e.replace(U, "\0");
  let r = 0, t = e.length;
  for (; e.charAt(r) === "\0"; )
    r++;
  if (r === t)
    return [];
  for (; e.charAt(t - 1) === "\0"; )
    t--;
  return e.slice(r, t).split(/\0/g);
}
function S(n) {
  const e = h(n);
  for (let r = 0; r < e.length; r++) {
    const t = e[r], s = m.exec(t);
    if (s) {
      const c = s.index + (s[1] ?? s[2]).length;
      e.splice(r, 1, t.slice(0, c), t.slice(c));
    }
  }
  return e;
}
function T(n, e) {
  const [r, t, s] = R(n, e);
  return r + t.map(f(e == null ? void 0 : e.locale)).join((e == null ? void 0 : e.delimiter) ?? " ") + s;
}
function I(n, e) {
  const [r, t, s] = R(n, e), c = f(e == null ? void 0 : e.locale), o = E(e == null ? void 0 : e.locale), a = g(c, o);
  return r + t.map(a).join("") + s;
}
function x(n, e) {
  return T(n, { delimiter: "-", ...e });
}
function f(n) {
  return n === !1 ? (e) => e.toLowerCase() : (e) => e.toLocaleLowerCase(n);
}
function E(n) {
  return (e) => e.toLocaleUpperCase(n);
}
function g(n, e) {
  return (r, t) => {
    const s = r[0];
    return (t > 0 && s >= "0" && s <= "9" ? "_" + s : e(s)) + n(r.slice(1));
  };
}
function R(n, e = {}) {
  const r = e.split ?? (e.separateNumbers ? S : h), t = e.prefixCharacters ?? l, s = e.suffixCharacters ?? l;
  let c = 0, o = n.length;
  for (; c < n.length; ) {
    const a = n.charAt(c);
    if (!t.includes(a))
      break;
    c++;
  }
  for (; o > c; ) {
    const a = o - 1, p = n.charAt(a);
    if (!s.includes(p))
      break;
    o = a;
  }
  return [
    n.slice(0, c),
    r(n.slice(c, o)),
    n.slice(o)
  ];
}
class A {
  constructor() {
    this.namespace = "", this.host = "", this.headers = {}, this.coalesceFindRequests = !1;
  }
  /**
   * Persists only the changed attributes of an existing record (PATCH).
   * Default implementation delegates to `updateRecord`.
   * Override in subclasses to send a partial payload via HTTP PATCH.
   */
  patchRecord(e, r, t) {
    return this.updateRecord(e, r, t);
  }
  /**
   * Returns the URL path segment for a given model name.
   * Default: dasherized, pluralized form — e.g. `userPost` → `user-posts`.
   */
  pathForType(e) {
    return y.plural(x(e));
  }
  /**
   * Assembles a full URL from `host`, `namespace`, and the supplied `path`.
   * Returns an absolute URL when `host` is set, otherwise a root-relative path.
   */
  _composeURL(e) {
    const r = this.namespace.replace(/^\/+|\/+$/g, ""), t = this.host ? this.host.replace(/\/+$/, "") : "", s = [];
    return t && s.push(t), r && s.push(r), s.push(e), t ? s.join("/") : `/${s.filter(Boolean).join("/")}`;
  }
  /**
   * Dispatches to the appropriate `urlFor*` method based on `requestType`.
   *
   * @param modelName   - Registered model name.
   * @param id          - Record id(s), or `null` for collection requests.
   * @param snapshot    - Snapshot(s) for the request.
   * @param requestType - Operation being performed.
   * @param query       - Query parameters (used for `query` / `queryRecord`).
   */
  buildURL(e, r, t, s, c = {}) {
    switch (s) {
      case "findRecord":
        return this.urlForFindRecord(r, e, t);
      case "findAll":
        return this.urlForFindAll(e, t ?? []);
      case "findMany":
        return this.urlForFindMany(
          r ?? [],
          e,
          t ?? []
        );
      case "query":
        return this.urlForQuery(c, e);
      case "queryRecord":
        return this.urlForQueryRecord(c, e);
      case "createRecord":
        return this.urlForCreateRecord(e, t);
      case "updateRecord":
        return this.urlForUpdateRecord(
          r,
          e,
          t
        );
      case "deleteRecord":
        return this.urlForDeleteRecord(
          r,
          e,
          t
        );
    }
  }
  /** URL for a `findRecord` request.  Default: `<collection>/<id>`. */
  urlForFindRecord(e, r, t) {
    return this._composeURL(`${this.pathForType(r)}/${encodeURIComponent(e)}`);
  }
  /** URL for a `findAll` request.  Default: `<collection>`. */
  urlForFindAll(e, r) {
    return this._composeURL(this.pathForType(e));
  }
  /** URL for a `findMany` request.  Default: `<collection>` (ids appended by the adapter). */
  urlForFindMany(e, r, t) {
    return this._composeURL(this.pathForType(r));
  }
  /** URL for a `query` request.  Default: `<collection>`. */
  urlForQuery(e, r) {
    return this._composeURL(this.pathForType(r));
  }
  /** URL for a `queryRecord` request.  Default: `<collection>`. */
  urlForQueryRecord(e, r) {
    return this._composeURL(this.pathForType(r));
  }
  /** URL for a `createRecord` request.  Default: `<collection>`. */
  urlForCreateRecord(e, r) {
    return this._composeURL(this.pathForType(e));
  }
  /** URL for an `updateRecord` request.  Default: `<collection>/<id>`. */
  urlForUpdateRecord(e, r, t) {
    return this._composeURL(`${this.pathForType(r)}/${encodeURIComponent(e)}`);
  }
  /** URL for a `deleteRecord` request.  Default: `<collection>/<id>`. */
  urlForDeleteRecord(e, r, t) {
    return this._composeURL(`${this.pathForType(r)}/${encodeURIComponent(e)}`);
  }
  /**
   * Groups snapshots into batches for `findMany`.
   * Default implementation puts all snapshots in a single batch.
   */
  groupRecordsForFindMany(e, r) {
    return [r];
  }
  /**
   * Returns `true` when the store should bypass the cache and reload this
   * record immediately.  Default: always `false`.
   */
  shouldReloadRecord(e, r) {
    return !1;
  }
  /**
   * Returns `true` when the store should schedule a background reload for
   * this record after returning the cached version.  Default: always `true`.
   */
  shouldBackgroundReloadRecord(e, r) {
    return !0;
  }
  /**
   * Returns `true` when the store should reload the full collection on every
   * `findAll` call.  Default: always `false`.
   */
  shouldReloadAll(e, r) {
    return !1;
  }
  /**
   * Returns `true` when the store should schedule a background reload after
   * returning a cached collection.  Default: always `true`.
   */
  shouldBackgroundReloadAll(e, r) {
    return !0;
  }
}
var C = Object.getOwnPropertyDescriptor, O = (n, e, r, t) => {
  for (var s = t > 1 ? void 0 : t ? C(e, r) : e, c = n.length - 1, o; c >= 0; c--)
    (o = n[c]) && (s = o(s) || s);
  return s;
};
let u = class extends A {
  static serializeSnapshotToObject(n) {
    const e = {}, t = n.record._data;
    if (t)
      for (const [s, c] of Object.entries(t))
        s === "__proto__" || s === "constructor" || s === "prototype" || (e[s] = c);
    return e;
  }
  static toQueryString(n) {
    const e = [];
    for (const [r, t] of Object.entries(n))
      t != null && e.push(
        `${encodeURIComponent(r)}=${encodeURIComponent(String(t))}`
      );
    return e.length > 0 ? `?${e.join("&")}` : "";
  }
  /** Headers sent with every read (GET) request. */
  defaultHeaders() {
    return {
      Accept: "application/json",
      ...this.headers
    };
  }
  /** Headers sent with every write (POST / PUT / DELETE) request. */
  mutationHeaders() {
    return {
      "Content-Type": "application/json",
      ...this.defaultHeaders()
    };
  }
  /**
   * Low-level fetch wrapper used by all operation methods.
   *
   * - Throws an enriched `Error` (with `status` and `body` properties) for
   *   any non-2xx response.
   * - Returns `null` for 204 No Content responses.
   * - Attempts JSON parsing; falls back to the raw text string on failure.
   */
  async _fetchJSON(n, e) {
    const r = await fetch(n, e);
    if (!r.ok) {
      let c = null;
      try {
        c = await r.json();
      } catch {
      }
      throw Object.assign(
        new Error(`Request failed: ${r.status}`),
        { status: r.status, body: c }
      );
    }
    if (r.status === 204)
      return null;
    const t = await r.text();
    if (!t)
      return null;
    let s;
    try {
      s = JSON.parse(t);
    } catch {
      s = t;
    }
    if (s !== null && typeof s == "object") {
      const c = {};
      r.headers.forEach((o, a) => {
        c[a.toLowerCase()] = o;
      }), b(s, c);
    }
    return s;
  }
  async findRecord(n, e, r, t, s) {
    let c = this.buildURL(e, r, t, "findRecord");
    return s != null && s.include && (c += `${c.includes("?") ? "&" : "?"}include=${encodeURIComponent(s.include)}`), this._fetchJSON(c, {
      method: "GET",
      headers: this.defaultHeaders()
    });
  }
  async findAll(n, e, r, t, s) {
    let c = this.buildURL(e, null, t, "findAll");
    return s != null && s.include && (c += `${c.includes("?") ? "&" : "?"}include=${encodeURIComponent(s.include)}`), this._fetchJSON(c, {
      method: "GET",
      headers: this.defaultHeaders()
    });
  }
  /**
   * Fetches multiple records by appending an `ids` query parameter.
   * e.g. `/posts?ids=1,2,3`
   */
  async findMany(n, e, r, t) {
    const s = this.buildURL(e, r, t, "findMany"), c = s.includes("?") ? "&" : "?", o = `${s}${c}ids=${r.map(encodeURIComponent).join(",")}`;
    return this._fetchJSON(o, {
      method: "GET",
      headers: this.defaultHeaders()
    });
  }
  async query(n, e, r) {
    const s = `${this.buildURL(e, null, null, "query", r)}${u.toQueryString(r)}`;
    return this._fetchJSON(s, {
      method: "GET",
      headers: this.defaultHeaders()
    });
  }
  async queryRecord(n, e, r) {
    const s = `${this.buildURL(e, null, null, "queryRecord", r)}${u.toQueryString(r)}`;
    return this._fetchJSON(s, {
      method: "GET",
      headers: this.defaultHeaders()
    });
  }
  async createRecord(n, e, r) {
    const t = this.buildURL(e, null, r, "createRecord");
    return this._fetchJSON(t, {
      method: "POST",
      headers: this.mutationHeaders(),
      body: JSON.stringify(u.serializeSnapshotToObject(r))
    });
  }
  async updateRecord(n, e, r) {
    const t = this.buildURL(e, r.id, r, "updateRecord");
    return this._fetchJSON(t, {
      method: "PUT",
      headers: this.mutationHeaders(),
      body: JSON.stringify(u.serializeSnapshotToObject(r))
    });
  }
  async patchRecord(n, e, r) {
    const t = this.buildURL(e, r.id, r, "updateRecord"), s = r.changedAttributes(), c = {};
    for (const [o, [, a]] of Object.entries(s))
      c[o] = a;
    return this._fetchJSON(t, {
      method: "PATCH",
      headers: this.mutationHeaders(),
      body: JSON.stringify(c)
    });
  }
  async deleteRecord(n, e, r) {
    const t = this.buildURL(e, r.id, r, "deleteRecord");
    return this._fetchJSON(t, {
      method: "DELETE",
      headers: this.defaultHeaders()
    });
  }
};
u = O([
  _()
], u);
export {
  A,
  u as R,
  d as a,
  b,
  I as c,
  j as e,
  w as p
};
//# sourceMappingURL=RestAdapter-DYUoyV5h.js.map
