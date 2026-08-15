function p(u, r) {
  var e;
  const { schema: t } = u ?? {};
  return t != null && t.metaFor && ((e = t.doesTypeExist) != null && e.call(t, r)) ? t.metaFor(r) : {
    modelName: r,
    attributes: /* @__PURE__ */ new Map(),
    relationships: /* @__PURE__ */ new Map()
  };
}
class y {
  constructor() {
    this.primaryKey = "id";
  }
  // Per-operation normalization hooks — default to calling `normalizeResponse`.
  /** Called when normalizing a `findRecord` response. */
  normalizeFindRecordResponse(r, t, e, i, n) {
    return this.normalizeResponse(r, t, e, i, n);
  }
  /** Called when normalizing a `findAll` response. */
  normalizeFindAllResponse(r, t, e, i, n) {
    return this.normalizeResponse(r, t, e, i, n);
  }
  /** Called when normalizing a `query` response. */
  normalizeQueryResponse(r, t, e, i, n) {
    return this.normalizeResponse(r, t, e, i, n);
  }
  /** Called when normalizing a `queryRecord` response. */
  normalizeQueryRecordResponse(r, t, e, i, n) {
    return this.normalizeResponse(r, t, e, i, n);
  }
  /** Called when normalizing a `createRecord` response. */
  normalizeCreateRecordResponse(r, t, e, i, n) {
    return this.normalizeResponse(r, t, e, i, n);
  }
  /** Called when normalizing an `updateRecord` response. */
  normalizeUpdateRecordResponse(r, t, e, i, n) {
    return this.normalizeResponse(r, t, e, i, n);
  }
  /** Called when normalizing a `deleteRecord` response. */
  normalizeDeleteRecordResponse(r, t, e, i, n) {
    return this.normalizeResponse(r, t, e, i, n);
  }
  /**
   * Writes a single attribute value into `json`.
   * Default: writes `snapshot.attr(key)` under the key returned by `keyForAttribute`.
   */
  serializeAttribute(r, t, e, i) {
    t[this.keyForAttribute(e)] = r.attr(e);
  }
  /**
   * Writes a `belongsTo` relationship id into `json`.
   * Default: writes the related record's id (or `null`) under `keyForRelationship`.
   */
  serializeBelongsTo(r, t, e) {
    const i = r.belongsTo(e.name, { id: !0 });
    t[this.keyForRelationship(e.name)] = i ?? null;
  }
  /**
   * Writes a `hasMany` relationship id array into `json`.
   * Default: writes the array of related ids under `keyForRelationship`.
   */
  serializeHasMany(r, t, e) {
    const i = r.hasMany(e.name, { ids: !0 });
    t[this.keyForRelationship(e.name)] = i ?? [];
  }
  /**
   * Extracts attribute values from a raw resource hash.
   * Returns a map of `{ propertyName: value }` using `keyForAttribute` to
   * locate the payload key.
   */
  extractAttributes(r, t) {
    const e = {};
    for (const [i] of r.attributes) {
      const n = this.keyForAttribute(i);
      n in t && (e[i] = t[n]);
    }
    return e;
  }
  /**
   * Extracts all non-id, non-relationship fields from a raw payload.
   * Used for polymorphic models where the concrete child may have attributes
   * not declared on the abstract parent.
   */
  extractAllAttributes(r, t) {
    const e = /* @__PURE__ */ new Set();
    for (const [n] of r.relationships)
      e.add(this.keyForRelationship(n));
    const i = {};
    for (const [n, o] of Object.entries(t))
      n === this.primaryKey || e.has(n) || (i[n] = o);
    return i;
  }
  /**
   * Extracts relationship references from a raw resource hash.
   *
   * - `belongsTo`: raw id (string or number) → `{ data: { type, id } }`
   * - `hasMany`: array of raw ids → `{ data: [{ type, id }, …] }`
   *
   * Returns only the relationships whose payload keys are present in `resourceHash`.
   */
  extractRelationships(r, t) {
    const e = {};
    for (const [i, n] of r.relationships) {
      const o = this.keyForRelationship(i);
      if (!(o in t))
        continue;
      const s = t[o];
      if (n.kind === "belongsTo")
        s == null ? e[i] = { data: null } : (typeof s == "string" || typeof s == "number") && (e[i] = {
          data: { type: n.type, id: String(s) }
        });
      else if (Array.isArray(s)) {
        const a = s.filter((l) => typeof l == "string" || typeof l == "number").map((l) => ({ type: n.type, id: String(l) }));
        a.length === s.length && (e[i] = { data: a });
      }
    }
    return e;
  }
  /**
   * Extracts the primary key from a raw resource hash.
   * Returns `null` when the key is absent.
   */
  extractId(r, t) {
    const e = t[this.primaryKey];
    return e == null ? null : String(e);
  }
  /**
   * Extracts field-level validation errors from a server error payload.
   * Default: looks for `{ errors: { field: string | string[] } }`.
   * Returns an empty object when no recognisable error structure is found.
   */
  extractErrors(r, t, e, i) {
    if (e && typeof e == "object" && "errors" in e) {
      const n = e.errors;
      if (n && typeof n == "object" && !Array.isArray(n)) {
        const o = {};
        for (const [s, a] of Object.entries(n))
          o[s] = Array.isArray(a) ? a.map(String) : [String(a)];
        return o;
      }
    }
    return {};
  }
  /**
   * Maps a camelCase property name to the payload key used by this format.
   * Default: identity (no transformation).
   */
  keyForAttribute(r) {
    return r;
  }
  /**
   * Maps a camelCase relationship name to the payload key used by this format.
   * Default: identity (no transformation).
   */
  keyForRelationship(r) {
    return r;
  }
}
export {
  y as S,
  p as r
};
//# sourceMappingURL=Serializer-DnbPBl65.js.map
