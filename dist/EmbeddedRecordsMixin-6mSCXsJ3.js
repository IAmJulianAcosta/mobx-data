import { injectable as A } from "tsyringe";
import b from "pluralize";
import { J as w } from "./JsonSerializer-CFqo6GjC.js";
var M = Object.getOwnPropertyDescriptor, R = (a, c, h, t) => {
  for (var i = t > 1 ? void 0 : t ? M(c, h) : c, e = a.length - 1, n; e >= 0; e--)
    (n = a[e]) && (i = n(i) || i);
  return i;
};
let g = class extends w {
  /**
   * Returns the plural payload key for a model name.
   * e.g. `'post'` → `'posts'`
   */
  payloadKeyFromModelName(a) {
    return b.plural(a);
  }
  /**
   * Returns the model name for a payload root key.
   * e.g. `'posts'` → `'post'`
   */
  modelNameFromPayloadKey(a) {
    return b.singular(a);
  }
  /**
   * Builds a `NormalizedDocument` from a root-key REST payload.
   *
   * - Looks for the model data under the singular or plural root key.
   * - Treats every other non-reserved key as a sideloaded type.
   * - Preserves `meta` and `links` from the root.
   */
  _buildDocument(a, c, h, t, i) {
    if (h == null || typeof h != "object")
      return { data: null };
    const e = h, n = c.modelName, l = this.payloadKeyFromModelName(n);
    let s = null;
    const d = /* @__PURE__ */ new Set();
    if (n in e) {
      d.add(n);
      const o = e[n];
      Array.isArray(o) ? s = o.map((r) => this.normalize(a, c, r)).filter((r) => r !== null) : s = this.normalize(a, c, o);
    } else if (l in e) {
      d.add(l);
      const o = e[l];
      Array.isArray(o) ? s = o.map((r) => this.normalize(a, c, r)).filter((r) => r !== null) : s = this.normalize(a, c, o);
    }
    const u = [];
    for (const [o, r] of Object.entries(e)) {
      if (d.has(o) || o === "meta" || o === "links")
        continue;
      const y = {
        modelName: this.modelNameFromPayloadKey(o),
        attributes: /* @__PURE__ */ new Map(),
        relationships: /* @__PURE__ */ new Map()
      };
      if (Array.isArray(r))
        for (const f of r) {
          const z = this.normalize(a, y, f);
          z && u.push(z);
        }
      else if (r && typeof r == "object") {
        const f = this.normalize(a, y, r);
        f && u.push(f);
      }
    }
    const m = { data: s };
    return u.length > 0 && (m.included = u), e.meta && typeof e.meta == "object" && (m.meta = e.meta), e.links && typeof e.links == "object" && (m.links = e.links), m;
  }
};
g = R([
  A()
], g);
function v(a) {
  class c extends a {
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
    normalize(t, i, e, n) {
      if (!e || typeof e != "object" || Array.isArray(e))
        return super.normalize(t, i, e, n);
      const l = e, s = this.attrs ?? {}, d = { ...l };
      for (const [u, m] of i.relationships) {
        const o = s[u];
        if (!o || o.embedded !== "always")
          continue;
        const r = d[u];
        if (r != null) {
          if (m.kind === "hasMany" && Array.isArray(r)) {
            const p = [];
            for (const y of r) {
              const f = this.extractEmbeddedResource(t, m, y);
              f && f.id !== null && (p.push(f.id), this.pendingIncluded.push(f));
            }
            d[u] = p;
          } else if (m.kind === "belongsTo" && typeof r == "object" && !Array.isArray(r)) {
            const p = this.extractEmbeddedResource(t, m, r);
            p && p.id !== null && (this.pendingIncluded.push(p), d[u] = p.id);
          }
        }
      }
      return super.normalize(t, i, d, n);
    }
    /**
     * Resets `pendingIncluded`, delegates to `super.normalizeResponse`, then
     * appends any extracted embedded resources to `document.included`.
     */
    normalizeResponse(t, i, e, n, l) {
      this.pendingIncluded = [];
      const s = super.normalizeResponse(t, i, e, n, l);
      if (this.pendingIncluded.length > 0) {
        const d = s.included ? [...s.included] : [];
        d.push(...this.pendingIncluded), s.included = d, this.pendingIncluded = [];
      }
      return s;
    }
    /**
     * When `serialize: 'records'` is configured, writes the full related
     * record objects instead of just ids.
     */
    serializeHasMany(t, i, e) {
      var l;
      const n = (l = this.attrs) == null ? void 0 : l[e.name];
      if ((n == null ? void 0 : n.serialize) === "records") {
        const s = t.hasMany(e.name);
        i[this.keyForRelationship(e.name)] = s ?? [];
        return;
      }
      super.serializeHasMany(t, i, e);
    }
    /**
     * When `serialize: 'records'` is configured, writes the full related
     * record object instead of just the id.
     */
    serializeBelongsTo(t, i, e) {
      var l;
      const n = (l = this.attrs) == null ? void 0 : l[e.name];
      if ((n == null ? void 0 : n.serialize) === "records") {
        const s = t.belongsTo(e.name);
        i[this.keyForRelationship(e.name)] = s ?? null;
        return;
      }
      super.serializeBelongsTo(t, i, e);
    }
    /**
     * Normalizes a single embedded resource object using the related model's
     * type as a placeholder `ModelClassMeta`.
     */
    extractEmbeddedResource(t, i, e) {
      if (!e || typeof e != "object" || Array.isArray(e))
        return null;
      const n = {
        modelName: i.type,
        attributes: /* @__PURE__ */ new Map(),
        relationships: /* @__PURE__ */ new Map()
      };
      return this.normalize(t, n, e);
    }
  }
  return c;
}
export {
  v as E,
  g as R
};
//# sourceMappingURL=EmbeddedRecordsMixin-6mSCXsJ3.js.map
