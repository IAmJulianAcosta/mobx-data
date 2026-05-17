import { injectable as _ } from "tsyringe";
import R from "pluralize";
import { S as g } from "./Serializer-FxJbsZ50.js";
var v = Object.getOwnPropertyDescriptor, w = (t, a, i, s) => {
  for (var r = s > 1 ? void 0 : s ? v(a, i) : a, e = t.length - 1, n; e >= 0; e--)
    (n = t[e]) && (r = n(r) || r);
  return r;
};
let z = class extends g {
  static dispatchMethodName(t) {
    switch (t) {
      case "findRecord":
        return "normalizeFindRecordResponse";
      case "findAll":
        return "normalizeFindAllResponse";
      case "query":
        return "normalizeQueryResponse";
      case "queryRecord":
        return "normalizeQueryRecordResponse";
      case "createRecord":
        return "normalizeCreateRecordResponse";
      case "updateRecord":
        return "normalizeUpdateRecordResponse";
      case "deleteRecord":
        return "normalizeDeleteRecordResponse";
      default:
        return null;
    }
  }
  /**
   * Normalizes a single flat JSON object into a `NormalizedResource`.
   * Returns `null` for absent or non-object payloads.
   */
  normalize(t, a, i, s) {
    if (i == null || typeof i != "object")
      return null;
    const r = i, e = this.extractId(a, r), n = this.extractAttributes(a, r), o = this.extractRelationships(a, r), l = {
      type: a.modelName,
      id: e,
      attributes: n
    };
    return o && Object.keys(o).length > 0 && (l.relationships = o), l;
  }
  /**
   * Entry point for normalization.
   *
   * Checks whether a subclass has overridden the relevant per-operation hook
   * (e.g. `normalizeFindRecordResponse`).  If so, calls it; otherwise falls
   * through to `_buildDocument`.
   */
  normalizeResponse(t, a, i, s, r) {
    const e = z.dispatchMethodName(r);
    if (e) {
      const n = this[e], o = g.prototype[e];
      if (typeof n == "function" && n !== o)
        return n.call(
          this,
          t,
          a,
          i,
          s,
          r
        );
    }
    return this._buildDocument(t, a, i, s, r);
  }
  /**
   * Builds a `NormalizedDocument` from a raw payload.
   * Arrays are normalized item by item; plain objects are normalized as a
   * single resource.
   */
  _buildDocument(t, a, i, s, r) {
    return i == null ? { data: null } : Array.isArray(i) ? { data: i.map((o) => this.normalize(t, a, o)).filter((o) => o !== null) } : { data: this.normalize(t, a, i) };
  }
  /**
   * Serializes a snapshot to a flat JSON object.
   * Includes `id` when `options.includeId` is `true`.
   */
  serialize(t, a) {
    const i = {};
    return a != null && a.includeId && t.id !== null && (i[this.primaryKey] = t.id), t.eachAttribute((s, r) => {
      this.serializeAttribute(t, i, s, r);
    }), t.eachRelationship((s, r) => {
      r.kind === "belongsTo" ? this.serializeBelongsTo(t, i, r) : this.serializeHasMany(t, i, r);
    }), i;
  }
};
z = w([
  _()
], z);
var M = Object.getOwnPropertyDescriptor, x = (t, a, i, s) => {
  for (var r = s > 1 ? void 0 : s ? M(a, i) : a, e = t.length - 1, n; e >= 0; e--)
    (n = t[e]) && (r = n(r) || r);
  return r;
};
let A = class extends z {
  /**
   * Returns the plural payload key for a model name.
   * e.g. `'post'` → `'posts'`
   */
  payloadKeyFromModelName(t) {
    return R.plural(t);
  }
  /**
   * Returns the model name for a payload root key.
   * e.g. `'posts'` → `'post'`
   */
  modelNameFromPayloadKey(t) {
    return R.singular(t);
  }
  /**
   * Builds a `NormalizedDocument` from a root-key REST payload.
   *
   * - Looks for the model data under the singular or plural root key.
   * - Treats every other non-reserved key as a sideloaded type.
   * - Preserves `meta` and `links` from the root.
   */
  _buildDocument(t, a, i, s, r) {
    if (i == null || typeof i != "object")
      return { data: null };
    const e = i, n = a.modelName, o = this.payloadKeyFromModelName(n);
    let l = null;
    const u = /* @__PURE__ */ new Set();
    if (n in e) {
      u.add(n);
      const d = e[n];
      Array.isArray(d) ? l = d.map((c) => this.normalize(t, a, c)).filter((c) => c !== null) : l = this.normalize(t, a, d);
    } else if (o in e) {
      u.add(o);
      const d = e[o];
      Array.isArray(d) ? l = d.map((c) => this.normalize(t, a, c)).filter((c) => c !== null) : l = this.normalize(t, a, d);
    }
    const m = [];
    for (const [d, c] of Object.entries(e)) {
      if (u.has(d) || d === "meta" || d === "links")
        continue;
      const y = {
        modelName: this.modelNameFromPayloadKey(d),
        attributes: /* @__PURE__ */ new Map(),
        relationships: /* @__PURE__ */ new Map()
      };
      if (Array.isArray(c))
        for (const h of c) {
          const b = this.normalize(t, y, h);
          b && m.push(b);
        }
      else if (c && typeof c == "object") {
        const h = this.normalize(t, y, c);
        h && m.push(h);
      }
    }
    const f = { data: l };
    return m.length > 0 && (f.included = m), e.meta && typeof e.meta == "object" && (f.meta = e.meta), e.links && typeof e.links == "object" && (f.links = e.links), f;
  }
};
A = x([
  _()
], A);
function I(t) {
  class a extends t {
    constructor() {
      super(...arguments), this.pendingIncluded = [];
    }
    /**
     * Intercepts raw payload hashes to extract embedded records.
     *
     * For each relationship configured with `embedded: 'always'`:
     * - Recursively normalizes the embedded object(s) and adds them to
     *   `pendingIncluded`.
     * - Replaces the embedded value in the hash with the extracted id(s) so
     *   `super.normalize` treats it as a plain id reference.
     */
    normalize(s, r, e, n) {
      if (!e || typeof e != "object" || Array.isArray(e))
        return super.normalize(s, r, e, n);
      const o = e, l = this.attrs ?? {}, u = { ...o };
      for (const [m, f] of r.relationships) {
        const d = l[m];
        if (!d || d.embedded !== "always")
          continue;
        const c = u[m];
        if (c != null) {
          if (f.kind === "hasMany" && Array.isArray(c)) {
            const p = [];
            for (const y of c) {
              const h = this.extractEmbeddedResource(s, f, y);
              h && h.id !== null && (p.push(h.id), this.pendingIncluded.push(h));
            }
            u[m] = p;
          } else if (f.kind === "belongsTo" && typeof c == "object" && !Array.isArray(c)) {
            const p = this.extractEmbeddedResource(s, f, c);
            p && p.id !== null && (this.pendingIncluded.push(p), u[m] = p.id);
          }
        }
      }
      return super.normalize(s, r, u, n);
    }
    /**
     * Resets `pendingIncluded`, delegates to `super.normalizeResponse`, then
     * appends any extracted embedded resources to `document.included`.
     */
    normalizeResponse(s, r, e, n, o) {
      this.pendingIncluded = [];
      const l = super.normalizeResponse(s, r, e, n, o);
      if (this.pendingIncluded.length > 0) {
        const u = l.included ? [...l.included] : [];
        u.push(...this.pendingIncluded), l.included = u, this.pendingIncluded = [];
      }
      return l;
    }
    /**
     * When `serialize: 'records'` is configured, writes the full related
     * record objects instead of just ids.
     */
    serializeHasMany(s, r, e) {
      var o;
      const n = (o = this.attrs) == null ? void 0 : o[e.name];
      if ((n == null ? void 0 : n.serialize) === "records") {
        const l = s.hasMany(e.name);
        r[this.keyForRelationship(e.name)] = l ?? [];
        return;
      }
      super.serializeHasMany(s, r, e);
    }
    /**
     * When `serialize: 'records'` is configured, writes the full related
     * record object instead of just the id.
     */
    serializeBelongsTo(s, r, e) {
      var o;
      const n = (o = this.attrs) == null ? void 0 : o[e.name];
      if ((n == null ? void 0 : n.serialize) === "records") {
        const l = s.belongsTo(e.name);
        r[this.keyForRelationship(e.name)] = l ?? null;
        return;
      }
      super.serializeBelongsTo(s, r, e);
    }
    /**
     * Normalizes a single embedded resource object using the related model's
     * type as a placeholder `ModelClassMeta`.
     */
    extractEmbeddedResource(s, r, e) {
      if (!e || typeof e != "object" || Array.isArray(e))
        return null;
      const n = {
        modelName: r.type,
        attributes: /* @__PURE__ */ new Map(),
        relationships: /* @__PURE__ */ new Map()
      };
      return this.normalize(s, n, e);
    }
  }
  return a;
}
export {
  I as E,
  z as J,
  A as R
};
//# sourceMappingURL=EmbeddedRecordsMixin-VoHluHCT.js.map
