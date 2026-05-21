import { injectable as f } from "tsyringe";
import { R as h } from "./RestAdapter-CYInlScn.js";
import m from "pluralize";
import { S as b } from "./Serializer-Ca6w_QNQ.js";
var _ = Object.getOwnPropertyDescriptor, g = (t, i, a, s) => {
  for (var r = s > 1 ? void 0 : s ? _(i, a) : i, e = t.length - 1, n; e >= 0; e--)
    (n = t[e]) && (r = n(r) || r);
  return r;
};
let p = class extends h {
  constructor() {
    super(...arguments), this.coalesceFindRequests = !0;
  }
  /** Returns JSON:API `Accept` header alongside any custom headers. */
  defaultHeaders() {
    return {
      Accept: "application/vnd.api+json",
      ...this.headers
    };
  }
  /** Returns JSON:API `Content-Type` header for mutation requests. */
  mutationHeaders() {
    return {
      "Content-Type": "application/vnd.api+json",
      ...this.defaultHeaders()
    };
  }
  /**
   * Sends a PATCH request to update a record (JSON:API mandates PATCH, not PUT).
   */
  async updateRecord(t, i, a) {
    const s = this.buildURL(i, a.id, a, "updateRecord");
    return this._fetchJSON(s, {
      method: "PATCH",
      headers: this.mutationHeaders(),
      body: JSON.stringify(this._serializeForUpdate(a))
    });
  }
  /**
   * Sends a PATCH request with only the changed attributes (partial update).
   * Produces a JSON:API document with only the dirty attribute keys.
   */
  async patchRecord(t, i, a) {
    const s = this.buildURL(i, a.id, a, "updateRecord"), r = a.changedAttributes(), e = {};
    for (const [l, [, d]] of Object.entries(r))
      e[l] = d;
    const n = {
      data: {
        type: i,
        id: a.id,
        attributes: e
      }
    };
    return this._fetchJSON(s, {
      method: "PATCH",
      headers: this.mutationHeaders(),
      body: JSON.stringify(n)
    });
  }
  /**
   * Extracts the raw data object from the snapshot for use as the PATCH body.
   * Subclasses may override this to produce a full JSON:API `{ data: … }` document.
   */
  _serializeForUpdate(t) {
    const i = t.record;
    return i._data ? { ...i._data } : {};
  }
};
p = g([
  f()
], p);
var A = Object.getOwnPropertyDescriptor, v = (t, i, a, s) => {
  for (var r = s > 1 ? void 0 : s ? A(i, a) : i, e = t.length - 1, n; e >= 0; e--)
    (n = t[e]) && (r = n(r) || r);
  return r;
};
let y = class extends b {
  /**
   * Returns the plural JSON:API `type` string for a model name.
   * e.g. `'post'` → `'posts'`
   */
  payloadKeyFromModelName(t) {
    return m.plural(t);
  }
  /**
   * Returns the model name for a JSON:API `type` string.
   * e.g. `'posts'` → `'post'`
   */
  modelNameFromPayloadKey(t) {
    return m.singular(t);
  }
  /**
   * Normalizes a single JSON:API resource object into a `NormalizedResource`.
   * Returns `null` for absent, non-object, or type-less payloads.
   */
  normalize(t, i, a, s) {
    if (!a || typeof a != "object" || Array.isArray(a))
      return null;
    const r = a;
    if (!r.type)
      return null;
    const e = {
      type: this.modelNameFromPayloadKey(r.type),
      id: r.id === null || r.id === void 0 ? null : String(r.id)
    };
    if (r.attributes && (e.attributes = { ...r.attributes }), r.relationships) {
      const n = {};
      for (const [l, d] of Object.entries(r.relationships))
        d.data === null ? n[l] = { data: null } : Array.isArray(d.data) ? n[l] = {
          data: d.data.map((o) => ({
            type: this.modelNameFromPayloadKey(o.type),
            id: String(o.id)
          }))
        } : n[l] = {
          data: {
            type: this.modelNameFromPayloadKey(d.data.type),
            id: String(d.data.id)
          }
        };
      e.relationships = n;
    }
    return e;
  }
  /**
   * Normalizes a full JSON:API compound document.
   *
   * - `data` (single or array) → primary resources
   * - `included` → side-loaded resources pushed to `normalizedDoc.included`
   * - `meta` and `links` → forwarded as-is
   */
  normalizeResponse(t, i, a, s, r) {
    if (!a || typeof a != "object")
      return { data: null };
    const e = a;
    let n = null;
    e.data === null || e.data === void 0 ? n = null : Array.isArray(e.data) ? n = e.data.map((d) => this.normalize(t, i, d)).filter((d) => d !== null) : n = this.normalize(t, i, e.data);
    const l = { data: n };
    if (e.included && e.included.length > 0) {
      const d = [];
      for (const o of e.included) {
        const c = {
          modelName: this.modelNameFromPayloadKey(o.type),
          attributes: /* @__PURE__ */ new Map(),
          relationships: /* @__PURE__ */ new Map()
        }, u = this.normalize(t, c, o);
        u && d.push(u);
      }
      l.included = d;
    }
    return e.meta && (l.meta = e.meta), e.links && (l.links = e.links), l;
  }
  /**
   * Serializes a record snapshot to a JSON:API `{ data: … }` document.
   *
   * Attributes are placed in `data.attributes`; relationships are placed in
   * `data.relationships` with proper `{ data: { type, id } }` structure.
   * `id` is included in `data` when `options.includeId` is `true`.
   */
  serialize(t, i) {
    const a = {};
    t.eachAttribute((e) => {
      a[this.keyForAttribute(e)] = t.attr(e);
    });
    const s = {};
    t.eachRelationship((e, n) => {
      const { name: l } = n, d = this.keyForRelationship(l), o = this.payloadKeyFromModelName(n.type);
      if (n.kind === "belongsTo") {
        const c = t.belongsTo(l);
        s[d] = c && c.id != null ? { data: { type: o, id: String(c.id) } } : { data: null };
      } else {
        const c = t.hasMany(l) ?? [];
        s[d] = {
          data: c.map((u) => ({
            type: o,
            id: String(u.id)
          }))
        };
      }
    });
    const r = {
      type: this.payloadKeyFromModelName(t.modelName),
      attributes: a
    };
    return i != null && i.includeId && t.id !== null && (r.id = t.id), Object.keys(s).length > 0 && (r.relationships = s), { data: r };
  }
};
y = v([
  f()
], y);
export {
  p as J,
  y as a
};
//# sourceMappingURL=JsonApiSerializer-DyFMN1xT.js.map
