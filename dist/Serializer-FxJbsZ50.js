class p {
  constructor() {
    this.primaryKey = "id";
  }
  // Per-operation normalization hooks — default to calling `normalizeResponse`.
  /** Called when normalizing a `findRecord` response. */
  normalizeFindRecordResponse(r, t, e, n, i) {
    return this.normalizeResponse(r, t, e, n, i);
  }
  /** Called when normalizing a `findAll` response. */
  normalizeFindAllResponse(r, t, e, n, i) {
    return this.normalizeResponse(r, t, e, n, i);
  }
  /** Called when normalizing a `query` response. */
  normalizeQueryResponse(r, t, e, n, i) {
    return this.normalizeResponse(r, t, e, n, i);
  }
  /** Called when normalizing a `queryRecord` response. */
  normalizeQueryRecordResponse(r, t, e, n, i) {
    return this.normalizeResponse(r, t, e, n, i);
  }
  /** Called when normalizing a `createRecord` response. */
  normalizeCreateRecordResponse(r, t, e, n, i) {
    return this.normalizeResponse(r, t, e, n, i);
  }
  /** Called when normalizing an `updateRecord` response. */
  normalizeUpdateRecordResponse(r, t, e, n, i) {
    return this.normalizeResponse(r, t, e, n, i);
  }
  /** Called when normalizing a `deleteRecord` response. */
  normalizeDeleteRecordResponse(r, t, e, n, i) {
    return this.normalizeResponse(r, t, e, n, i);
  }
  /**
   * Writes a single attribute value into `json`.
   * Default: writes `snapshot.attr(key)` under the key returned by `keyForAttribute`.
   */
  serializeAttribute(r, t, e, n) {
    t[this.keyForAttribute(e)] = r.attr(e);
  }
  /**
   * Writes a `belongsTo` relationship id into `json`.
   * Default: writes the related record's id (or `null`) under `keyForRelationship`.
   */
  serializeBelongsTo(r, t, e) {
    const n = r.belongsTo(e.name, { id: !0 });
    t[this.keyForRelationship(e.name)] = n ?? null;
  }
  /**
   * Writes a `hasMany` relationship id array into `json`.
   * Default: writes the array of related ids under `keyForRelationship`.
   */
  serializeHasMany(r, t, e) {
    const n = r.hasMany(e.name, { ids: !0 });
    t[this.keyForRelationship(e.name)] = n ?? [];
  }
  /**
   * Extracts attribute values from a raw resource hash.
   * Returns a map of `{ propertyName: value }` using `keyForAttribute` to
   * locate the payload key.
   */
  extractAttributes(r, t) {
    const e = {};
    for (const [n] of r.attributes) {
      const i = this.keyForAttribute(n);
      i in t && (e[n] = t[i]);
    }
    return e;
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
    for (const [n, i] of r.relationships) {
      const a = this.keyForRelationship(n);
      if (!(a in t))
        continue;
      const s = t[a];
      if (i.kind === "belongsTo")
        s == null ? e[n] = { data: null } : (typeof s == "string" || typeof s == "number") && (e[n] = {
          data: { type: i.type, id: String(s) }
        });
      else if (Array.isArray(s)) {
        const o = s.filter((l) => typeof l == "string" || typeof l == "number").map((l) => ({ type: i.type, id: String(l) }));
        o.length === s.length && (e[n] = { data: o });
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
  extractErrors(r, t, e, n) {
    if (e && typeof e == "object" && "errors" in e) {
      const i = e.errors;
      if (i && typeof i == "object" && !Array.isArray(i)) {
        const a = {};
        for (const [s, o] of Object.entries(i))
          a[s] = Array.isArray(o) ? o.map(String) : [String(o)];
        return a;
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
  p as S
};
//# sourceMappingURL=Serializer-FxJbsZ50.js.map
