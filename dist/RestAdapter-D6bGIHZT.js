import { injectable as p } from "tsyringe";
import _ from "pluralize";
import { a as y } from "./cache-utils-B2wFhisx.js";
const F = new RegExp("([\\p{Ll}\\d])(\\p{Lu})", "gu"), L = new RegExp("(\\p{Lu})([\\p{Lu}][\\p{Ll}])", "gu"), U = new RegExp("(\\d)\\p{Ll}|(\\p{L})\\d", "u"), b = /[^\p{L}\d]+/giu, i = "$1\0$2", l = "";
function d(c) {
  let e = c.trim();
  e = e.replace(F, i).replace(L, i), e = e.replace(b, "\0");
  let r = 0, t = e.length;
  for (; e.charAt(r) === "\0"; )
    r++;
  if (r === t)
    return [];
  for (; e.charAt(t - 1) === "\0"; )
    t--;
  return e.slice(r, t).split(/\0/g);
}
function m(c) {
  const e = d(c);
  for (let r = 0; r < e.length; r++) {
    const t = e[r], s = U.exec(t);
    if (s) {
      const n = s.index + (s[1] ?? s[2]).length;
      e.splice(r, 1, t.slice(0, n), t.slice(n));
    }
  }
  return e;
}
function T(c, e) {
  const [r, t, s] = f(c, e);
  return r + t.map(h(e == null ? void 0 : e.locale)).join((e == null ? void 0 : e.delimiter) ?? " ") + s;
}
function w(c, e) {
  const [r, t, s] = f(c, e), n = h(e == null ? void 0 : e.locale), o = E(e == null ? void 0 : e.locale), a = C(n, o);
  return r + t.map(a).join("") + s;
}
function S(c, e) {
  return T(c, { delimiter: "-", ...e });
}
function h(c) {
  return c === !1 ? (e) => e.toLowerCase() : (e) => e.toLocaleLowerCase(c);
}
function E(c) {
  return (e) => e.toLocaleUpperCase(c);
}
function C(c, e) {
  return (r, t) => {
    const s = r[0];
    return (t > 0 && s >= "0" && s <= "9" ? "_" + s : e(s)) + c(r.slice(1));
  };
}
function f(c, e = {}) {
  const r = e.split ?? (e.separateNumbers ? m : d), t = e.prefixCharacters ?? l, s = e.suffixCharacters ?? l;
  let n = 0, o = c.length;
  for (; n < c.length; ) {
    const a = c.charAt(n);
    if (!t.includes(a))
      break;
    n++;
  }
  for (; o > n; ) {
    const a = o - 1, R = c.charAt(a);
    if (!s.includes(R))
      break;
    o = a;
  }
  return [
    c.slice(0, n),
    r(c.slice(n, o)),
    c.slice(o)
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
    return _.plural(S(e));
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
  buildURL(e, r, t, s, n = {}) {
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
        return this.urlForQuery(n, e);
      case "queryRecord":
        return this.urlForQueryRecord(n, e);
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
var g = Object.getOwnPropertyDescriptor, O = (c, e, r, t) => {
  for (var s = t > 1 ? void 0 : t ? g(e, r) : e, n = c.length - 1, o; n >= 0; n--)
    (o = c[n]) && (s = o(s) || s);
  return s;
};
let u = class extends A {
  static serializeSnapshotToObject(c) {
    const e = {}, t = c.record._data;
    if (t)
      for (const [s, n] of Object.entries(t))
        s === "__proto__" || s === "constructor" || s === "prototype" || (e[s] = n);
    return e;
  }
  static toQueryString(c) {
    const e = [];
    for (const [r, t] of Object.entries(c))
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
  async _fetchJSON(c, e) {
    const r = await fetch(c, e);
    if (!r.ok) {
      let n = null;
      try {
        n = await r.json();
      } catch {
      }
      throw Object.assign(
        new Error(`Request failed: ${r.status}`),
        { status: r.status, body: n }
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
      const n = {};
      r.headers.forEach((o, a) => {
        n[a.toLowerCase()] = o;
      }), y(s, n);
    }
    return s;
  }
  async findRecord(c, e, r, t, s) {
    let n = this.buildURL(e, r, t, "findRecord");
    return s != null && s.include && (n += `${n.includes("?") ? "&" : "?"}include=${encodeURIComponent(s.include)}`), this._fetchJSON(n, {
      method: "GET",
      headers: this.defaultHeaders()
    });
  }
  async findAll(c, e, r, t, s) {
    let n = this.buildURL(e, null, t, "findAll");
    return s != null && s.include && (n += `${n.includes("?") ? "&" : "?"}include=${encodeURIComponent(s.include)}`), this._fetchJSON(n, {
      method: "GET",
      headers: this.defaultHeaders()
    });
  }
  /**
   * Fetches multiple records by appending an `ids` query parameter.
   * e.g. `/posts?ids=1,2,3`
   */
  async findMany(c, e, r, t) {
    const s = this.buildURL(e, r, t, "findMany"), n = s.includes("?") ? "&" : "?", o = `${s}${n}ids=${r.map(encodeURIComponent).join(",")}`;
    return this._fetchJSON(o, {
      method: "GET",
      headers: this.defaultHeaders()
    });
  }
  async query(c, e, r) {
    const s = `${this.buildURL(e, null, null, "query", r)}${u.toQueryString(r)}`;
    return this._fetchJSON(s, {
      method: "GET",
      headers: this.defaultHeaders()
    });
  }
  async queryRecord(c, e, r) {
    const s = `${this.buildURL(e, null, null, "queryRecord", r)}${u.toQueryString(r)}`;
    return this._fetchJSON(s, {
      method: "GET",
      headers: this.defaultHeaders()
    });
  }
  async createRecord(c, e, r) {
    const t = this.buildURL(e, null, r, "createRecord");
    return this._fetchJSON(t, {
      method: "POST",
      headers: this.mutationHeaders(),
      body: JSON.stringify(u.serializeSnapshotToObject(r))
    });
  }
  async updateRecord(c, e, r) {
    const t = this.buildURL(e, r.id, r, "updateRecord");
    return this._fetchJSON(t, {
      method: "PUT",
      headers: this.mutationHeaders(),
      body: JSON.stringify(u.serializeSnapshotToObject(r))
    });
  }
  async patchRecord(c, e, r) {
    const t = this.buildURL(e, r.id, r, "updateRecord"), s = r.changedAttributes(), n = {};
    for (const [o, [, a]] of Object.entries(s))
      n[o] = a;
    return this._fetchJSON(t, {
      method: "PATCH",
      headers: this.mutationHeaders(),
      body: JSON.stringify(n)
    });
  }
  async deleteRecord(c, e, r) {
    const t = this.buildURL(e, r.id, r, "deleteRecord");
    return this._fetchJSON(t, {
      method: "DELETE",
      headers: this.defaultHeaders()
    });
  }
};
u = O([
  p()
], u);
export {
  A,
  u as R,
  w as p
};
//# sourceMappingURL=RestAdapter-D6bGIHZT.js.map
