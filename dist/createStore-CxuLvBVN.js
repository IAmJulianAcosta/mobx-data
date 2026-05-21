import "reflect-metadata";
import { S as z } from "./SchemaService-C6OJhSg-.js";
import { singleton as T, injectable as C, inject as I } from "tsyringe";
import { makeObservable as M, action as v, observable as g, computed as f, runInAction as u } from "mobx";
import { b as q, A as $, a as P, M as x } from "./relationships-DvSi8fVN.js";
import { e as F, p as _, R as N } from "./RestAdapter-CYInlScn.js";
import { M as R } from "./MdqlMemoryExecutor-ClRyEFJj.js";
import { J as j } from "./JsonSerializer-CFqo6GjC.js";
class L {
  constructor() {
    this._buckets = /* @__PURE__ */ new Map(), M(this, {
      _buckets: g.shallow,
      set: v,
      delete: v,
      clear: v
    });
  }
  /**
   * Returns the bucket for `modelName`, optionally creating it when absent.
   * Internal helper — not part of the public API.
   */
  bucket(t, s = !1) {
    let i = this._buckets.get(t);
    return !i && s && (i = g.map({}, { deep: !1 }), this._buckets.set(t, i)), i;
  }
  /** Adds or replaces the record with the given `id` under `modelName`. */
  set(t, s, i) {
    this.bucket(t, !0).set(s, i);
  }
  /**
   * Returns the record for `modelName` + `id`, or `null` when not found.
   */
  get(t, s) {
    var i;
    return ((i = this.bucket(t)) == null ? void 0 : i.get(s)) ?? null;
  }
  /** Returns `true` when a record exists for `modelName` + `id`. */
  has(t, s) {
    var i;
    return ((i = this.bucket(t)) == null ? void 0 : i.has(s)) ?? !1;
  }
  /**
   * Removes the record for `modelName` + `id`.
   * @returns `true` when the record existed and was deleted.
   */
  delete(t, s) {
    var i;
    return ((i = this.bucket(t)) == null ? void 0 : i.delete(s)) ?? !1;
  }
  /** Returns all records stored under `modelName` as an array. */
  all(t) {
    const s = this.bucket(t);
    return s ? Array.from(s.values()) : [];
  }
  /**
   * Clears all records for `modelName`, or all records across all types when
   * `modelName` is omitted.
   */
  clear(t) {
    var s;
    if (t)
      (s = this.bucket(t)) == null || s.clear();
    else
      for (const i of this._buckets.values())
        i.clear();
  }
  /**
   * Returns the number of records stored for `modelName`, or the total across
   * all types when `modelName` is omitted.
   */
  size(t) {
    var i;
    if (t)
      return ((i = this.bucket(t)) == null ? void 0 : i.size) ?? 0;
    let s = 0;
    for (const r of this._buckets.values())
      s += r.size;
    return s;
  }
}
class A {
  constructor(t) {
    this.updating = !1, this.opts = t, M(this, {
      resolved: t.keepAlive ? f({ keepAlive: !0 }) : f,
      updating: g,
      length: f,
      modelName: f
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
  at(t) {
    return this.resolved[t];
  }
  /** Returns a plain array snapshot of all records. */
  toArray() {
    return [...this.resolved];
  }
  /** Maps over records. */
  map(t) {
    return this.resolved.map(t);
  }
  /** Filters records. */
  filter(t) {
    return this.resolved.filter(t);
  }
  /** Iterates records. */
  forEach(t) {
    this.resolved.forEach(t);
  }
  /** Returns `true` when `record` is in the array. */
  includes(t) {
    return this.resolved.includes(t);
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
class Q extends A {
  constructor(t) {
    super(t), this.queryParams = t.query, this.metaData = t.meta ?? {}, this.linksData = t.links ?? {}, M(this, {
      metaData: g.ref,
      linksData: g.ref,
      meta: f,
      links: f,
      query: f
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
  _setMeta(t) {
    this.metaData = t;
  }
  /** Called by the store to update `links` after a successful query. */
  _setLinks(t) {
    this.linksData = t;
  }
}
const S = [
  "equals",
  "notEquals",
  "in",
  "notIn",
  "isNull",
  "isNotNull"
], U = [
  ...S,
  "contains",
  "startsWith",
  "endsWith"
], O = [
  ...S,
  "greaterThan",
  "greaterThanOrEquals",
  "lessThan",
  "lessThanOrEquals",
  "between"
], G = {
  string: new Set(U),
  number: new Set(O),
  date: new Set(O),
  boolean: /* @__PURE__ */ new Set(["equals", "notEquals", "isNull", "isNotNull"])
}, E = /* @__PURE__ */ new Set([
  "equals",
  "notEquals",
  "in",
  "notIn",
  "isNull",
  "isNotNull",
  "contains",
  "startsWith",
  "endsWith",
  "greaterThan",
  "greaterThanOrEquals",
  "lessThan",
  "lessThanOrEquals",
  "between"
]);
class B extends Error {
  constructor(t) {
    const s = t.map((i) => `${i.path}: ${i.message}`);
    super(`MDQL validation failed: ${s.join("; ")}`), this.name = "MdqlValidationException", this.errors = t;
  }
}
class p {
  static validate(t, s) {
    const i = p.validateQuiet(t, s);
    if (i.length > 0)
      throw new B(i);
  }
  static validateQuiet(t, s) {
    const i = [];
    if (!s.doesTypeExist(t.modelName))
      return i.push({
        path: "modelName",
        message: `Unknown model type "${t.modelName}".`
      }), i;
    const r = s.attributesDefinitionFor(t.modelName), n = s.relationshipsDefinitionFor(t.modelName);
    p.validateFilterNode(
      t.filters,
      "filters",
      i,
      s,
      t.modelName
    );
    for (let o = 0; o < t.orderBy.length; o++) {
      const a = t.orderBy[o];
      a.field.includes(".") ? p.resolveFieldAttribute(a.field, t.modelName, s) || i.push({
        path: `orderBy[${o}]`,
        message: `Unknown attribute path "${a.field}".`
      }) : a.field !== "id" && !r.has(a.field) && i.push({
        path: `orderBy[${o}]`,
        message: `Unknown attribute "${a.field}" on "${t.modelName}".`
      });
    }
    for (const o of t.includes)
      n.has(o) || i.push({
        path: "includes",
        message: `Unknown relationship "${o}" on "${t.modelName}".`
      });
    return t.limit !== null && (!Number.isInteger(t.limit) || t.limit < 1) && i.push({
      path: "limit",
      message: "Limit must be a positive integer."
    }), t.offset !== null && (!Number.isInteger(t.offset) || t.offset < 0) && i.push({
      path: "offset",
      message: "Offset must be a non-negative integer."
    }), i;
  }
  static resolveFieldAttribute(t, s, i) {
    const r = t.split(".");
    if (r.length === 1)
      return t === "id" ? { name: "id", type: "string" } : i.attributesDefinitionFor(s).get(t) ?? null;
    let n = s;
    for (let l = 0; l < r.length - 1; l++) {
      const c = i.relationshipsDefinitionFor(n).get(r[l]);
      if (!c || (n = c.type, !i.doesTypeExist(n)))
        return null;
    }
    const o = r[r.length - 1];
    return o === "id" ? { name: "id", type: "string" } : i.attributesDefinitionFor(n).get(o) ?? null;
  }
  static validateFilterNode(t, s, i, r, n) {
    if (t.kind === "condition") {
      const o = p.resolveFieldAttribute(t.field, n, r);
      if (!o) {
        const l = t.field.includes(".") ? `Unknown attribute path "${t.field}".` : `Unknown attribute "${t.field}".`;
        i.push({ path: s, message: l });
        return;
      }
      (o.type ? G[o.type] ?? E : E).has(t.operator) || i.push({
        path: s,
        message: `Operator "${t.operator}" is not valid for type "${o.type}".`
      }), t.operator === "between" && (!Array.isArray(t.value) || t.value.length !== 2) && i.push({
        path: s,
        message: 'Operator "between" requires a value of [min, max].'
      }), (t.operator === "in" || t.operator === "notIn") && (Array.isArray(t.value) || i.push({
        path: s,
        message: `Operator "${t.operator}" requires an array value.`
      }));
      return;
    }
    for (let o = 0; o < t.children.length; o++)
      p.validateFilterNode(
        t.children[o],
        `${s}.${t.kind}[${o}]`,
        i,
        r,
        n
      );
  }
}
class w {
  constructor(t, s) {
    this.store = t, this.queryModelName = s, this.rootGroup = { kind: "and", children: [] }, this.orderByClauses = [], this.limitValue = null, this.offsetValue = null, this.includesList = [];
  }
  where(t, s, i) {
    const r = {
      kind: "condition",
      field: t,
      operator: s,
      value: i
    };
    return this.rootGroup.children.push(r), this;
  }
  whereEquals(t, s) {
    return this.where(t, "equals", s);
  }
  whereContains(t, s) {
    return this.where(t, "contains", s);
  }
  and(t) {
    const s = new w(this.store, this.queryModelName);
    t(s);
    const i = { kind: "and", children: [...s.rootGroup.children] };
    return this.rootGroup.children.push(i), this;
  }
  or(t) {
    const s = new w(this.store, this.queryModelName);
    t(s);
    const i = { kind: "or", children: [...s.rootGroup.children] };
    return this.rootGroup.children.push(i), this;
  }
  not(t) {
    const s = new w(this.store, this.queryModelName);
    t(s);
    const i = { kind: "not", children: [...s.rootGroup.children] };
    return this.rootGroup.children.push(i), this;
  }
  orderBy(t, s = "asc") {
    return this.orderByClauses.push({ field: t, direction: s }), this;
  }
  limit(t) {
    return this.limitValue = t, this;
  }
  offset(t) {
    return this.offsetValue = t, this;
  }
  include(t) {
    return this.includesList.includes(t) || this.includesList.push(t), this;
  }
  toQueryObject() {
    return {
      modelName: this.queryModelName,
      filters: { kind: "and", children: [...this.rootGroup.children] },
      orderBy: [...this.orderByClauses],
      limit: this.limitValue,
      offset: this.offsetValue,
      includes: [...this.includesList]
    };
  }
  async toArray() {
    const t = this.toQueryObject();
    p.validate(t, this.store.schema);
    const s = this.store.peekAll(this.queryModelName).toArray();
    return R.executeMany(s, t);
  }
  async first() {
    const t = this.toQueryObject();
    p.validate(t, this.store.schema);
    const s = this.store.peekAll(this.queryModelName).toArray();
    return R.executeOne(s, t);
  }
  async count() {
    const t = this.toQueryObject();
    p.validate(t, this.store.schema);
    const s = this.store.peekAll(this.queryModelName).toArray();
    return R.count(s, t);
  }
  async exists() {
    const t = this.toQueryObject();
    p.validate(t, this.store.schema);
    const s = this.store.peekAll(this.queryModelName).toArray();
    return R.exists(s, t);
  }
  toLiveArray() {
    const t = this.toQueryObject();
    p.validate(t, this.store.schema);
    const s = R.compilePredicate(t);
    return this.store.liveQuery(this.queryModelName, s);
  }
}
var W = Object.getOwnPropertyDescriptor, H = (e, t, s, i) => {
  for (var r = i > 1 ? void 0 : i ? W(t, s) : t, n = e.length - 1, o; n >= 0; n--)
    (o = e[n]) && (r = o(r) || r);
  return r;
}, V = (e, t) => (s, i) => t(s, i, e);
let y = class {
  constructor(e) {
    this.identityMap = new L(), this.adapters = /* @__PURE__ */ new Map(), this.serializers = /* @__PURE__ */ new Map(), this.newRecords = /* @__PURE__ */ new Map(), this.newRecordTypes = /* @__PURE__ */ new WeakMap(), this.relationshipCache = /* @__PURE__ */ new WeakMap(), this.pendingMembers = /* @__PURE__ */ new WeakMap(), this._cache = null, this.coalescePending = /* @__PURE__ */ new Map(), this.coalesceScheduled = /* @__PURE__ */ new Set(), this.schema = e;
  }
  static refEquals(e, t) {
    return e.id === t.id && e.type === t.type;
  }
  // --- registration ---
  /** Registers an adapter for a given model name (or `'application'` as a fallback). */
  registerAdapter(e, t) {
    this.adapters.set(e, t);
  }
  /** Registers a serializer for a given model name (or `'application'` as a fallback). */
  registerSerializer(e, t) {
    this.serializers.set(e, t);
  }
  /** Registers a persistent cache layer (e.g. IndexedDB) for offline-first reads. */
  registerCache(e) {
    this._cache = e;
  }
  /**
   * Returns the adapter for `modelName`, falling back to `'application'`.
   * @throws when no adapter is registered.
   */
  adapterFor(e) {
    const t = this.adapters.get(e) ?? this.adapters.get("application");
    if (!t)
      throw new Error(`No adapter registered for "${e}"`);
    return t;
  }
  /**
   * Returns the serializer for `modelName`, falling back to `'application'`.
   * @throws when no serializer is registered.
   */
  serializerFor(e) {
    const t = this.serializers.get(e) ?? this.serializers.get("application");
    if (!t)
      throw new Error(`No serializer registered for "${e}"`);
    return t;
  }
  // --- creating ---
  /**
   * Creates a new (unsaved) record of the given type with optional initial data.
   * The record is tracked in `newRecords` until it is saved or rolled back.
   *
   * @throws when `modelName` has not been registered with `SchemaService`.
   */
  createRecord(e, t = {}) {
    if (!this.schema.doesTypeExist(e))
      throw new Error(`Unknown model type: "${e}"`);
    const s = this.schema.modelFor(e), i = new s({ id: null, data: t, store: this });
    return this.trackNewRecord(e, i), i;
  }
  trackNewRecord(e, t) {
    let s = this.newRecords.get(e);
    s || (s = /* @__PURE__ */ new Set(), this.newRecords.set(e, s)), s.add(t), this.newRecordTypes.set(t, e);
  }
  untrackNewRecord(e) {
    var s;
    const t = this.newRecordTypes.get(e);
    t && ((s = this.newRecords.get(t)) == null || s.delete(e), this.newRecordTypes.delete(e));
  }
  // --- peeking ---
  /**
   * Synchronously returns a record from the identity map, or `null` when not
   * found.  Does not trigger a network request.
   */
  peekRecord(e, t) {
    const s = t == null ? null : String(t);
    if (s === null)
      return null;
    const i = this.identityMap.get(e, s);
    if (i)
      return i;
    const r = this.schema.polymorphicRootFor(e);
    if (r) {
      const n = this.identityMap.get(r, s);
      if (n && n instanceof this.schema.modelFor(e))
        return n;
    }
    return null;
  }
  /**
   * Returns a live `RecordArray` backed by the identity map for `modelName`.
   * New (unsaved) records are included at the end.
   * Does not trigger a network request.
   */
  peekAll(e) {
    return new A({
      modelName: e,
      source: () => {
        const t = this.identityMap.all(e), s = this.newRecords.get(e);
        return !s || s.size === 0 ? t : [...t, ...s];
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
  push(e) {
    const t = e;
    if (t.included)
      for (const s of t.included)
        this.pushResource(s);
    return t.data === null || t.data === void 0 ? null : Array.isArray(t.data) ? t.data.map((s) => this.pushResource(s)) : this.pushResource(t.data);
  }
  /**
   * Normalizes a raw payload via the registered serializer and pushes the
   * result.  `modelName` is optional; when omitted the payload is pushed
   * directly without normalization.
   */
  pushPayload(e, t) {
    let s, i;
    typeof e == "string" ? (s = e, i = t) : (s = null, i = e);
    const r = s ? this.serializerFor(s).normalizeResponse(
      this,
      this.schema.modelFor(s),
      i,
      null,
      "pushPayload"
    ) : i;
    this.push(r);
  }
  /**
   * Normalizes a raw payload for `modelName` via the registered serializer
   * and returns the `NormalizedDocument` without pushing it.
   */
  normalize(e, t) {
    return this.serializerFor(e).normalizeResponse(
      this,
      this.schema.modelFor(e),
      t,
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
  pushResource(e) {
    const { type: t, id: s } = e;
    if (!this.schema.doesTypeExist(t))
      throw new Error(`Unknown model type: "${t}"`);
    if (s === null)
      throw new Error(`Cannot push a resource of type "${t}" without an id`);
    let i = t, r = this.schema.modelFor(t);
    const n = this.schema.resolveConcreteModel(
      t,
      e.attributes ?? {}
    );
    n && (r = n.modelClass, i = t);
    const o = this.schema.polymorphicRootFor(t);
    o && (i = o);
    const a = this.identityMap.get(i, s);
    if (a)
      return u(() => {
        a._applyServerData(null, e.attributes ?? {}, e.relationships);
      }), this.trackInverseForResource(a, e), a;
    const l = r, h = q.push.call(l, {
      id: s,
      data: e.attributes ?? {},
      relationships: e.relationships,
      store: this
    });
    return this.identityMap.set(i, s, h), this.trackInverseForResource(h, e), h;
  }
  /**
   * After pushing a resource, updates the inverse side of every declared
   * inverse relationship so both sides stay consistent.
   */
  trackInverseForResource(e, t) {
    if (t.relationships)
      for (const [s, i] of Object.entries(t.relationships)) {
        const r = this.schema.relationshipsDefinitionFor(e.modelName).get(s);
        if (!r || !r.options.inverse || !i.data)
          continue;
        const n = Array.isArray(i.data) ? i.data : [i.data];
        for (const o of n)
          this.addInverse(o.type, o.id, r.options.inverse, e);
      }
  }
  /**
   * Adds `inverseRecord` to the inverse relationship on `targetType:targetId`.
   * No-ops when the target record is not in the identity map.
   */
  addInverse(e, t, s, i) {
    const r = this.identityMap.get(e, t);
    if (!r)
      return;
    const o = this.schema.relationshipsDefinitionFor(e).get(s);
    if (!o)
      return;
    const a = r._getRelationshipRef(s), l = { type: i.modelName, id: i.id };
    u(() => {
      if (o.kind === "hasMany") {
        const h = a != null && a.data && Array.isArray(a.data) ? a.data : [];
        h.some((c) => y.refEquals(c, l)) || r._setRelationshipRef(s, { data: [...h, l] });
      } else
        r._setRelationshipRef(s, { data: l });
    });
  }
  /**
   * Removes `inverseRecord` from the inverse relationship on `targetType:targetId`.
   * No-ops when the target record is not in the identity map.
   */
  removeInverse(e, t, s, i) {
    const r = this.identityMap.get(e, t);
    if (!r)
      return;
    const o = this.schema.relationshipsDefinitionFor(e).get(s);
    if (!o)
      return;
    const a = r._getRelationshipRef(s);
    u(() => {
      if (o.kind === "hasMany") {
        const h = (a != null && a.data && Array.isArray(a.data) ? a.data : []).filter((c) => !(c.id === i.id && c.type === i.modelName));
        r._setRelationshipRef(s, { data: h });
      } else
        r._setRelationshipRef(s, { data: null });
    });
  }
  // --- unload ---
  /**
   * Removes a record from the identity map and clears its relationship cache.
   * Called by `record.unloadRecord()` and internally after `deleteRecord`.
   */
  unloadRecord(e) {
    e.id !== null && this.identityMap.delete(e.modelName, e.id), this.untrackNewRecord(e), this.relationshipCache.delete(e);
  }
  /**
   * Unloads all records for `modelName`, or all records across all types when
   * `modelName` is omitted.
   */
  unloadAll(e) {
    var t;
    if (e) {
      for (const s of this.identityMap.all(e))
        this.relationshipCache.delete(s);
      this.identityMap.clear(e), (t = this.newRecords.get(e)) == null || t.clear();
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
  async findRecord(e, t, s = {}) {
    const i = this.peekRecord(e, t);
    if (i && !s.reload && !s.include)
      return i;
    if (!s.reload && !s.include && this._cache) {
      const d = await this._cache.get(e, t);
      if (d)
        return this.push({
          data: {
            type: d.modelName,
            id: d.id,
            attributes: d.attributes,
            relationships: d.relationships
          }
        });
    }
    const r = this.adapterFor(e);
    if (r.coalesceFindRequests && r.findMany && !s.include)
      return this.scheduleCoalescedFind(e, t);
    const n = i ? this.createSnapshot(i) : this.createEmptySnapshot(e, t), o = s.include ? { include: s.include, adapterOptions: s.adapterOptions } : s.adapterOptions ? { adapterOptions: s.adapterOptions } : void 0, a = await r.findRecord(this, e, t, n, o), l = F(a), h = this.serializerFor(e).normalizeResponse(
      this,
      this.schema.modelFor(e),
      a,
      t,
      "findRecord"
    ), c = this.push(h);
    if (this._cache) {
      const d = l ? _(l) : null;
      d !== 0 && this.cacheNormalizedDocument(h, d ?? void 0);
    }
    return c;
  }
  /**
   * Fetches all records of `modelName` from the server and returns a
   * `RecordArray` backed by the identity map.
   */
  async findAll(e, t = {}) {
    const s = this.adapterFor(e), i = t.include ? { include: t.include, adapterOptions: t.adapterOptions } : t.adapterOptions ? { adapterOptions: t.adapterOptions } : void 0, r = await s.findAll(this, e, null, [], i), n = F(r), o = this.serializerFor(e).normalizeResponse(
      this,
      this.schema.modelFor(e),
      r,
      null,
      "findAll"
    );
    if (this.push(o), this._cache) {
      const a = n ? _(n) : null;
      a !== 0 && this.cacheNormalizedDocument(o, a ?? void 0);
    }
    return this.peekAll(e);
  }
  /**
   * Executes an adapter query and returns an `AdapterPopulatedRecordArray`
   * whose `update()` method re-issues the same query.
   */
  async query(e, t) {
    const s = [], i = new Q({
      modelName: e,
      query: t,
      source: () => s.map((r) => this.peekRecord(e, r)).filter((r) => r !== null),
      update: async () => {
        await this.runQuery(e, t, i, s);
      }
    });
    return await this.runQuery(e, t, i, s), i;
  }
  async runQuery(e, t, s, i) {
    const n = await this.adapterFor(e).query(this, e, t, s), o = this.serializerFor(e).normalizeResponse(
      this,
      this.schema.modelFor(e),
      n,
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
  async queryRecord(e, t) {
    const i = await this.adapterFor(e).queryRecord(this, e, t), r = this.serializerFor(e).normalizeResponse(
      this,
      this.schema.modelFor(e),
      i,
      null,
      "queryRecord"
    ), n = this.push(r);
    return Array.isArray(n) ? n[0] ?? null : n ?? null;
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
  async saveRecord(e, t = {}) {
    const s = this.adapterFor(e.modelName), { isNew: i } = e;
    i && this.schema.hasClientGeneratedIds(e.modelName) && e.id === null && (e.id = e._clientId);
    const r = this.createSnapshot(e);
    let n;
    i ? n = await s.createRecord(this, e.modelName, r) : t.patch && s.patchRecord ? n = await s.patchRecord(this, e.modelName, r) : n = await s.updateRecord(this, e.modelName, r);
    const o = this.serializerFor(e.modelName).normalizeResponse(
      this,
      this.schema.modelFor(e.modelName),
      n,
      e.id,
      i ? "createRecord" : "updateRecord"
    ), a = o.data;
    if (a) {
      const l = a.id ?? e.id;
      u(() => {
        e._applyServerData(l, a.attributes ?? {}, a.relationships);
      }), i && l && (this.untrackNewRecord(e), this.identityMap.set(e.modelName, l, e));
    }
    if (o.included)
      for (const l of o.included)
        this.pushResource(l);
    if (this._cache && e.id) {
      const l = e, h = {};
      for (const [c, d] of l._relationships)
        h[c] = d;
      this._cache.set(e.modelName, e.id, { ...l._data }, {
        relationships: Object.keys(h).length > 0 ? h : void 0
      });
    }
    return e;
  }
  /**
   * Issues a DELETE request and unloads the record from the identity map.
   */
  async deleteRecord(e) {
    const t = this.adapterFor(e.modelName), s = this.createSnapshot(e);
    return await t.deleteRecord(this, e.modelName, s), this._cache && e.id && this._cache.invalidate(e.modelName, e.id), this.unloadRecord(e), e;
  }
  /**
   * Re-fetches a record from the server and merges the response into the
   * existing instance.
   */
  async reloadRecord(e) {
    if (!e.id)
      throw new Error("Cannot reload a record without an id");
    const t = this.adapterFor(e.modelName), s = this.createSnapshot(e), i = await t.findRecord(this, e.modelName, e.id, s), r = this.serializerFor(e.modelName).normalizeResponse(
      this,
      this.schema.modelFor(e.modelName),
      i,
      e.id,
      "findRecord"
    );
    return this.push(r), e;
  }
  // --- snapshot ---
  /**
   * Creates a `Snapshot` for a live record.
   * The snapshot reads directly from the record's internal state so it
   * reflects the current (possibly dirty) values.
   */
  createSnapshot(e) {
    const { modelName: t } = e, s = this.schema.attributesDefinitionFor(t), i = this.schema.relationshipsDefinitionFor(t), r = e;
    return {
      id: e.id,
      clientId: e._clientId,
      modelName: t,
      record: e,
      attr: (n) => r._data[n],
      belongsTo: (n, o) => {
        const a = r._getRelationshipRef(n);
        return !(a != null && a.data) || Array.isArray(a.data) ? null : o != null && o.id ? a.data.id : this.peekRecord(a.data.type, a.data.id);
      },
      hasMany: (n, o) => {
        const a = r._getRelationshipRef(n), l = a != null && a.data && Array.isArray(a.data) ? a.data : [];
        return o != null && o.ids ? l.map((h) => h.id) : l.map((h) => this.peekRecord(h.type, h.id)).filter((h) => h !== null);
      },
      changedAttributes: () => r.changedAttributes(),
      eachAttribute: (n) => {
        for (const [o, a] of s)
          n(o, a);
      },
      eachRelationship: (n) => {
        for (const [o, a] of i)
          n(o, a);
      }
    };
  }
  /**
   * Creates a placeholder `Snapshot` for a record that is not yet in the
   * identity map (used when fetching a record that isn't cached).
   */
  createEmptySnapshot(e, t) {
    const s = this.schema.attributesDefinitionFor(e), i = this.schema.relationshipsDefinitionFor(e);
    return {
      id: t,
      clientId: "",
      modelName: e,
      record: null,
      attr: () => {
      },
      belongsTo: () => null,
      hasMany: () => [],
      changedAttributes: () => ({}),
      eachAttribute: (r) => {
        for (const [n, o] of s)
          r(n, o);
      },
      eachRelationship: (r) => {
        for (const [n, o] of i)
          r(n, o);
      }
    };
  }
  // --- relationship resolution (called by Model) ---
  getRelationshipCache(e, t) {
    var s;
    return (s = this.relationshipCache.get(e)) == null ? void 0 : s.get(t);
  }
  setRelationshipCache(e, t, s) {
    let i = this.relationshipCache.get(e);
    i || (i = /* @__PURE__ */ new Map(), this.relationshipCache.set(e, i)), i.set(t, s);
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
  resolveRelationship(e, t, s) {
    const i = s.options.async === !0, r = this.getRelationshipCache(e, t);
    if (r)
      return r;
    const n = {
      parent: e,
      name: t,
      meta: s,
      store: this
    };
    if (i) {
      if (s.kind === "belongsTo") {
        const l = new $(n);
        return this.setRelationshipCache(e, t, l), l;
      }
      const a = new P(n);
      return this.setRelationshipCache(e, t, a), a;
    }
    if (s.kind === "belongsTo") {
      const a = e._getRelationshipRef(t);
      return !(a != null && a.data) || Array.isArray(a.data) ? null : this.peekRecord(a.data.type, a.data.id);
    }
    const o = new x(n);
    return this.setRelationshipCache(e, t, o), o;
  }
  /**
   * Called by the `Model` `belongsTo` setter to update a relationship ref
   * and keep its inverse in sync.
   */
  setRelationshipValue(e, t, s, i) {
    if (s.kind !== "belongsTo")
      return;
    const r = e._getRelationshipRef(t), n = r != null && r.data && !Array.isArray(r.data) ? r.data : null;
    if (i == null) {
      u(() => {
        e._setRelationshipRef(t, { data: null });
      }), n && s.options.inverse && this.removeInverse(n.type, n.id, s.options.inverse, e);
      return;
    }
    const o = i, a = { type: o.modelName, id: o.id };
    u(() => {
      e._setRelationshipRef(t, { data: a });
    }), s.options.inverse && (n && !y.refEquals(n, a) && this.removeInverse(n.type, n.id, s.options.inverse, e), this.addInverse(a.type, a.id, s.options.inverse, e));
  }
  // --- hooks used by ManyArray ---
  /** Returns the raw relationship ref stored on `record` for `name`. */
  _getRelationshipRefFor(e, t) {
    return e._getRelationshipRef(t);
  }
  /** Returns any pending (unsaved) members for a `hasMany` relationship. */
  _getPendingMembers(e, t) {
    var s;
    return ((s = this.pendingMembers.get(e)) == null ? void 0 : s.get(t)) ?? [];
  }
  addPendingMember(e, t, s) {
    let i = this.pendingMembers.get(e);
    i || (i = /* @__PURE__ */ new Map(), this.pendingMembers.set(e, i));
    let r = i.get(t);
    r || (r = g.set(), i.set(t, r)), r.add(s);
  }
  removePendingMember(e, t, s) {
    var i, r;
    (r = (i = this.pendingMembers.get(e)) == null ? void 0 : i.get(t)) == null || r.delete(s);
  }
  /**
   * Appends `value` to the `hasMany` relationship ref on `record` and syncs
   * the inverse.  Unsaved records (`value.id === null`) are tracked as
   * "pending members" until they are persisted.
   */
  _hasManyAppend(e, t, s, i) {
    if (i.id === null) {
      if (this.addPendingMember(e, t, i), s.options.inverse) {
        const a = this.schema.relationshipsDefinitionFor(i.modelName).get(s.options.inverse);
        (a == null ? void 0 : a.kind) === "belongsTo" && u(() => {
          i._setRelationshipRef(s.options.inverse, {
            data: { type: e.modelName, id: e.id }
          });
        });
      }
      return;
    }
    const r = this._getRelationshipRefFor(e, t), n = r != null && r.data && Array.isArray(r.data) ? r.data : [], o = { type: i.modelName, id: i.id };
    n.some((a) => y.refEquals(a, o)) || u(() => {
      e._setRelationshipRef(t, { data: [...n, o] });
    }), s.options.inverse && this.addInverse(i.modelName, i.id, s.options.inverse, e);
  }
  /**
   * Removes `value` from the `hasMany` relationship ref on `record` and syncs
   * the inverse.  Pending members are removed from the pending set.
   */
  _hasManyRemove(e, t, s, i) {
    if (i.id === null) {
      this.removePendingMember(e, t, i);
      return;
    }
    const r = this._getRelationshipRefFor(e, t), o = (r != null && r.data && Array.isArray(r.data) ? r.data : []).filter(
      (a) => !(a.id === i.id && a.type === i.modelName)
    );
    u(() => {
      e._setRelationshipRef(t, { data: o });
    }), s.options.inverse && this.removeInverse(i.modelName, i.id, s.options.inverse, e);
  }
  // --- persistent cache helpers ---
  cacheNormalizedDocument(e, t) {
    const s = [];
    e.data && (Array.isArray(e.data) ? s.push(...e.data) : s.push(e.data)), e.included && s.push(...e.included);
    for (const i of s)
      i.id && this._cache.set(i.type, i.id, i.attributes ?? {}, {
        relationships: i.relationships,
        ttl: t
      });
  }
  scheduleCoalescedFind(e, t) {
    return new Promise((s, i) => {
      let r = this.coalescePending.get(e);
      r || (r = /* @__PURE__ */ new Map(), this.coalescePending.set(e, r));
      let n = r.get(t);
      n || (n = [], r.set(t, n)), n.push({ resolve: s, reject: i }), this.coalesceScheduled.has(e) || (this.coalesceScheduled.add(e), queueMicrotask(() => this.flushCoalescedFind(e)));
    });
  }
  async flushCoalescedFind(e) {
    this.coalesceScheduled.delete(e);
    const t = this.coalescePending.get(e), s = new Map(t);
    t.clear();
    const i = Array.from(s.keys()), r = this.adapterFor(e);
    try {
      const n = i.map((l) => {
        const h = this.peekRecord(e, l);
        return h ? this.createSnapshot(h) : this.createEmptySnapshot(e, l);
      }), o = await r.findMany(this, e, i, n), a = this.serializerFor(e).normalizeResponse(
        this,
        this.schema.modelFor(e),
        o,
        null,
        "findMany"
      );
      this.push(a);
      for (const l of i) {
        const h = this.peekRecord(e, l), c = s.get(l);
        if (c)
          for (const d of c)
            h ? d.resolve(h) : d.reject(new Error(`Record not found after findMany: ${e}:${l}`));
      }
    } catch (n) {
      for (const o of s.values())
        for (const a of o)
          a.reject(n);
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
  liveQuery(e, t) {
    return new A({
      modelName: e,
      keepAlive: !0,
      source: () => {
        const s = this.identityMap.all(e), i = this.newRecords.get(e);
        return (i && i.size > 0 ? [...s, ...i] : s).filter(t);
      }
    });
  }
  // --- select (MDQL) ---
  select(e) {
    if (!this.schema.doesTypeExist(e))
      throw new Error(`Unknown model type: "${e}"`);
    return new w(this, e);
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
  async optimisticUpdate(e, t, s) {
    const i = e, r = { ...i._data };
    u(() => {
      for (const n of Object.keys(t))
        n === "__proto__" || n === "constructor" || n === "prototype" || (i._data[n] = t[n]);
    });
    try {
      return await s(), e;
    } catch (n) {
      throw u(() => {
        for (const [o, a] of Object.entries(r))
          i._data[o] = a;
      }), n;
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
  runInTransaction(e) {
    u(e);
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
  serialize(e = {}) {
    var i;
    const t = {}, s = this.identityMap._buckets;
    for (const [r, n] of s) {
      const o = (i = e.exclude) == null ? void 0 : i[r], a = [];
      for (const [l, h] of n) {
        const c = h;
        let d;
        if (o && o.length > 0) {
          d = {};
          for (const [m, k] of Object.entries(c._data))
            o.includes(m) || (d[m] = k);
        } else
          d = { ...c._data };
        const b = {
          id: l,
          attributes: d
        };
        if (c._relationships && c._relationships.size > 0) {
          const m = {};
          for (const [k, D] of c._relationships)
            m[k] = D;
          b.relationships = m;
        }
        a.push(b);
      }
      a.length > 0 && (t[r] = a);
    }
    return { records: t };
  }
  /**
   * Restores records from a snapshot produced by `serialize()` into this store
   * instance.  All records are pushed into the identity map in `loaded.saved`
   * state — no network requests are issued.
   *
   * @param snapshot - A snapshot object previously returned by `serialize()`.
   */
  hydrate(e) {
    u(() => {
      for (const [t, s] of Object.entries(e.records))
        for (const i of s)
          this.pushResource({
            type: t,
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
  static hydrate(e, t) {
    const s = new y(e);
    return s.hydrate(t), s;
  }
};
y = H([
  T(),
  C(),
  V(0, I(z))
], y);
function it(e) {
  if (typeof Reflect.getMetadata != "function")
    throw new Error(
      'mobx-data requires reflect-metadata. Did you forget to import "reflect-metadata" at the top of your entry point?'
    );
  const t = new z();
  for (const n of e.models)
    t.registerModel(n.modelName, n);
  const s = new y(t), i = e.adapter ?? new N(), r = e.serializer ?? new j();
  for (const n of e.models)
    s.registerAdapter(n.modelName, i), s.registerSerializer(n.modelName, r);
  return s.registerAdapter("application", i), s.registerSerializer("application", r), s;
}
export {
  Q as A,
  L as I,
  w as M,
  G as O,
  A as R,
  y as S,
  E as a,
  B as b,
  it as c,
  p as d
};
//# sourceMappingURL=createStore-CxuLvBVN.js.map
