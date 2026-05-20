class p {
  constructor() {
    this.primaryKey = "id";
  }
  // Per-operation normalization hooks — default to calling `normalizeResponse`.
  /** Called when normalizing a `findRecord` response. */
  normalizeFindRecordResponse(t, i, e, n, r) {
    return this.normalizeResponse(t, i, e, n, r);
  }
  /** Called when normalizing a `findAll` response. */
  normalizeFindAllResponse(t, i, e, n, r) {
    return this.normalizeResponse(t, i, e, n, r);
  }
  /** Called when normalizing a `query` response. */
  normalizeQueryResponse(t, i, e, n, r) {
    return this.normalizeResponse(t, i, e, n, r);
  }
  /** Called when normalizing a `queryRecord` response. */
  normalizeQueryRecordResponse(t, i, e, n, r) {
    return this.normalizeResponse(t, i, e, n, r);
  }
  /** Called when normalizing a `createRecord` response. */
  normalizeCreateRecordResponse(t, i, e, n, r) {
    return this.normalizeResponse(t, i, e, n, r);
  }
  /** Called when normalizing an `updateRecord` response. */
  normalizeUpdateRecordResponse(t, i, e, n, r) {
    return this.normalizeResponse(t, i, e, n, r);
  }
  /** Called when normalizing a `deleteRecord` response. */
  normalizeDeleteRecordResponse(t, i, e, n, r) {
    return this.normalizeResponse(t, i, e, n, r);
  }
  /**
   * Writes a single attribute value into `json`.
   * Default: writes `snapshot.attr(key)` under the key returned by `keyForAttribute`.
   */
  serializeAttribute(t, i, e, n) {
    i[this.keyForAttribute(e)] = t.attr(e);
  }
  /**
   * Writes a `belongsTo` relationship id into `json`.
   * Default: writes the related record's id (or `null`) under `keyForRelationship`.
   */
  serializeBelongsTo(t, i, e) {
    const n = t.belongsTo(e.name, { id: !0 });
    i[this.keyForRelationship(e.name)] = n ?? null;
  }
  /**
   * Writes a `hasMany` relationship id array into `json`.
   * Default: writes the array of related ids under `keyForRelationship`.
   */
  serializeHasMany(t, i, e) {
    const n = t.hasMany(e.name, { ids: !0 });
    i[this.keyForRelationship(e.name)] = n ?? [];
  }
  /**
   * Extracts attribute values from a raw resource hash.
   * Returns a map of `{ propertyName: value }` using `keyForAttribute` to
   * locate the payload key.
   */
  extractAttributes(t, i) {
    const e = {};
    for (const [n] of t.attributes) {
      const r = this.keyForAttribute(n);
      r in i && (e[n] = i[r]);
    }
    return e;
  }
  /**
   * Extracts all non-id, non-relationship fields from a raw payload.
   * Used for polymorphic models where the concrete child may have attributes
   * not declared on the abstract parent.
   */
  extractAllAttributes(t, i) {
    const e = /* @__PURE__ */ new Set();
    for (const [r] of t.relationships)
      e.add(this.keyForRelationship(r));
    const n = {};
    for (const [r, o] of Object.entries(i))
      r === this.primaryKey || e.has(r) || (n[r] = o);
    return n;
  }
  /**
   * Extracts relationship references from a raw resource hash.
   *
   * - `belongsTo`: raw id (string or number) → `{ data: { type, id } }`
   * - `hasMany`: array of raw ids → `{ data: [{ type, id }, …] }`
   *
   * Returns only the relationships whose payload keys are present in `resourceHash`.
   */
  extractRelationships(t, i) {
    const e = {};
    for (const [n, r] of t.relationships) {
      const o = this.keyForRelationship(n);
      if (!(o in i))
        continue;
      const s = i[o];
      if (r.kind === "belongsTo")
        s == null ? e[n] = { data: null } : (typeof s == "string" || typeof s == "number") && (e[n] = {
          data: { type: r.type, id: String(s) }
        });
      else if (Array.isArray(s)) {
        const a = s.filter((l) => typeof l == "string" || typeof l == "number").map((l) => ({ type: r.type, id: String(l) }));
        a.length === s.length && (e[n] = { data: a });
      }
    }
    return e;
  }
  /**
   * Extracts the primary key from a raw resource hash.
   * Returns `null` when the key is absent.
   */
  extractId(t, i) {
    const e = i[this.primaryKey];
    return e == null ? null : String(e);
  }
  /**
   * Extracts field-level validation errors from a server error payload.
   * Default: looks for `{ errors: { field: string | string[] } }`.
   * Returns an empty object when no recognisable error structure is found.
   */
  extractErrors(t, i, e, n) {
    if (e && typeof e == "object" && "errors" in e) {
      const r = e.errors;
      if (r && typeof r == "object" && !Array.isArray(r)) {
        const o = {};
        for (const [s, a] of Object.entries(r))
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
  keyForAttribute(t) {
    return t;
  }
  /**
   * Maps a camelCase relationship name to the payload key used by this format.
   * Default: identity (no transformation).
   */
  keyForRelationship(t) {
    return t;
  }
}
export {
  p as S
};
//# sourceMappingURL=Serializer-Ca6w_QNQ.js.map
