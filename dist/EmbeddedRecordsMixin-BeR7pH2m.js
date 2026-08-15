import { injectable as R } from "tsyringe";
import b from "pluralize";
import { r as A } from "./Serializer-DnbPBl65.js";
import { J as k } from "./JsonSerializer-DpRkJtYG.js";
var v = Object.getOwnPropertyDescriptor, x = (s, c, h, i) => {
  for (var t = i > 1 ? void 0 : i ? v(c, h) : c, e = s.length - 1, n; e >= 0; e--)
    (n = s[e]) && (t = n(t) || t);
  return t;
};
let g = class extends k {
  /**
   * Returns the plural payload key for a model name.
   * e.g. `'post'` → `'posts'`
   */
  payloadKeyFromModelName(s) {
    return b.plural(s);
  }
  /**
   * Returns the model name for a payload root key.
   * e.g. `'posts'` → `'post'`
   */
  modelNameFromPayloadKey(s) {
    return b.singular(s);
  }
  /**
   * Builds a `NormalizedDocument` from a root-key REST payload.
   *
   * - Looks for the model data under the singular or plural root key.
   * - Treats every other non-reserved key as a sideloaded type.
   * - Preserves `meta` and `links` from the root.
   */
  _buildDocument(s, c, h, i, t) {
    if (h == null || typeof h != "object")
      return { data: null };
    const e = h, n = c.modelName, l = this.payloadKeyFromModelName(n);
    let o = null;
    const d = /* @__PURE__ */ new Set();
    if (n in e) {
      d.add(n);
      const a = e[n];
      Array.isArray(a) ? o = a.map((r) => this.normalize(s, c, r)).filter((r) => r !== null) : o = this.normalize(s, c, a);
    } else if (l in e) {
      d.add(l);
      const a = e[l];
      Array.isArray(a) ? o = a.map((r) => this.normalize(s, c, r)).filter((r) => r !== null) : o = this.normalize(s, c, a);
    }
    const u = [];
    for (const [a, r] of Object.entries(e)) {
      if (d.has(a) || a === "meta" || a === "links")
        continue;
      const f = this.modelNameFromPayloadKey(a), p = A(s, f);
      if (Array.isArray(r))
        for (const y of r) {
          const z = this.normalize(s, p, y);
          z && u.push(z);
        }
      else if (r && typeof r == "object") {
        const y = this.normalize(s, p, r);
        y && u.push(y);
      }
    }
    const m = { data: o };
    return u.length > 0 && (m.included = u), e.meta && typeof e.meta == "object" && (m.meta = e.meta), e.links && typeof e.links == "object" && (m.links = e.links), m;
  }
};
g = x([
  R()
], g);
function _(s) {
  class c extends s {
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
    normalize(i, t, e, n) {
      if (!e || typeof e != "object" || Array.isArray(e))
        return super.normalize(i, t, e, n);
      const l = e, o = this.attrs ?? {}, d = { ...l };
      for (const [u, m] of t.relationships) {
        const a = o[u];
        if (!a || a.embedded !== "always")
          continue;
        const r = d[u];
        if (r != null) {
          if (m.kind === "hasMany" && Array.isArray(r)) {
            const f = [];
            for (const p of r) {
              const y = this.extractEmbeddedResource(i, m, p);
              y && y.id !== null && (f.push(y.id), this.pendingIncluded.push(y));
            }
            d[u] = f;
          } else if (m.kind === "belongsTo" && typeof r == "object" && !Array.isArray(r)) {
            const f = this.extractEmbeddedResource(i, m, r);
            f && f.id !== null && (this.pendingIncluded.push(f), d[u] = f.id);
          }
        }
      }
      return super.normalize(i, t, d, n);
    }
    /**
     * Resets `pendingIncluded`, delegates to `super.normalizeResponse`, then
     * appends any extracted embedded resources to `document.included`.
     */
    normalizeResponse(i, t, e, n, l) {
      this.pendingIncluded = [];
      const o = super.normalizeResponse(i, t, e, n, l);
      if (this.pendingIncluded.length > 0) {
        const d = o.included ? [...o.included] : [];
        d.push(...this.pendingIncluded), o.included = d, this.pendingIncluded = [];
      }
      return o;
    }
    /**
     * When `serialize: 'records'` is configured, writes the full related
     * record objects instead of just ids.
     */
    serializeHasMany(i, t, e) {
      var l;
      const n = (l = this.attrs) == null ? void 0 : l[e.name];
      if ((n == null ? void 0 : n.serialize) === "records") {
        const o = i.hasMany(e.name);
        t[this.keyForRelationship(e.name)] = o ?? [];
        return;
      }
      super.serializeHasMany(i, t, e);
    }
    /**
     * When `serialize: 'records'` is configured, writes the full related
     * record object instead of just the id.
     */
    serializeBelongsTo(i, t, e) {
      var l;
      const n = (l = this.attrs) == null ? void 0 : l[e.name];
      if ((n == null ? void 0 : n.serialize) === "records") {
        const o = i.belongsTo(e.name);
        t[this.keyForRelationship(e.name)] = o ?? null;
        return;
      }
      super.serializeBelongsTo(i, t, e);
    }
    /**
     * Normalizes a single embedded resource object using the related model's
     * own schema, looked up from the store by relationship type.
     */
    extractEmbeddedResource(i, t, e) {
      if (!e || typeof e != "object" || Array.isArray(e))
        return null;
      const n = A(i, t.type);
      return this.normalize(i, n, e);
    }
  }
  return c;
}
export {
  _ as E,
  g as R
};
//# sourceMappingURL=EmbeddedRecordsMixin-BeR7pH2m.js.map
