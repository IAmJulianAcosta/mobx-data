import { singleton as w, injectable as k, inject as m } from "tsyringe";
import { makeObservable as R, action as y, observable as p, computed as c, runInAction as d } from "mobx";
import { S as b } from "./SchemaService-DZwkFgZu.js";
import { b as A, A as v, a as M, M as F } from "./relationships-6nIWIH-v.js";
class _ {
  constructor() {
    this.buckets = /* @__PURE__ */ new Map(), R(this, {
      buckets: p.shallow,
      set: y,
      delete: y,
      clear: y
    });
  }
  /**
   * Returns the bucket for `modelName`, optionally creating it when absent.
   * Internal helper — not part of the public API.
   */
  bucket(e, s = !1) {
    let i = this.buckets.get(e);
    return !i && s && (i = p.map({}, { deep: !1 }), this.buckets.set(e, i)), i;
  }
  /** Adds or replaces the record with the given `id` under `modelName`. */
  set(e, s, i) {
    this.bucket(e, !0).set(s, i);
  }
  /**
   * Returns the record for `modelName` + `id`, or `null` when not found.
   */
  get(e, s) {
    var i;
    return ((i = this.bucket(e)) == null ? void 0 : i.get(s)) ?? null;
  }
  /** Returns `true` when a record exists for `modelName` + `id`. */
  has(e, s) {
    var i;
    return ((i = this.bucket(e)) == null ? void 0 : i.has(s)) ?? !1;
  }
  /**
   * Removes the record for `modelName` + `id`.
   * @returns `true` when the record existed and was deleted.
   */
  delete(e, s) {
    var i;
    return ((i = this.bucket(e)) == null ? void 0 : i.delete(s)) ?? !1;
  }
  /** Returns all records stored under `modelName` as an array. */
  all(e) {
    const s = this.bucket(e);
    return s ? Array.from(s.values()) : [];
  }
  /**
   * Clears all records for `modelName`, or all records across all types when
   * `modelName` is omitted.
   */
  clear(e) {
    var s;
    if (e)
      (s = this.bucket(e)) == null || s.clear();
    else
      for (const i of this.buckets.values())
        i.clear();
  }
  /**
   * Returns the number of records stored for `modelName`, or the total across
   * all types when `modelName` is omitted.
   */
  size(e) {
    var i;
    if (e)
      return ((i = this.bucket(e)) == null ? void 0 : i.size) ?? 0;
    let s = 0;
    for (const a of this.buckets.values())
      s += a.size;
    return s;
  }
}
class g {
  constructor(e) {
    this.updating = !1, this.opts = e, R(this, {
      resolved: c,
      updating: p,
      length: c,
      modelName: c
    });
  }
  /** Current record list, derived from the injected `source` function. */
  get resolved() {
    return this.opts.source();
  }
  /** `true` while a background `update()` call is in progress. */
  get isLoading() {
    return this.updating;
  }
  /** Alias for `isLoading`. */
  get isUpdating() {
    return this.updating;
  }
  /** Number of records in the array. */
  get length() {
    return this.resolved.length;
  }
  /** The registered model name for the records in this array. */
  get modelName() {
    return this.opts.modelName;
  }
  /** Returns the record at `index`, or `undefined`. */
  at(e) {
    return this.resolved[e];
  }
  /** Returns a plain array snapshot of all records. */
  toArray() {
    return [...this.resolved];
  }
  /** Maps over records. */
  map(e) {
    return this.resolved.map(e);
  }
  /** Filters records. */
  filter(e) {
    return this.resolved.filter(e);
  }
  /** Iterates records. */
  forEach(e) {
    this.resolved.forEach(e);
  }
  /** Returns `true` when `record` is in the array. */
  includes(e) {
    return this.resolved.includes(e);
  }
  /**
   * Triggers the `update` callback (if any) to refresh the array from the
   * adapter.  Sets `isLoading` while the request is in flight.
   */
  async update() {
    if (!this.opts.update)
      return this;
    this.updating = !0;
    try {
      await this.opts.update();
    } finally {
      this.updating = !1;
    }
    return this;
  }
  [Symbol.iterator]() {
    return this.resolved[Symbol.iterator]();
  }
}
class z extends g {
  constructor(e) {
    super(e), this.queryParams = e.query, this.metaData = e.meta ?? {}, this.linksData = e.links ?? {}, R(this, {
      metaData: p.ref,
      linksData: p.ref,
      meta: c,
      links: c,
      query: c
    });
  }
  /** Server-side metadata attached to the last response (e.g. pagination). */
  get meta() {
    return this.metaData;
  }
  /** Links attached to the last response. */
  get links() {
    return this.linksData;
  }
  /** The query parameters that produced this array. */
  get query() {
    return this.queryParams;
  }
  /** Called by the store to update `meta` after a successful query. */
  _setMeta(e) {
    this.metaData = e;
  }
  /** Called by the store to update `links` after a successful query. */
  _setLinks(e) {
    this.linksData = e;
  }
}
var D = Object.getOwnPropertyDescriptor, S = (t, e, s, i) => {
  for (var a = i > 1 ? void 0 : i ? D(e, s) : e, r = t.length - 1, o; r >= 0; r--)
    (o = t[r]) && (a = o(a) || a);
  return a;
}, E = (t, e) => (s, i) => e(s, i, t);
let u = class {
  constructor(t) {
    this.identityMap = new _(), this.adapters = /* @__PURE__ */ new Map(), this.serializers = /* @__PURE__ */ new Map(), this.newRecords = /* @__PURE__ */ new Map(), this.newRecordTypes = /* @__PURE__ */ new WeakMap(), this.relationshipCache = /* @__PURE__ */ new WeakMap(), this.pendingMembers = /* @__PURE__ */ new WeakMap(), this.schema = t;
  }
  static refEquals(t, e) {
    return t.id === e.id && t.type === e.type;
  }
  // --- registration ---
  /** Registers an adapter for a given model name (or `'application'` as a fallback). */
  registerAdapter(t, e) {
    this.adapters.set(t, e);
  }
  /** Registers a serializer for a given model name (or `'application'` as a fallback). */
  registerSerializer(t, e) {
    this.serializers.set(t, e);
  }
  /**
   * Returns the adapter for `modelName`, falling back to `'application'`.
   * @throws when no adapter is registered.
   */
  adapterFor(t) {
    const e = this.adapters.get(t) ?? this.adapters.get("application");
    if (!e)
      throw new Error(`No adapter registered for "${t}"`);
    return e;
  }
  /**
   * Returns the serializer for `modelName`, falling back to `'application'`.
   * @throws when no serializer is registered.
   */
  serializerFor(t) {
    const e = this.serializers.get(t) ?? this.serializers.get("application");
    if (!e)
      throw new Error(`No serializer registered for "${t}"`);
    return e;
  }
  // --- creating ---
  /**
   * Creates a new (unsaved) record of the given type with optional initial data.
   * The record is tracked in `newRecords` until it is saved or rolled back.
   *
   * @throws when `modelName` has not been registered with `SchemaService`.
   */
  createRecord(t, e = {}) {
    if (!this.schema.doesTypeExist(t))
      throw new Error(`Unknown model type: "${t}"`);
    const s = this.schema.modelFor(t), i = new s({ id: null, data: e, store: this });
    return this.trackNewRecord(t, i), i;
  }
  trackNewRecord(t, e) {
    let s = this.newRecords.get(t);
    s || (s = /* @__PURE__ */ new Set(), this.newRecords.set(t, s)), s.add(e), this.newRecordTypes.set(e, t);
  }
  untrackNewRecord(t) {
    var s;
    const e = this.newRecordTypes.get(t);
    e && ((s = this.newRecords.get(e)) == null || s.delete(t), this.newRecordTypes.delete(t));
  }
  // --- peeking ---
  /**
   * Synchronously returns a record from the identity map, or `null` when not
   * found.  Does not trigger a network request.
   */
  peekRecord(t, e) {
    const s = e == null ? null : String(e);
    return s === null ? null : this.identityMap.get(t, s) ?? null;
  }
  /**
   * Returns a live `RecordArray` backed by the identity map for `modelName`.
   * New (unsaved) records are included at the end.
   * Does not trigger a network request.
   */
  peekAll(t) {
    return new g({
      modelName: t,
      source: () => {
        const e = this.identityMap.all(t), s = this.newRecords.get(t);
        return !s || s.size === 0 ? e : [...e, ...s];
      }
    });
  }
  // --- push / normalize ---
  /**
   * Pushes a normalized document into the identity map.
   * Side-loaded (`included`) records are pushed first.
   *
   * @returns The primary record(s), or `null` for empty payloads.
   */
  push(t) {
    const e = t;
    if (e.included)
      for (const s of e.included)
        this.pushResource(s);
    return e.data === null || e.data === void 0 ? null : Array.isArray(e.data) ? e.data.map((s) => this.pushResource(s)) : this.pushResource(e.data);
  }
  /**
   * Normalizes a raw payload via the registered serializer and pushes the
   * result.  `modelName` is optional; when omitted the payload is pushed
   * directly without normalization.
   */
  pushPayload(t, e) {
    let s, i;
    typeof t == "string" ? (s = t, i = e) : (s = null, i = t);
    const a = s ? this.serializerFor(s).normalizeResponse(
      this,
      this.schema.modelFor(s),
      i,
      null,
      "pushPayload"
    ) : i;
    this.push(a);
  }
  /**
   * Normalizes a raw payload for `modelName` via the registered serializer
   * and returns the `NormalizedDocument` without pushing it.
   */
  normalize(t, e) {
    return this.serializerFor(t).normalizeResponse(
      this,
      this.schema.modelFor(t),
      e,
      null,
      "normalize"
    );
  }
  /**
   * Inserts or merges a single normalized resource into the identity map.
   * - Existing record → calls `_applyServerData` to merge attributes and
   *   relationships in place (preserving the live reference).
   * - New record → instantiates via `Model.push` and sets it in the map.
   *
   * @throws when `type` has not been registered or `id` is `null`.
   */
  pushResource(t) {
    const { type: e, id: s } = t;
    if (!this.schema.doesTypeExist(e))
      throw new Error(`Unknown model type: "${e}"`);
    if (s === null)
      throw new Error(`Cannot push a resource of type "${e}" without an id`);
    const i = this.identityMap.get(e, s);
    if (i)
      return d(() => {
        i._applyServerData(null, t.attributes ?? {}, t.relationships);
      }), this.trackInverseForResource(i, t), i;
    const a = this.schema.modelFor(e), r = A.push.call(a, {
      id: s,
      data: t.attributes ?? {},
      relationships: t.relationships,
      store: this
    });
    return this.identityMap.set(e, s, r), this.trackInverseForResource(r, t), r;
  }
  /**
   * After pushing a resource, updates the inverse side of every declared
   * inverse relationship so both sides stay consistent.
   */
  trackInverseForResource(t, e) {
    if (e.relationships)
      for (const [s, i] of Object.entries(e.relationships)) {
        const a = this.schema.relationshipsDefinitionFor(t.modelName).get(s);
        if (!a || !a.options.inverse || !i.data)
          continue;
        const r = Array.isArray(i.data) ? i.data : [i.data];
        for (const o of r)
          this.addInverse(o.type, o.id, a.options.inverse, t);
      }
  }
  /**
   * Adds `inverseRecord` to the inverse relationship on `targetType:targetId`.
   * No-ops when the target record is not in the identity map.
   */
  addInverse(t, e, s, i) {
    const a = this.identityMap.get(t, e);
    if (!a)
      return;
    const o = this.schema.relationshipsDefinitionFor(t).get(s);
    if (!o)
      return;
    const n = a._getRelationshipRef(s), h = { type: i.modelName, id: i.id };
    d(() => {
      if (o.kind === "hasMany") {
        const l = n != null && n.data && Array.isArray(n.data) ? n.data : [];
        l.some((f) => u.refEquals(f, h)) || a._setRelationshipRef(s, { data: [...l, h] });
      } else
        a._setRelationshipRef(s, { data: h });
    });
  }
  /**
   * Removes `inverseRecord` from the inverse relationship on `targetType:targetId`.
   * No-ops when the target record is not in the identity map.
   */
  removeInverse(t, e, s, i) {
    const a = this.identityMap.get(t, e);
    if (!a)
      return;
    const o = this.schema.relationshipsDefinitionFor(t).get(s);
    if (!o)
      return;
    const n = a._getRelationshipRef(s);
    d(() => {
      if (o.kind === "hasMany") {
        const l = (n != null && n.data && Array.isArray(n.data) ? n.data : []).filter((f) => !(f.id === i.id && f.type === i.modelName));
        a._setRelationshipRef(s, { data: l });
      } else
        a._setRelationshipRef(s, { data: null });
    });
  }
  // --- unload ---
  /**
   * Removes a record from the identity map and clears its relationship cache.
   * Called by `record.unloadRecord()` and internally after `deleteRecord`.
   */
  unloadRecord(t) {
    t.id !== null && this.identityMap.delete(t.modelName, t.id), this.untrackNewRecord(t), this.relationshipCache.delete(t);
  }
  /**
   * Unloads all records for `modelName`, or all records across all types when
   * `modelName` is omitted.
   */
  unloadAll(t) {
    var e;
    if (t) {
      for (const s of this.identityMap.all(t))
        this.relationshipCache.delete(s);
      this.identityMap.clear(t), (e = this.newRecords.get(t)) == null || e.clear();
    } else
      this.identityMap.clear(), this.newRecords.clear();
  }
  // --- find ---
  /**
   * Finds a single record by id.  Returns the cached record immediately when
   * `options.reload` is not set; otherwise re-fetches.
   */
  async findRecord(t, e, s = {}) {
    const i = this.peekRecord(t, e);
    if (i && !s.reload && !s.include)
      return i;
    const a = this.adapterFor(t), r = i ? this.createSnapshot(i) : this.createEmptySnapshot(t, e), o = s.include ? { include: s.include, adapterOptions: s.adapterOptions } : s.adapterOptions ? { adapterOptions: s.adapterOptions } : void 0, n = await a.findRecord(this, t, e, r, o), h = this.serializerFor(t).normalizeResponse(
      this,
      this.schema.modelFor(t),
      n,
      e,
      "findRecord"
    );
    return this.push(h);
  }
  /**
   * Fetches all records of `modelName` from the server and returns a
   * `RecordArray` backed by the identity map.
   */
  async findAll(t, e = {}) {
    const s = this.adapterFor(t), i = e.include ? { include: e.include, adapterOptions: e.adapterOptions } : e.adapterOptions ? { adapterOptions: e.adapterOptions } : void 0, a = await s.findAll(this, t, null, [], i), r = this.serializerFor(t).normalizeResponse(
      this,
      this.schema.modelFor(t),
      a,
      null,
      "findAll"
    );
    return this.push(r), this.peekAll(t);
  }
  /**
   * Executes an adapter query and returns an `AdapterPopulatedRecordArray`
   * whose `update()` method re-issues the same query.
   */
  async query(t, e) {
    const s = [], i = new z({
      modelName: t,
      query: e,
      source: () => s.map((a) => this.peekRecord(t, a)).filter((a) => a !== null),
      update: async () => {
        await this.runQuery(t, e, i, s);
      }
    });
    return await this.runQuery(t, e, i, s), i;
  }
  async runQuery(t, e, s, i) {
    const r = await this.adapterFor(t).query(this, t, e, s), o = this.serializerFor(t).normalizeResponse(
      this,
      this.schema.modelFor(t),
      r,
      null,
      "query"
    );
    if (this.push(o), i.length = 0, Array.isArray(o.data))
      for (const n of o.data)
        n.id && i.push(n.id);
    o.meta && s._setMeta(o.meta), o.links && s._setLinks(o.links);
  }
  /**
   * Executes an adapter query that returns at most one record.
   * Returns `null` when the adapter returns an empty payload.
   */
  async queryRecord(t, e) {
    const i = await this.adapterFor(t).queryRecord(this, t, e), a = this.serializerFor(t).normalizeResponse(
      this,
      this.schema.modelFor(t),
      i,
      null,
      "queryRecord"
    ), r = this.push(a);
    return Array.isArray(r) ? r[0] ?? null : r ?? null;
  }
  // --- save / delete / reload from Model ---
  /**
   * Persists a record to the server.
   * - New records → `adapter.createRecord` (POST)
   * - Existing dirty records → `adapter.updateRecord` (PUT) by default
   * - With `{ patch: true }` → `adapter.patchRecord` (PATCH, partial payload)
   *
   * After the response is received the server data is applied back to the
   * record via `_applyServerData` so it transitions to `saved`.
   */
  async saveRecord(t, e = {}) {
    const s = this.adapterFor(t.modelName), i = this.createSnapshot(t), { isNew: a } = t;
    let r;
    a ? r = await s.createRecord(this, t.modelName, i) : e.patch && s.patchRecord ? r = await s.patchRecord(this, t.modelName, i) : r = await s.updateRecord(this, t.modelName, i);
    const o = this.serializerFor(t.modelName).normalizeResponse(
      this,
      this.schema.modelFor(t.modelName),
      r,
      t.id,
      a ? "createRecord" : "updateRecord"
    ), n = o.data;
    if (n) {
      const h = n.id ?? t.id;
      d(() => {
        t._applyServerData(h, n.attributes ?? {}, n.relationships);
      }), a && h && (this.untrackNewRecord(t), this.identityMap.set(t.modelName, h, t));
    }
    if (o.included)
      for (const h of o.included)
        this.pushResource(h);
    return t;
  }
  /**
   * Issues a DELETE request and unloads the record from the identity map.
   */
  async deleteRecord(t) {
    const e = this.adapterFor(t.modelName), s = this.createSnapshot(t);
    return await e.deleteRecord(this, t.modelName, s), this.unloadRecord(t), t;
  }
  /**
   * Re-fetches a record from the server and merges the response into the
   * existing instance.
   */
  async reloadRecord(t) {
    if (!t.id)
      throw new Error("Cannot reload a record without an id");
    const e = this.adapterFor(t.modelName), s = this.createSnapshot(t), i = await e.findRecord(this, t.modelName, t.id, s), a = this.serializerFor(t.modelName).normalizeResponse(
      this,
      this.schema.modelFor(t.modelName),
      i,
      t.id,
      "findRecord"
    );
    return this.push(a), t;
  }
  // --- snapshot ---
  /**
   * Creates a `Snapshot` for a live record.
   * The snapshot reads directly from the record's internal state so it
   * reflects the current (possibly dirty) values.
   */
  createSnapshot(t) {
    const { modelName: e } = t, s = this.schema.attributesDefinitionFor(e), i = this.schema.relationshipsDefinitionFor(e), a = t;
    return {
      id: t.id,
      modelName: e,
      record: t,
      attr: (r) => a._data[r],
      belongsTo: (r, o) => {
        const n = a._getRelationshipRef(r);
        return !(n != null && n.data) || Array.isArray(n.data) ? null : o != null && o.id ? n.data.id : this.peekRecord(n.data.type, n.data.id);
      },
      hasMany: (r, o) => {
        const n = a._getRelationshipRef(r), h = n != null && n.data && Array.isArray(n.data) ? n.data : [];
        return o != null && o.ids ? h.map((l) => l.id) : h.map((l) => this.peekRecord(l.type, l.id)).filter((l) => l !== null);
      },
      changedAttributes: () => a.changedAttributes(),
      eachAttribute: (r) => {
        for (const [o, n] of s)
          r(o, n);
      },
      eachRelationship: (r) => {
        for (const [o, n] of i)
          r(o, n);
      }
    };
  }
  /**
   * Creates a placeholder `Snapshot` for a record that is not yet in the
   * identity map (used when fetching a record that isn't cached).
   */
  createEmptySnapshot(t, e) {
    const s = this.schema.attributesDefinitionFor(t), i = this.schema.relationshipsDefinitionFor(t);
    return {
      id: e,
      modelName: t,
      record: null,
      attr: () => {
      },
      belongsTo: () => null,
      hasMany: () => [],
      changedAttributes: () => ({}),
      eachAttribute: (a) => {
        for (const [r, o] of s)
          a(r, o);
      },
      eachRelationship: (a) => {
        for (const [r, o] of i)
          a(r, o);
      }
    };
  }
  // --- relationship resolution (called by Model) ---
  getRelationshipCache(t, e) {
    var s;
    return (s = this.relationshipCache.get(t)) == null ? void 0 : s.get(e);
  }
  setRelationshipCache(t, e, s) {
    let i = this.relationshipCache.get(t);
    i || (i = /* @__PURE__ */ new Map(), this.relationshipCache.set(t, i)), i.set(e, s);
  }
  /**
   * Called by the `Model` relationship getter to resolve a relationship.
   *
   * - **Async** `belongsTo` → returns an `AsyncBelongsTo` wrapper.
   * - **Async** `hasMany`   → returns an `AsyncHasMany` wrapper.
   * - **Sync** `belongsTo`  → peeks the related record from the identity map.
   * - **Sync** `hasMany`    → returns a `ManyArray` backed by the store.
   *
   * Results are cached per record + name so the same proxy is returned on
   * repeated accesses (important for MobX observability).
   */
  resolveRelationship(t, e, s) {
    const i = s.options.async === !0, a = this.getRelationshipCache(t, e);
    if (a)
      return a;
    const r = {
      parent: t,
      name: e,
      meta: s,
      store: this
    };
    if (i) {
      if (s.kind === "belongsTo") {
        const h = new v(r);
        return this.setRelationshipCache(t, e, h), h;
      }
      const n = new M(r);
      return this.setRelationshipCache(t, e, n), n;
    }
    if (s.kind === "belongsTo") {
      const n = t._getRelationshipRef(e);
      return !(n != null && n.data) || Array.isArray(n.data) ? null : this.peekRecord(n.data.type, n.data.id);
    }
    const o = new F(r);
    return this.setRelationshipCache(t, e, o), o;
  }
  /**
   * Called by the `Model` `belongsTo` setter to update a relationship ref
   * and keep its inverse in sync.
   */
  setRelationshipValue(t, e, s, i) {
    if (s.kind !== "belongsTo")
      return;
    const a = t._getRelationshipRef(e), r = a != null && a.data && !Array.isArray(a.data) ? a.data : null;
    if (i == null) {
      d(() => {
        t._setRelationshipRef(e, { data: null });
      }), r && s.options.inverse && this.removeInverse(r.type, r.id, s.options.inverse, t);
      return;
    }
    const o = i, n = { type: o.modelName, id: o.id };
    d(() => {
      t._setRelationshipRef(e, { data: n });
    }), s.options.inverse && (r && !u.refEquals(r, n) && this.removeInverse(r.type, r.id, s.options.inverse, t), this.addInverse(n.type, n.id, s.options.inverse, t));
  }
  // --- hooks used by ManyArray ---
  /** Returns the raw relationship ref stored on `record` for `name`. */
  _getRelationshipRefFor(t, e) {
    return t._getRelationshipRef(e);
  }
  /** Returns any pending (unsaved) members for a `hasMany` relationship. */
  _getPendingMembers(t, e) {
    var s;
    return ((s = this.pendingMembers.get(t)) == null ? void 0 : s.get(e)) ?? [];
  }
  addPendingMember(t, e, s) {
    let i = this.pendingMembers.get(t);
    i || (i = /* @__PURE__ */ new Map(), this.pendingMembers.set(t, i));
    let a = i.get(e);
    a || (a = p.set(), i.set(e, a)), a.add(s);
  }
  removePendingMember(t, e, s) {
    var i, a;
    (a = (i = this.pendingMembers.get(t)) == null ? void 0 : i.get(e)) == null || a.delete(s);
  }
  /**
   * Appends `value` to the `hasMany` relationship ref on `record` and syncs
   * the inverse.  Unsaved records (`value.id === null`) are tracked as
   * "pending members" until they are persisted.
   */
  _hasManyAppend(t, e, s, i) {
    if (i.id === null) {
      if (this.addPendingMember(t, e, i), s.options.inverse) {
        const n = this.schema.relationshipsDefinitionFor(i.modelName).get(s.options.inverse);
        (n == null ? void 0 : n.kind) === "belongsTo" && d(() => {
          i._setRelationshipRef(s.options.inverse, {
            data: { type: t.modelName, id: t.id }
          });
        });
      }
      return;
    }
    const a = this._getRelationshipRefFor(t, e), r = a != null && a.data && Array.isArray(a.data) ? a.data : [], o = { type: i.modelName, id: i.id };
    r.some((n) => u.refEquals(n, o)) || d(() => {
      t._setRelationshipRef(e, { data: [...r, o] });
    }), s.options.inverse && this.addInverse(i.modelName, i.id, s.options.inverse, t);
  }
  /**
   * Removes `value` from the `hasMany` relationship ref on `record` and syncs
   * the inverse.  Pending members are removed from the pending set.
   */
  _hasManyRemove(t, e, s, i) {
    if (i.id === null) {
      this.removePendingMember(t, e, i);
      return;
    }
    const a = this._getRelationshipRefFor(t, e), o = (a != null && a.data && Array.isArray(a.data) ? a.data : []).filter(
      (n) => !(n.id === i.id && n.type === i.modelName)
    );
    d(() => {
      t._setRelationshipRef(e, { data: o });
    }), s.options.inverse && this.removeInverse(i.modelName, i.id, s.options.inverse, t);
  }
};
u = S([
  w(),
  k(),
  E(0, m(b))
], u);
export {
  z as A,
  _ as I,
  g as R,
  u as S
};
//# sourceMappingURL=Store-CLC0v7IQ.js.map
