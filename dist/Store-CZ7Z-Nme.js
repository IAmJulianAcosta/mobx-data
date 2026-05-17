import { singleton as A, injectable as F, inject as _ } from "tsyringe";
import { makeObservable as b, action as w, observable as y, computed as u, runInAction as d } from "mobx";
import { S as m } from "./SchemaService-DZwkFgZu.js";
import { b as z, A as S, a as D, M as E } from "./relationships-BEXANmWg.js";
class C {
  constructor() {
    this._buckets = /* @__PURE__ */ new Map(), b(this, {
      _buckets: y.shallow,
      set: w,
      delete: w,
      clear: w
    });
  }
  /**
   * Returns the bucket for `modelName`, optionally creating it when absent.
   * Internal helper — not part of the public API.
   */
  bucket(e, s = !1) {
    let i = this._buckets.get(e);
    return !i && s && (i = y.map({}, { deep: !1 }), this._buckets.set(e, i)), i;
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
      for (const i of this._buckets.values())
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
    for (const n of this._buckets.values())
      s += n.size;
    return s;
  }
}
class k {
  constructor(e) {
    this.updating = !1, this.opts = e, b(this, {
      resolved: e.keepAlive ? u({ keepAlive: !0 }) : u,
      updating: y,
      length: u,
      modelName: u
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
class O extends k {
  constructor(e) {
    super(e), this.queryParams = e.query, this.metaData = e.meta ?? {}, this.linksData = e.links ?? {}, b(this, {
      metaData: y.ref,
      linksData: y.ref,
      meta: u,
      links: u,
      query: u
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
var q = Object.getOwnPropertyDescriptor, I = (t, e, s, i) => {
  for (var n = i > 1 ? void 0 : i ? q(e, s) : e, r = t.length - 1, o; r >= 0; r--)
    (o = t[r]) && (n = o(n) || n);
  return n;
}, P = (t, e) => (s, i) => e(s, i, t);
let f = class {
  constructor(t) {
    this.identityMap = new C(), this.adapters = /* @__PURE__ */ new Map(), this.serializers = /* @__PURE__ */ new Map(), this.newRecords = /* @__PURE__ */ new Map(), this.newRecordTypes = /* @__PURE__ */ new WeakMap(), this.relationshipCache = /* @__PURE__ */ new WeakMap(), this.pendingMembers = /* @__PURE__ */ new WeakMap(), this.coalescePending = /* @__PURE__ */ new Map(), this.coalesceScheduled = /* @__PURE__ */ new Set(), this.schema = t;
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
    return new k({
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
    const n = s ? this.serializerFor(s).normalizeResponse(
      this,
      this.schema.modelFor(s),
      i,
      null,
      "pushPayload"
    ) : i;
    this.push(n);
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
    const n = this.schema.modelFor(e), r = z.push.call(n, {
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
        const n = this.schema.relationshipsDefinitionFor(t.modelName).get(s);
        if (!n || !n.options.inverse || !i.data)
          continue;
        const r = Array.isArray(i.data) ? i.data : [i.data];
        for (const o of r)
          this.addInverse(o.type, o.id, n.options.inverse, t);
      }
  }
  /**
   * Adds `inverseRecord` to the inverse relationship on `targetType:targetId`.
   * No-ops when the target record is not in the identity map.
   */
  addInverse(t, e, s, i) {
    const n = this.identityMap.get(t, e);
    if (!n)
      return;
    const o = this.schema.relationshipsDefinitionFor(t).get(s);
    if (!o)
      return;
    const a = n._getRelationshipRef(s), h = { type: i.modelName, id: i.id };
    d(() => {
      if (o.kind === "hasMany") {
        const c = a != null && a.data && Array.isArray(a.data) ? a.data : [];
        c.some((l) => f.refEquals(l, h)) || n._setRelationshipRef(s, { data: [...c, h] });
      } else
        n._setRelationshipRef(s, { data: h });
    });
  }
  /**
   * Removes `inverseRecord` from the inverse relationship on `targetType:targetId`.
   * No-ops when the target record is not in the identity map.
   */
  removeInverse(t, e, s, i) {
    const n = this.identityMap.get(t, e);
    if (!n)
      return;
    const o = this.schema.relationshipsDefinitionFor(t).get(s);
    if (!o)
      return;
    const a = n._getRelationshipRef(s);
    d(() => {
      if (o.kind === "hasMany") {
        const c = (a != null && a.data && Array.isArray(a.data) ? a.data : []).filter((l) => !(l.id === i.id && l.type === i.modelName));
        n._setRelationshipRef(s, { data: c });
      } else
        n._setRelationshipRef(s, { data: null });
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
   *
   * When the adapter has `coalesceFindRequests: true` and `findMany` is
   * implemented, multiple concurrent `findRecord` calls for the same type
   * are batched into a single `findMany` network request.
   */
  async findRecord(t, e, s = {}) {
    const i = this.peekRecord(t, e);
    if (i && !s.reload && !s.include)
      return i;
    const n = this.adapterFor(t);
    if (n.coalesceFindRequests && n.findMany && !s.include)
      return this.scheduleCoalescedFind(t, e);
    const r = i ? this.createSnapshot(i) : this.createEmptySnapshot(t, e), o = s.include ? { include: s.include, adapterOptions: s.adapterOptions } : s.adapterOptions ? { adapterOptions: s.adapterOptions } : void 0, a = await n.findRecord(this, t, e, r, o), h = this.serializerFor(t).normalizeResponse(
      this,
      this.schema.modelFor(t),
      a,
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
    const s = this.adapterFor(t), i = e.include ? { include: e.include, adapterOptions: e.adapterOptions } : e.adapterOptions ? { adapterOptions: e.adapterOptions } : void 0, n = await s.findAll(this, t, null, [], i), r = this.serializerFor(t).normalizeResponse(
      this,
      this.schema.modelFor(t),
      n,
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
    const s = [], i = new O({
      modelName: t,
      query: e,
      source: () => s.map((n) => this.peekRecord(t, n)).filter((n) => n !== null),
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
      for (const a of o.data)
        a.id && i.push(a.id);
    o.meta && s._setMeta(o.meta), o.links && s._setLinks(o.links);
  }
  /**
   * Executes an adapter query that returns at most one record.
   * Returns `null` when the adapter returns an empty payload.
   */
  async queryRecord(t, e) {
    const i = await this.adapterFor(t).queryRecord(this, t, e), n = this.serializerFor(t).normalizeResponse(
      this,
      this.schema.modelFor(t),
      i,
      null,
      "queryRecord"
    ), r = this.push(n);
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
    const s = this.adapterFor(t.modelName), i = this.createSnapshot(t), { isNew: n } = t;
    let r;
    n ? r = await s.createRecord(this, t.modelName, i) : e.patch && s.patchRecord ? r = await s.patchRecord(this, t.modelName, i) : r = await s.updateRecord(this, t.modelName, i);
    const o = this.serializerFor(t.modelName).normalizeResponse(
      this,
      this.schema.modelFor(t.modelName),
      r,
      t.id,
      n ? "createRecord" : "updateRecord"
    ), a = o.data;
    if (a) {
      const h = a.id ?? t.id;
      d(() => {
        t._applyServerData(h, a.attributes ?? {}, a.relationships);
      }), n && h && (this.untrackNewRecord(t), this.identityMap.set(t.modelName, h, t));
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
    const e = this.adapterFor(t.modelName), s = this.createSnapshot(t), i = await e.findRecord(this, t.modelName, t.id, s), n = this.serializerFor(t.modelName).normalizeResponse(
      this,
      this.schema.modelFor(t.modelName),
      i,
      t.id,
      "findRecord"
    );
    return this.push(n), t;
  }
  // --- snapshot ---
  /**
   * Creates a `Snapshot` for a live record.
   * The snapshot reads directly from the record's internal state so it
   * reflects the current (possibly dirty) values.
   */
  createSnapshot(t) {
    const { modelName: e } = t, s = this.schema.attributesDefinitionFor(e), i = this.schema.relationshipsDefinitionFor(e), n = t;
    return {
      id: t.id,
      modelName: e,
      record: t,
      attr: (r) => n._data[r],
      belongsTo: (r, o) => {
        const a = n._getRelationshipRef(r);
        return !(a != null && a.data) || Array.isArray(a.data) ? null : o != null && o.id ? a.data.id : this.peekRecord(a.data.type, a.data.id);
      },
      hasMany: (r, o) => {
        const a = n._getRelationshipRef(r), h = a != null && a.data && Array.isArray(a.data) ? a.data : [];
        return o != null && o.ids ? h.map((c) => c.id) : h.map((c) => this.peekRecord(c.type, c.id)).filter((c) => c !== null);
      },
      changedAttributes: () => n.changedAttributes(),
      eachAttribute: (r) => {
        for (const [o, a] of s)
          r(o, a);
      },
      eachRelationship: (r) => {
        for (const [o, a] of i)
          r(o, a);
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
      eachAttribute: (n) => {
        for (const [r, o] of s)
          n(r, o);
      },
      eachRelationship: (n) => {
        for (const [r, o] of i)
          n(r, o);
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
    const i = s.options.async === !0, n = this.getRelationshipCache(t, e);
    if (n)
      return n;
    const r = {
      parent: t,
      name: e,
      meta: s,
      store: this
    };
    if (i) {
      if (s.kind === "belongsTo") {
        const h = new S(r);
        return this.setRelationshipCache(t, e, h), h;
      }
      const a = new D(r);
      return this.setRelationshipCache(t, e, a), a;
    }
    if (s.kind === "belongsTo") {
      const a = t._getRelationshipRef(e);
      return !(a != null && a.data) || Array.isArray(a.data) ? null : this.peekRecord(a.data.type, a.data.id);
    }
    const o = new E(r);
    return this.setRelationshipCache(t, e, o), o;
  }
  /**
   * Called by the `Model` `belongsTo` setter to update a relationship ref
   * and keep its inverse in sync.
   */
  setRelationshipValue(t, e, s, i) {
    if (s.kind !== "belongsTo")
      return;
    const n = t._getRelationshipRef(e), r = n != null && n.data && !Array.isArray(n.data) ? n.data : null;
    if (i == null) {
      d(() => {
        t._setRelationshipRef(e, { data: null });
      }), r && s.options.inverse && this.removeInverse(r.type, r.id, s.options.inverse, t);
      return;
    }
    const o = i, a = { type: o.modelName, id: o.id };
    d(() => {
      t._setRelationshipRef(e, { data: a });
    }), s.options.inverse && (r && !f.refEquals(r, a) && this.removeInverse(r.type, r.id, s.options.inverse, t), this.addInverse(a.type, a.id, s.options.inverse, t));
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
    let n = i.get(e);
    n || (n = y.set(), i.set(e, n)), n.add(s);
  }
  removePendingMember(t, e, s) {
    var i, n;
    (n = (i = this.pendingMembers.get(t)) == null ? void 0 : i.get(e)) == null || n.delete(s);
  }
  /**
   * Appends `value` to the `hasMany` relationship ref on `record` and syncs
   * the inverse.  Unsaved records (`value.id === null`) are tracked as
   * "pending members" until they are persisted.
   */
  _hasManyAppend(t, e, s, i) {
    if (i.id === null) {
      if (this.addPendingMember(t, e, i), s.options.inverse) {
        const a = this.schema.relationshipsDefinitionFor(i.modelName).get(s.options.inverse);
        (a == null ? void 0 : a.kind) === "belongsTo" && d(() => {
          i._setRelationshipRef(s.options.inverse, {
            data: { type: t.modelName, id: t.id }
          });
        });
      }
      return;
    }
    const n = this._getRelationshipRefFor(t, e), r = n != null && n.data && Array.isArray(n.data) ? n.data : [], o = { type: i.modelName, id: i.id };
    r.some((a) => f.refEquals(a, o)) || d(() => {
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
    const n = this._getRelationshipRefFor(t, e), o = (n != null && n.data && Array.isArray(n.data) ? n.data : []).filter(
      (a) => !(a.id === i.id && a.type === i.modelName)
    );
    d(() => {
      t._setRelationshipRef(e, { data: o });
    }), s.options.inverse && this.removeInverse(i.modelName, i.id, s.options.inverse, t);
  }
  scheduleCoalescedFind(t, e) {
    return new Promise((s, i) => {
      let n = this.coalescePending.get(t);
      n || (n = /* @__PURE__ */ new Map(), this.coalescePending.set(t, n));
      let r = n.get(e);
      r || (r = [], n.set(e, r)), r.push({ resolve: s, reject: i }), this.coalesceScheduled.has(t) || (this.coalesceScheduled.add(t), queueMicrotask(() => this.flushCoalescedFind(t)));
    });
  }
  async flushCoalescedFind(t) {
    this.coalesceScheduled.delete(t);
    const e = this.coalescePending.get(t);
    if (!e || e.size === 0)
      return;
    const s = new Map(e);
    e.clear();
    const i = Array.from(s.keys()), n = this.adapterFor(t);
    try {
      const r = i.map((h) => {
        const c = this.peekRecord(t, h);
        return c ? this.createSnapshot(c) : this.createEmptySnapshot(t, h);
      }), o = await n.findMany(this, t, i, r), a = this.serializerFor(t).normalizeResponse(
        this,
        this.schema.modelFor(t),
        o,
        null,
        "findMany"
      );
      this.push(a);
      for (const h of i) {
        const c = this.peekRecord(t, h), l = s.get(h);
        if (l)
          for (const p of l)
            c ? p.resolve(c) : p.reject(new Error(`Record not found after findMany: ${t}:${h}`));
      }
    } catch (r) {
      for (const o of s.values())
        for (const a of o)
          a.reject(r);
    }
  }
  // --- liveQuery ---
  /**
   * Returns a reactive `RecordArray` that auto-updates whenever records matching
   * the predicate are added, removed, or mutated in the identity map.
   *
   * The underlying computed uses `keepAlive: true` so it remains cached even
   * without active MobX observers — useful for long-lived filtered views.
   *
   * @param modelName - The registered model type to query.
   * @param predicate - Filter function applied to each record of `modelName`.
   * @returns A live `RecordArray` containing only records that satisfy `predicate`.
   */
  liveQuery(t, e) {
    return new k({
      modelName: t,
      keepAlive: !0,
      source: () => {
        const s = this.identityMap.all(t), i = this.newRecords.get(t);
        return (i && i.size > 0 ? [...s, ...i] : s).filter(e);
      }
    });
  }
  // --- optimisticUpdate ---
  /**
   * Applies attribute changes to a record immediately (optimistically), then
   * executes `persistFn`.  If `persistFn` throws, the record is automatically
   * rolled back to its state before the optimistic update.
   *
   * @param record - The record to update optimistically.
   * @param optimisticAttributes - Attributes to apply before persistence.
   * @param persistFn - Async function that persists the change (e.g. `record.save()`).
   * @returns The record on success.
   * @throws Re-throws the error from `persistFn` after rollback.
   */
  async optimisticUpdate(t, e, s) {
    const i = t, n = { ...i._data };
    d(() => {
      Object.assign(i._data, e);
    });
    try {
      return await s(), t;
    } catch (r) {
      throw d(() => {
        for (const [o, a] of Object.entries(n))
          i._data[o] = a;
      }), r;
    }
  }
  // --- runInTransaction ---
  /**
   * Executes multiple store mutations as a single MobX action, guaranteeing
   * that observers (and therefore UI renders) react only once — after all
   * mutations have been applied.
   *
   * @param callback - Synchronous function containing one or more store mutations.
   */
  runInTransaction(t) {
    d(t);
  }
  // --- SSR: serialize / hydrate ---
  /**
   * Produces a JSON-serializable snapshot of all records in the identity map.
   * Designed for server-side rendering: serialize on the server, transfer as
   * JSON, then `hydrate()` on the client to restore the full store state
   * without network requests.
   *
   * @param options.exclude - Per-model-type list of attribute keys to omit
   *   (e.g. `{ user: ['password', 'token'] }`) to prevent leaking sensitive
   *   data in SSR payloads.
   * @returns A snapshot object safe to pass through `JSON.stringify`.
   */
  serialize(t = {}) {
    var i;
    const e = {}, s = this.identityMap._buckets;
    for (const [n, r] of s) {
      const o = (i = t.exclude) == null ? void 0 : i[n], a = [];
      for (const [h, c] of r) {
        const l = c;
        let p;
        if (o && o.length > 0) {
          p = {};
          for (const [R, g] of Object.entries(l._data))
            o.includes(R) || (p[R] = g);
        } else
          p = { ...l._data };
        const M = {
          id: h,
          attributes: p
        };
        if (l._relationships && l._relationships.size > 0) {
          const R = {};
          for (const [g, v] of l._relationships)
            R[g] = v;
          M.relationships = R;
        }
        a.push(M);
      }
      a.length > 0 && (e[n] = a);
    }
    return { records: e };
  }
  /**
   * Restores records from a snapshot produced by `serialize()` into this store
   * instance.  All records are pushed into the identity map in `loaded.saved`
   * state — no network requests are issued.
   *
   * @param snapshot - A snapshot object previously returned by `serialize()`.
   */
  hydrate(t) {
    d(() => {
      for (const [e, s] of Object.entries(t.records))
        for (const i of s)
          this.pushResource({
            type: e,
            id: i.id,
            attributes: i.attributes,
            relationships: i.relationships
          });
    });
  }
  /**
   * Factory method that creates a new `Store` and immediately hydrates it from
   * the given snapshot.  Convenience for SSR client-side bootstrap.
   *
   * @param schema - SchemaService with all model types registered.
   * @param snapshot - A snapshot object previously returned by `serialize()`.
   * @returns A fully populated `Store` instance ready for use.
   */
  static hydrate(t, e) {
    const s = new f(t);
    return s.hydrate(e), s;
  }
};
f = I([
  A(),
  F(),
  P(0, _(m))
], f);
export {
  O as A,
  C as I,
  k as R,
  f as S
};
//# sourceMappingURL=Store-CZ7Z-Nme.js.map
