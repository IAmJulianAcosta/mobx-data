import { injectable as u } from "tsyringe";
import h from "pluralize";
import { R as l, c as p } from "./RestAdapter-DYUoyV5h.js";
var y = Object.getOwnPropertyDescriptor, _ = (t, r, e, o) => {
  for (var s = o > 1 ? void 0 : o ? y(r, e) : r, n = t.length - 1, a; n >= 0; n--)
    (a = t[n]) && (s = a(s) || s);
  return s;
};
const d = /* @__PURE__ */ new Set([
  "$filter",
  "$select",
  "$orderby",
  "$top",
  "$skip",
  "$expand",
  "$count",
  "$search",
  "$format",
  "$skiptoken"
]);
let i = class extends l {
  constructor() {
    super(...arguments), this.odataVersion = "4.0";
  }
  static isNumericKey(t) {
    return /^-?\d+(?:\.\d+)?$/.test(t);
  }
  static escapeODataString(t) {
    return t.replace(/'/g, "''");
  }
  defaultHeaders() {
    return {
      Accept: "application/json;odata.metadata=minimal",
      "OData-Version": this.odataVersion,
      "OData-MaxVersion": this.odataVersion,
      ...this.headers
    };
  }
  mutationHeaders() {
    return {
      "Content-Type": "application/json;odata.metadata=minimal",
      ...this.defaultHeaders()
    };
  }
  /**
   * Maps a camelCase/dasherized model name to a PascalCase plural entity-set name.
   * @example `pathForType('orderItem')` → `'OrderItems'`
   */
  pathForType(t) {
    return p(h.plural(t));
  }
  /**
   * Encodes a record id as an OData key literal.
   * Numeric ids are returned bare (`1`); string ids are single-quoted with
   * inner apostrophes escaped (`o'brien` → `'o''brien'`).
   *
   * Override this method when the service uses a non-default key format (e.g. GUIDs).
   */
  encodeKey(t) {
    return i.isNumericKey(t) ? t : `'${i.escapeODataString(t)}'`;
  }
  urlForFindRecord(t, r, e) {
    return this._composeURL(`${this.pathForType(r)}(${this.encodeKey(t)})`);
  }
  urlForUpdateRecord(t, r, e) {
    return this._composeURL(`${this.pathForType(r)}(${this.encodeKey(t)})`);
  }
  urlForDeleteRecord(t, r, e) {
    return this._composeURL(`${this.pathForType(r)}(${this.encodeKey(t)})`);
  }
  /**
   * Fetches multiple records by id using a single request.
   * Builds a `$filter=id eq X or id eq Y` expression so only one HTTP round-trip
   * is needed regardless of how many ids are requested.
   */
  async findMany(t, r, e, o) {
    const s = this.buildURL(r, e, o, "findMany"), n = e.map((c) => `id eq ${this.encodeKey(c)}`).join(" or "), a = `${s}?${this._toQueryString({ $filter: n })}`;
    return this._fetchJSON(a, {
      method: "GET",
      headers: this.defaultHeaders()
    });
  }
  async query(t, r, e) {
    const o = this.buildURL(r, null, null, "query", e), s = this._normalizeQuery(e), n = `${o}${this._appendQuery(s)}`;
    return this._fetchJSON(n, {
      method: "GET",
      headers: this.defaultHeaders()
    });
  }
  /**
   * Queries for a single record by appending `$top=1` to whatever filter is provided.
   * The caller is responsible for picking the first element from the returned `value` array.
   */
  async queryRecord(t, r, e) {
    const o = this.buildURL(r, null, null, "queryRecord", e), s = { ...this._normalizeQuery(e), $top: 1 }, n = `${o}${this._appendQuery(s)}`;
    return this._fetchJSON(n, {
      method: "GET",
      headers: this.defaultHeaders()
    });
  }
  /** Sends a PATCH request (partial update) as required by the OData v4 spec. */
  async updateRecord(t, r, e) {
    const o = this.buildURL(r, e.id, e, "updateRecord");
    return this._fetchJSON(o, {
      method: "PATCH",
      headers: this.mutationHeaders(),
      body: JSON.stringify(this._serializeSnapshot(e))
    });
  }
  /** Sends a PATCH request with only the changed attributes (partial update). */
  async patchRecord(t, r, e) {
    const o = this.buildURL(r, e.id, e, "updateRecord"), s = e.changedAttributes(), n = {};
    for (const [a, [, c]] of Object.entries(s))
      n[a] = c;
    return this._fetchJSON(o, {
      method: "PATCH",
      headers: this.mutationHeaders(),
      body: JSON.stringify(n)
    });
  }
  /** Extracts the raw attribute map from the snapshot's internal record. */
  _serializeSnapshot(t) {
    const e = t.record._data, o = {};
    if (e)
      for (const s of Object.keys(e))
        s === "__proto__" || s === "constructor" || s === "prototype" || (o[s] = e[s]);
    return o;
  }
  /**
   * Normalises a query hash so every OData system option has its `$` prefix.
   * Bare names (`filter`, `top`, `expand`) are prefixed automatically.
   * Custom (non-system) keys are forwarded verbatim.
   * `null` and `undefined` values are dropped.
   */
  _normalizeQuery(t) {
    const r = {};
    for (const [e, o] of Object.entries(t))
      o != null && (d.has(e) ? r[e] = o : d.has(`$${e}`) ? r[`$${e}`] = o : r[e] = o);
    return r;
  }
  /** Serialises a key→value map to a `key=value&…` query string (percent-encoded). */
  _toQueryString(t) {
    const r = [];
    for (const [e, o] of Object.entries(t))
      o != null && r.push(`${encodeURIComponent(e)}=${encodeURIComponent(String(o))}`);
    return r.join("&");
  }
  /** Returns `?key=value&…` when the query is non-empty, or an empty string. */
  _appendQuery(t) {
    const r = this._toQueryString(t);
    return r ? `?${r}` : "";
  }
};
i = _([
  u()
], i);
export {
  i as O
};
//# sourceMappingURL=ODataAdapter-CeBJblLQ.js.map
