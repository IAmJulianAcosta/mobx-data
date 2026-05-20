import { injectable as _ } from "tsyringe";
import R from "pluralize";
import "reflect-metadata";
import { a as M } from "./types-CC2fG3FP.js";
import { S as A } from "./Serializer-Ca6w_QNQ.js";
var v = Object.getOwnPropertyDescriptor, w = (t, i, s, a) => {
  for (var r = a > 1 ? void 0 : a ? v(i, s) : i, e = t.length - 1, n; e >= 0; e--)
    (n = t[e]) && (r = n(r) || r);
  return r;
};
let z = class extends A {
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
  normalize(t, i, s, a) {
    if (s == null || typeof s != "object")
      return null;
    const r = s, e = this.extractId(i, r), n = Reflect.getOwnMetadata(
      M,
      i
    ), o = n != null && n.discriminator ? this.extractAllAttributes(i, r) : this.extractAttributes(i, r), l = this.extractRelationships(i, r), u = {
      type: i.modelName,
      id: e,
      attributes: o
    };
    return l && Object.keys(l).length > 0 && (u.relationships = l), u;
  }
  /**
   * Entry point for normalization.
   *
   * Checks whether a subclass has overridden the relevant per-operation hook
   * (e.g. `normalizeFindRecordResponse`).  If so, calls it; otherwise falls
   * through to `_buildDocument`.
   */
  normalizeResponse(t, i, s, a, r) {
    const e = z.dispatchMethodName(r);
    if (e) {
      const n = this[e], o = A.prototype[e];
      if (typeof n == "function" && n !== o)
        return n.call(
          this,
          t,
          i,
          s,
          a,
          r
        );
    }
    return this._buildDocument(t, i, s, a, r);
  }
  /**
   * Builds a `NormalizedDocument` from a raw payload.
   * Arrays are normalized item by item; plain objects are normalized as a
   * single resource.
   */
  _buildDocument(t, i, s, a, r) {
    return s == null ? { data: null } : Array.isArray(s) ? { data: s.map((o) => this.normalize(t, i, o)).filter((o) => o !== null) } : { data: this.normalize(t, i, s) };
  }
  /**
   * Serializes a snapshot to a flat JSON object.
   * Includes `id` when `options.includeId` is `true`.
   */
  serialize(t, i) {
    const s = {};
    return i != null && i.includeId && t.id !== null && (s[this.primaryKey] = t.id), t.eachAttribute((a, r) => {
      this.serializeAttribute(t, s, a, r);
    }), t.eachRelationship((a, r) => {
      r.kind === "belongsTo" ? this.serializeBelongsTo(t, s, r) : this.serializeHasMany(t, s, r);
    }), s;
  }
};
z = w([
  _()
], z);
var x = Object.getOwnPropertyDescriptor, j = (t, i, s, a) => {
  for (var r = a > 1 ? void 0 : a ? x(i, s) : i, e = t.length - 1, n; e >= 0; e--)
    (n = t[e]) && (r = n(r) || r);
  return r;
};
let g = class extends z {
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
  _buildDocument(t, i, s, a, r) {
    if (s == null || typeof s != "object")
      return { data: null };
    const e = s, n = i.modelName, o = this.payloadKeyFromModelName(n);
    let l = null;
    const u = /* @__PURE__ */ new Set();
    if (n in e) {
      u.add(n);
      const d = e[n];
      Array.isArray(d) ? l = d.map((c) => this.normalize(t, i, c)).filter((c) => c !== null) : l = this.normalize(t, i, d);
    } else if (o in e) {
      u.add(o);
      const d = e[o];
      Array.isArray(d) ? l = d.map((c) => this.normalize(t, i, c)).filter((c) => c !== null) : l = this.normalize(t, i, d);
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
g = j([
  _()
], g);
function D(t) {
  class i extends t {
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
    normalize(a, r, e, n) {
      if (!e || typeof e != "object" || Array.isArray(e))
        return super.normalize(a, r, e, n);
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
              const h = this.extractEmbeddedResource(a, f, y);
              h && h.id !== null && (p.push(h.id), this.pendingIncluded.push(h));
            }
            u[m] = p;
          } else if (f.kind === "belongsTo" && typeof c == "object" && !Array.isArray(c)) {
            const p = this.extractEmbeddedResource(a, f, c);
            p && p.id !== null && (this.pendingIncluded.push(p), u[m] = p.id);
          }
        }
      }
      return super.normalize(a, r, u, n);
    }
    /**
     * Resets `pendingIncluded`, delegates to `super.normalizeResponse`, then
     * appends any extracted embedded resources to `document.included`.
     */
    normalizeResponse(a, r, e, n, o) {
      this.pendingIncluded = [];
      const l = super.normalizeResponse(a, r, e, n, o);
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
    serializeHasMany(a, r, e) {
      var o;
      const n = (o = this.attrs) == null ? void 0 : o[e.name];
      if ((n == null ? void 0 : n.serialize) === "records") {
        const l = a.hasMany(e.name);
        r[this.keyForRelationship(e.name)] = l ?? [];
        return;
      }
      super.serializeHasMany(a, r, e);
    }
    /**
     * When `serialize: 'records'` is configured, writes the full related
     * record object instead of just the id.
     */
    serializeBelongsTo(a, r, e) {
      var o;
      const n = (o = this.attrs) == null ? void 0 : o[e.name];
      if ((n == null ? void 0 : n.serialize) === "records") {
        const l = a.belongsTo(e.name);
        r[this.keyForRelationship(e.name)] = l ?? null;
        return;
      }
      super.serializeBelongsTo(a, r, e);
    }
    /**
     * Normalizes a single embedded resource object using the related model's
     * type as a placeholder `ModelClassMeta`.
     */
    extractEmbeddedResource(a, r, e) {
      if (!e || typeof e != "object" || Array.isArray(e))
        return null;
      const n = {
        modelName: r.type,
        attributes: /* @__PURE__ */ new Map(),
        relationships: /* @__PURE__ */ new Map()
      };
      return this.normalize(a, n, e);
    }
  }
  return i;
}
export {
  D as E,
  z as J,
  g as R
};
//# sourceMappingURL=EmbeddedRecordsMixin-DlfjZ0nK.js.map
