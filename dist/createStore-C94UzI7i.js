import "reflect-metadata";
import { S as T } from "./SchemaService-C_pkh-vI.js";
import { singleton as I, injectable as N, inject as M } from "tsyringe";
import { makeObservable as F, action as v, observable as m, computed as y, runInAction as p } from "mobx";
import { b as $, A as E, a as P, M as L } from "./relationships-DvSi8fVN.js";
import { e as O, p as S, R as j } from "./RestAdapter-DYUoyV5h.js";
import { J as B } from "./JsonSerializer-CFqo6GjC.js";
class Q {
  constructor() {
    this._buckets = /* @__PURE__ */ new Map(), F(this, {
      _buckets: m.shallow,
      set: v,
      delete: v,
      clear: v
    });
  }
  /**
   * Returns the bucket for `modelName`, optionally creating it when absent.
   * Internal helper — not part of the public API.
   */
  bucket(t, e = !1) {
    let i = this._buckets.get(t);
    return !i && e && (i = m.map({}, { deep: !1 }), this._buckets.set(t, i)), i;
  }
  /** Adds or replaces the record with the given `id` under `modelName`. */
  set(t, e, i) {
    this.bucket(t, !0).set(e, i);
  }
  /**
   * Returns the record for `modelName` + `id`, or `null` when not found.
   */
  get(t, e) {
    var i;
    return ((i = this.bucket(t)) == null ? void 0 : i.get(e)) ?? null;
  }
  /** Returns `true` when a record exists for `modelName` + `id`. */
  has(t, e) {
    var i;
    return ((i = this.bucket(t)) == null ? void 0 : i.has(e)) ?? !1;
  }
  /**
   * Removes the record for `modelName` + `id`.
   * @returns `true` when the record existed and was deleted.
   */
  delete(t, e) {
    var i;
    return ((i = this.bucket(t)) == null ? void 0 : i.delete(e)) ?? !1;
  }
  /** Returns all records stored under `modelName` as an array. */
  all(t) {
    const e = this.bucket(t);
    return e ? Array.from(e.values()) : [];
  }
  /**
   * Clears all records for `modelName`, or all records across all types when
   * `modelName` is omitted.
   */
  clear(t) {
    var e;
    if (t)
      (e = this.bucket(t)) == null || e.clear();
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
    let e = 0;
    for (const r of this._buckets.values())
      e += r.size;
    return e;
  }
}
class A {
  constructor(t) {
    this.updating = !1, this.opts = t, F(this, {
      resolved: t.keepAlive ? y({ keepAlive: !0 }) : y,
      updating: m,
      length: y,
      modelName: y
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
class U extends A {
  constructor(t) {
    super(t), this.queryParams = t.query, this.metaData = t.meta ?? {}, this.linksData = t.links ?? {}, F(this, {
      metaData: m.ref,
      linksData: m.ref,
      meta: y,
      links: y,
      query: y
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
const _ = [
  "equals",
  "notEquals",
  "in",
  "notIn",
  "isNull",
  "isNotNull"
], W = [
  ..._,
  "contains",
  "startsWith",
  "endsWith"
], C = [
  ..._,
  "greaterThan",
  "greaterThanOrEquals",
  "lessThan",
  "lessThanOrEquals",
  "between"
], G = {
  string: new Set(W),
  number: new Set(C),
  date: new Set(C),
  boolean: /* @__PURE__ */ new Set(["equals", "notEquals", "isNull", "isNotNull"])
}, z = /* @__PURE__ */ new Set([
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
class x extends Error {
  constructor(t) {
    const e = t.map((i) => `${i.path}: ${i.message}`);
    super(`MDQL validation failed: ${e.join("; ")}`), this.name = "MdqlValidationException", this.errors = t;
  }
}
class f {
  static validate(t, e) {
    const i = f.validateQuiet(t, e);
    if (i.length > 0)
      throw new x(i);
  }
  static validateQuiet(t, e) {
    const i = [];
    if (!e.doesTypeExist(t.modelName))
      return i.push({
        path: "modelName",
        message: `Unknown model type "${t.modelName}".`
      }), i;
    const r = e.attributesDefinitionFor(t.modelName), n = e.relationshipsDefinitionFor(t.modelName);
    f.validateFilterNode(
      t.filters,
      "filters",
      i,
      e,
      t.modelName
    );
    for (let o = 0; o < t.orderBy.length; o++) {
      const a = t.orderBy[o];
      a.field.includes(".") ? f.resolveFieldAttribute(a.field, t.modelName, e) || i.push({
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
  static resolveFieldAttribute(t, e, i) {
    const r = t.split(".");
    if (r.length === 1)
      return t === "id" ? { name: "id", type: "string" } : i.attributesDefinitionFor(e).get(t) ?? null;
    let n = e;
    for (let l = 0; l < r.length - 1; l++) {
      const u = i.relationshipsDefinitionFor(n).get(r[l]);
      if (!u || (n = u.type, !i.doesTypeExist(n))) return null;
    }
    const o = r[r.length - 1];
    return o === "id" ? { name: "id", type: "string" } : i.attributesDefinitionFor(n).get(o) ?? null;
  }
  static validateFilterNode(t, e, i, r, n) {
    if (t.kind === "condition") {
      const o = f.resolveFieldAttribute(
        t.field,
        n,
        r
      );
      if (!o) {
        const l = t.field.includes(".") ? `Unknown attribute path "${t.field}".` : `Unknown attribute "${t.field}".`;
        i.push({ path: e, message: l });
        return;
      }
      (o.type ? G[o.type] ?? z : z).has(t.operator) || i.push({
        path: e,
        message: `Operator "${t.operator}" is not valid for type "${o.type}".`
      }), t.operator === "between" && (!Array.isArray(t.value) || t.value.length !== 2) && i.push({
        path: e,
        message: 'Operator "between" requires a value of [min, max].'
      }), (t.operator === "in" || t.operator === "notIn") && (Array.isArray(t.value) || i.push({
        path: e,
        message: `Operator "${t.operator}" requires an array value.`
      }));
      return;
    }
    for (let o = 0; o < t.children.length; o++)
      f.validateFilterNode(
        t.children[o],
        `${e}.${t.kind}[${o}]`,
        i,
        r,
        n
      );
  }
}
class h {
  static executeMany(t, e) {
    let i = t.filter(
      (n) => h.matchesNode(n, e.filters)
    );
    e.orderBy.length > 0 && (i = h.sortRecords(i, e.orderBy));
    const r = e.offset ?? 0;
    if (r > 0 || e.limit !== null) {
      const n = e.limit !== null ? r + e.limit : void 0;
      i = i.slice(r, n);
    }
    return i;
  }
  static executeOne(t, e) {
    return h.executeMany(t, e)[0] ?? null;
  }
  static count(t, e) {
    return t.filter(
      (i) => h.matchesNode(i, e.filters)
    ).length;
  }
  static exists(t, e) {
    return t.some(
      (i) => h.matchesNode(i, e.filters)
    );
  }
  static compilePredicate(t) {
    return (e) => h.matchesNode(e, t.filters);
  }
  static matchesNode(t, e) {
    return e.kind === "condition" ? h.evaluateCondition(t, e) : e.kind === "and" ? e.children.every(
      (i) => h.matchesNode(t, i)
    ) : e.kind === "or" ? e.children.some(
      (i) => h.matchesNode(t, i)
    ) : !e.children.some(
      (i) => h.matchesNode(t, i)
    );
  }
  static resolveFieldValues(t, e) {
    const i = e.split(".");
    let r = [t];
    for (const n of i) {
      const o = [];
      for (const a of r)
        if (a != null)
          if (Array.isArray(a))
            for (const l of a)
              l != null && o.push(l[n]);
          else
            o.push(a[n]);
      r = o;
    }
    return r;
  }
  static resolveFieldValue(t, e) {
    const i = h.resolveFieldValues(t, e);
    return i.length === 1 ? i[0] : i.length === 0 ? void 0 : i;
  }
  static evaluateCondition(t, e) {
    const i = h.resolveFieldValues(t, e.field);
    if (i.length > 1)
      return i.some(
        (n) => h.evaluateSingleCondition(n, e.operator, e.value)
      );
    const r = i[0];
    return h.evaluateSingleCondition(r, e.operator, e.value);
  }
  static evaluateSingleCondition(t, e, i) {
    switch (e) {
      case "equals":
        return t === i;
      case "notEquals":
        return t !== i;
      case "in":
        return Array.isArray(i) && i.includes(t);
      case "notIn":
        return Array.isArray(i) && !i.includes(t);
      case "isNull":
        return t == null;
      case "isNotNull":
        return t != null;
      case "contains":
        return typeof t == "string" && typeof i == "string" && t.toLowerCase().includes(i.toLowerCase());
      case "startsWith":
        return typeof t == "string" && typeof i == "string" && t.toLowerCase().startsWith(i.toLowerCase());
      case "endsWith":
        return typeof t == "string" && typeof i == "string" && t.toLowerCase().endsWith(i.toLowerCase());
      case "greaterThan":
        return h.compareValues(t, i) > 0;
      case "greaterThanOrEquals":
        return h.compareValues(t, i) >= 0;
      case "lessThan":
        return h.compareValues(t, i) < 0;
      case "lessThanOrEquals":
        return h.compareValues(t, i) <= 0;
      case "between": {
        if (!Array.isArray(i) || i.length !== 2) return !1;
        const r = h.compareValues(t, i[0]), n = h.compareValues(t, i[1]);
        return r >= 0 && n <= 0;
      }
      default:
        return !1;
    }
  }
  static compareValues(t, e) {
    return t == null ? -1 : e == null ? 1 : t instanceof Date && e instanceof Date ? t.getTime() - e.getTime() : typeof t == "number" && typeof e == "number" ? t - e : typeof t == "string" && typeof e == "string" ? t.localeCompare(e) : String(t).localeCompare(String(e));
  }
  static sortRecords(t, e) {
    return [...t].sort((i, r) => {
      for (const n of e) {
        const o = h.resolveFieldValue(i, n.field), a = h.resolveFieldValue(r, n.field);
        if (o === a) continue;
        if (o == null) return 1;
        if (a == null) return -1;
        const l = h.compareValues(o, a);
        if (l !== 0)
          return n.direction === "desc" ? -l : l;
      }
      return 0;
    });
  }
}
class w {
  constructor(t, e) {
    this.store = t, this.queryModelName = e, this.rootGroup = { kind: "and", children: [] }, this.orderByClauses = [], this.limitValue = null, this.offsetValue = null, this.includesList = [];
  }
  where(t, e, i) {
    const r = {
      kind: "condition",
      field: t,
      operator: e,
      value: i
    };
    return this.rootGroup.children.push(r), this;
  }
  whereEquals(t, e) {
    return this.where(t, "equals", e);
  }
  whereContains(t, e) {
    return this.where(t, "contains", e);
  }
  and(t) {
    const e = new w(this.store, this.queryModelName);
    t(e);
    const i = { kind: "and", children: [...e.rootGroup.children] };
    return this.rootGroup.children.push(i), this;
  }
  or(t) {
    const e = new w(this.store, this.queryModelName);
    t(e);
    const i = { kind: "or", children: [...e.rootGroup.children] };
    return this.rootGroup.children.push(i), this;
  }
  not(t) {
    const e = new w(this.store, this.queryModelName);
    t(e);
    const i = { kind: "not", children: [...e.rootGroup.children] };
    return this.rootGroup.children.push(i), this;
  }
  orderBy(t, e = "asc") {
    return this.orderByClauses.push({ field: t, direction: e }), this;
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
    f.validate(t, this.store.schema);
    const e = this.store.peekAll(this.queryModelName).toArray();
    return h.executeMany(e, t);
  }
  async first() {
    const t = this.toQueryObject();
    f.validate(t, this.store.schema);
    const e = this.store.peekAll(this.queryModelName).toArray();
    return h.executeOne(e, t);
  }
  async count() {
    const t = this.toQueryObject();
    f.validate(t, this.store.schema);
    const e = this.store.peekAll(this.queryModelName).toArray();
    return h.count(e, t);
  }
  async exists() {
    const t = this.toQueryObject();
    f.validate(t, this.store.schema);
    const e = this.store.peekAll(this.queryModelName).toArray();
    return h.exists(e, t);
  }
  toLiveArray() {
    const t = this.toQueryObject();
    f.validate(t, this.store.schema);
    const e = h.compilePredicate(t);
    return this.store.liveQuery(this.queryModelName, e);
  }
}
var H = Object.getOwnPropertyDescriptor, V = (s, t, e, i) => {
  for (var r = i > 1 ? void 0 : i ? H(t, e) : t, n = s.length - 1, o; n >= 0; n--)
    (o = s[n]) && (r = o(r) || r);
  return r;
}, q = (s, t) => (e, i) => t(e, i, s);
let g = class {
  constructor(s) {
    this.identityMap = new Q(), this.adapters = /* @__PURE__ */ new Map(), this.serializers = /* @__PURE__ */ new Map(), this.newRecords = /* @__PURE__ */ new Map(), this.newRecordTypes = /* @__PURE__ */ new WeakMap(), this.relationshipCache = /* @__PURE__ */ new WeakMap(), this.pendingMembers = /* @__PURE__ */ new WeakMap(), this._cache = null, this.coalescePending = /* @__PURE__ */ new Map(), this.coalesceScheduled = /* @__PURE__ */ new Set(), this.schema = s;
  }
  static refEquals(s, t) {
    return s.id === t.id && s.type === t.type;
  }
  // --- registration ---
  /** Registers an adapter for a given model name (or `'application'` as a fallback). */
  registerAdapter(s, t) {
    this.adapters.set(s, t);
  }
  /** Registers a serializer for a given model name (or `'application'` as a fallback). */
  registerSerializer(s, t) {
    this.serializers.set(s, t);
  }
  /** Registers a persistent cache layer (e.g. IndexedDB) for offline-first reads. */
  registerCache(s) {
    this._cache = s;
  }
  /**
   * Returns the adapter for `modelName`, falling back to `'application'`.
   * @throws when no adapter is registered.
   */
  adapterFor(s) {
    const t = this.adapters.get(s) ?? this.adapters.get("application");
    if (!t)
      throw new Error(`No adapter registered for "${s}"`);
    return t;
  }
  /**
   * Returns the serializer for `modelName`, falling back to `'application'`.
   * @throws when no serializer is registered.
   */
  serializerFor(s) {
    const t = this.serializers.get(s) ?? this.serializers.get("application");
    if (!t)
      throw new Error(`No serializer registered for "${s}"`);
    return t;
  }
  // --- creating ---
  /**
   * Creates a new (unsaved) record of the given type with optional initial data.
   * The record is tracked in `newRecords` until it is saved or rolled back.
   *
   * @throws when `modelName` has not been registered with `SchemaService`.
   */
  createRecord(s, t = {}) {
    if (!this.schema.doesTypeExist(s))
      throw new Error(`Unknown model type: "${s}"`);
    const e = this.schema.modelFor(s), i = new e({ id: null, data: t, store: this });
    return this.trackNewRecord(s, i), i;
  }
  trackNewRecord(s, t) {
    let e = this.newRecords.get(s);
    e || (e = /* @__PURE__ */ new Set(), this.newRecords.set(s, e)), e.add(t), this.newRecordTypes.set(t, s);
  }
  untrackNewRecord(s) {
    var e;
    const t = this.newRecordTypes.get(s);
    t && ((e = this.newRecords.get(t)) == null || e.delete(s), this.newRecordTypes.delete(s));
  }
  // --- peeking ---
  /**
   * Synchronously returns a record from the identity map, or `null` when not
   * found.  Does not trigger a network request.
   */
  peekRecord(s, t) {
    const e = t == null ? null : String(t);
    if (e === null)
      return null;
    const i = this.identityMap.get(s, e);
    if (i) return i;
    const r = this.schema.polymorphicRootFor(s);
    if (r) {
      const n = this.identityMap.get(r, e);
      if (n && n instanceof this.schema.modelFor(s))
        return n;
    }
    return null;
  }
  /**
   * Returns a live `RecordArray` backed by the identity map for `modelName`.
   * New (unsaved) records are included at the end.
   * Does not trigger a network request.
   */
  peekAll(s) {
    return new A({
      modelName: s,
      source: () => {
        const t = this.identityMap.all(s), e = this.newRecords.get(s);
        return !e || e.size === 0 ? t : [...t, ...e];
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
  push(s) {
    const t = s;
    if (t.included)
      for (const e of t.included)
        this.pushResource(e);
    return t.data === null || t.data === void 0 ? null : Array.isArray(t.data) ? t.data.map((e) => this.pushResource(e)) : this.pushResource(t.data);
  }
  /**
   * Normalizes a raw payload via the registered serializer and pushes the
   * result.  `modelName` is optional; when omitted the payload is pushed
   * directly without normalization.
   */
  pushPayload(s, t) {
    let e, i;
    typeof s == "string" ? (e = s, i = t) : (e = null, i = s);
    const r = e ? this.serializerFor(e).normalizeResponse(
      this,
      this.schema.modelFor(e),
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
  normalize(s, t) {
    return this.serializerFor(s).normalizeResponse(
      this,
      this.schema.modelFor(s),
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
  pushResource(s) {
    const { type: t, id: e } = s;
    if (!this.schema.doesTypeExist(t))
      throw new Error(`Unknown model type: "${t}"`);
    if (e === null)
      throw new Error(`Cannot push a resource of type "${t}" without an id`);
    let i = t, r = this.schema.modelFor(t);
    const n = this.schema.resolveConcreteModel(
      t,
      s.attributes ?? {}
    );
    n && (r = n.modelClass, i = t);
    const o = this.schema.polymorphicRootFor(t);
    o && (i = o);
    const a = this.identityMap.get(i, e);
    if (a)
      return p(() => {
        a._applyServerData(null, s.attributes ?? {}, s.relationships);
      }), this.trackInverseForResource(a, s), a;
    const l = r, c = $.push.call(l, {
      id: e,
      data: s.attributes ?? {},
      relationships: s.relationships,
      store: this
    });
    return this.identityMap.set(i, e, c), this.trackInverseForResource(c, s), c;
  }
  /**
   * After pushing a resource, updates the inverse side of every declared
   * inverse relationship so both sides stay consistent.
   */
  trackInverseForResource(s, t) {
    if (t.relationships)
      for (const [e, i] of Object.entries(t.relationships)) {
        const r = this.schema.relationshipsDefinitionFor(s.modelName).get(e);
        if (!r || !r.options.inverse || !i.data)
          continue;
        const n = Array.isArray(i.data) ? i.data : [i.data];
        for (const o of n)
          this.addInverse(o.type, o.id, r.options.inverse, s);
      }
  }
  /**
   * Adds `inverseRecord` to the inverse relationship on `targetType:targetId`.
   * No-ops when the target record is not in the identity map.
   */
  addInverse(s, t, e, i) {
    const r = this.identityMap.get(s, t);
    if (!r)
      return;
    const o = this.schema.relationshipsDefinitionFor(s).get(e);
    if (!o)
      return;
    const a = r._getRelationshipRef(e), l = { type: i.modelName, id: i.id };
    p(() => {
      if (o.kind === "hasMany") {
        const c = a != null && a.data && Array.isArray(a.data) ? a.data : [];
        c.some((u) => g.refEquals(u, l)) || r._setRelationshipRef(e, { data: [...c, l] });
      } else
        r._setRelationshipRef(e, { data: l });
    });
  }
  /**
   * Removes `inverseRecord` from the inverse relationship on `targetType:targetId`.
   * No-ops when the target record is not in the identity map.
   */
  removeInverse(s, t, e, i) {
    const r = this.identityMap.get(s, t);
    if (!r)
      return;
    const o = this.schema.relationshipsDefinitionFor(s).get(e);
    if (!o)
      return;
    const a = r._getRelationshipRef(e);
    p(() => {
      if (o.kind === "hasMany") {
        const c = (a != null && a.data && Array.isArray(a.data) ? a.data : []).filter((u) => !(u.id === i.id && u.type === i.modelName));
        r._setRelationshipRef(e, { data: c });
      } else
        r._setRelationshipRef(e, { data: null });
    });
  }
  // --- unload ---
  /**
   * Removes a record from the identity map and clears its relationship cache.
   * Called by `record.unloadRecord()` and internally after `deleteRecord`.
   */
  unloadRecord(s) {
    s.id !== null && this.identityMap.delete(s.modelName, s.id), this.untrackNewRecord(s), this.relationshipCache.delete(s);
  }
  /**
   * Unloads all records for `modelName`, or all records across all types when
   * `modelName` is omitted.
   */
  unloadAll(s) {
    var t;
    if (s) {
      for (const e of this.identityMap.all(s))
        this.relationshipCache.delete(e);
      this.identityMap.clear(s), (t = this.newRecords.get(s)) == null || t.clear();
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
  async findRecord(s, t, e = {}) {
    const i = this.peekRecord(s, t);
    if (i && !e.reload && !e.include)
      return i;
    if (!e.reload && !e.include && this._cache) {
      const d = await this._cache.get(s, t);
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
    const r = this.adapterFor(s);
    if (r.coalesceFindRequests && r.findMany && !e.include)
      return this.scheduleCoalescedFind(s, t);
    const n = i ? this.createSnapshot(i) : this.createEmptySnapshot(s, t), o = e.include ? { include: e.include, adapterOptions: e.adapterOptions } : e.adapterOptions ? { adapterOptions: e.adapterOptions } : void 0, a = await r.findRecord(this, s, t, n, o), l = O(a), c = this.serializerFor(s).normalizeResponse(
      this,
      this.schema.modelFor(s),
      a,
      t,
      "findRecord"
    ), u = this.push(c);
    if (this._cache) {
      const d = l ? S(l) : null;
      d !== 0 && this.cacheNormalizedDocument(c, d ?? void 0);
    }
    return u;
  }
  /**
   * Fetches all records of `modelName` from the server and returns a
   * `RecordArray` backed by the identity map.
   */
  async findAll(s, t = {}) {
    const e = this.adapterFor(s), i = t.include ? { include: t.include, adapterOptions: t.adapterOptions } : t.adapterOptions ? { adapterOptions: t.adapterOptions } : void 0, r = await e.findAll(this, s, null, [], i), n = O(r), o = this.serializerFor(s).normalizeResponse(
      this,
      this.schema.modelFor(s),
      r,
      null,
      "findAll"
    );
    if (this.push(o), this._cache) {
      const a = n ? S(n) : null;
      a !== 0 && this.cacheNormalizedDocument(o, a ?? void 0);
    }
    return this.peekAll(s);
  }
  /**
   * Executes an adapter query and returns an `AdapterPopulatedRecordArray`
   * whose `update()` method re-issues the same query.
   */
  async query(s, t) {
    const e = [], i = new U({
      modelName: s,
      query: t,
      source: () => e.map((r) => this.peekRecord(s, r)).filter((r) => r !== null),
      update: async () => {
        await this.runQuery(s, t, i, e);
      }
    });
    return await this.runQuery(s, t, i, e), i;
  }
  async runQuery(s, t, e, i) {
    const n = await this.adapterFor(s).query(this, s, t, e), o = this.serializerFor(s).normalizeResponse(
      this,
      this.schema.modelFor(s),
      n,
      null,
      "query"
    );
    if (this.push(o), i.length = 0, Array.isArray(o.data))
      for (const a of o.data)
        a.id && i.push(a.id);
    o.meta && e._setMeta(o.meta), o.links && e._setLinks(o.links);
  }
  /**
   * Executes an adapter query that returns at most one record.
   * Returns `null` when the adapter returns an empty payload.
   */
  async queryRecord(s, t) {
    const i = await this.adapterFor(s).queryRecord(this, s, t), r = this.serializerFor(s).normalizeResponse(
      this,
      this.schema.modelFor(s),
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
  async saveRecord(s, t = {}) {
    const e = this.adapterFor(s.modelName), { isNew: i } = s;
    i && this.schema.hasClientGeneratedIds(s.modelName) && s.id === null && (s.id = s._clientId);
    const r = this.createSnapshot(s);
    let n;
    i ? n = await e.createRecord(this, s.modelName, r) : t.patch && e.patchRecord ? n = await e.patchRecord(this, s.modelName, r) : n = await e.updateRecord(this, s.modelName, r);
    const o = this.serializerFor(s.modelName).normalizeResponse(
      this,
      this.schema.modelFor(s.modelName),
      n,
      s.id,
      i ? "createRecord" : "updateRecord"
    ), a = o.data;
    if (a) {
      const l = a.id ?? s.id;
      p(() => {
        s._applyServerData(l, a.attributes ?? {}, a.relationships);
      }), i && l && (this.untrackNewRecord(s), this.identityMap.set(s.modelName, l, s));
    }
    if (o.included)
      for (const l of o.included)
        this.pushResource(l);
    if (this._cache && s.id) {
      const l = s, c = {};
      for (const [u, d] of l._relationships)
        c[u] = d;
      this._cache.set(s.modelName, s.id, { ...l._data }, {
        relationships: Object.keys(c).length > 0 ? c : void 0
      });
    }
    return s;
  }
  /**
   * Issues a DELETE request and unloads the record from the identity map.
   */
  async deleteRecord(s) {
    const t = this.adapterFor(s.modelName), e = this.createSnapshot(s);
    return await t.deleteRecord(this, s.modelName, e), this._cache && s.id && this._cache.invalidate(s.modelName, s.id), this.unloadRecord(s), s;
  }
  /**
   * Re-fetches a record from the server and merges the response into the
   * existing instance.
   */
  async reloadRecord(s) {
    if (!s.id)
      throw new Error("Cannot reload a record without an id");
    const t = this.adapterFor(s.modelName), e = this.createSnapshot(s), i = await t.findRecord(this, s.modelName, s.id, e), r = this.serializerFor(s.modelName).normalizeResponse(
      this,
      this.schema.modelFor(s.modelName),
      i,
      s.id,
      "findRecord"
    );
    return this.push(r), s;
  }
  // --- snapshot ---
  /**
   * Creates a `Snapshot` for a live record.
   * The snapshot reads directly from the record's internal state so it
   * reflects the current (possibly dirty) values.
   */
  createSnapshot(s) {
    const { modelName: t } = s, e = this.schema.attributesDefinitionFor(t), i = this.schema.relationshipsDefinitionFor(t), r = s;
    return {
      id: s.id,
      clientId: s._clientId,
      modelName: t,
      record: s,
      attr: (n) => r._data[n],
      belongsTo: (n, o) => {
        const a = r._getRelationshipRef(n);
        return !(a != null && a.data) || Array.isArray(a.data) ? null : o != null && o.id ? a.data.id : this.peekRecord(a.data.type, a.data.id);
      },
      hasMany: (n, o) => {
        const a = r._getRelationshipRef(n), l = a != null && a.data && Array.isArray(a.data) ? a.data : [];
        return o != null && o.ids ? l.map((c) => c.id) : l.map((c) => this.peekRecord(c.type, c.id)).filter((c) => c !== null);
      },
      changedAttributes: () => r.changedAttributes(),
      eachAttribute: (n) => {
        for (const [o, a] of e)
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
  createEmptySnapshot(s, t) {
    const e = this.schema.attributesDefinitionFor(s), i = this.schema.relationshipsDefinitionFor(s);
    return {
      id: t,
      clientId: "",
      modelName: s,
      record: null,
      attr: () => {
      },
      belongsTo: () => null,
      hasMany: () => [],
      changedAttributes: () => ({}),
      eachAttribute: (r) => {
        for (const [n, o] of e)
          r(n, o);
      },
      eachRelationship: (r) => {
        for (const [n, o] of i)
          r(n, o);
      }
    };
  }
  // --- relationship resolution (called by Model) ---
  getRelationshipCache(s, t) {
    var e;
    return (e = this.relationshipCache.get(s)) == null ? void 0 : e.get(t);
  }
  setRelationshipCache(s, t, e) {
    let i = this.relationshipCache.get(s);
    i || (i = /* @__PURE__ */ new Map(), this.relationshipCache.set(s, i)), i.set(t, e);
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
  resolveRelationship(s, t, e) {
    const i = e.options.async === !0, r = this.getRelationshipCache(s, t);
    if (r)
      return r;
    const n = {
      parent: s,
      name: t,
      meta: e,
      store: this
    };
    if (i) {
      if (e.kind === "belongsTo") {
        const l = new E(n);
        return this.setRelationshipCache(s, t, l), l;
      }
      const a = new P(n);
      return this.setRelationshipCache(s, t, a), a;
    }
    if (e.kind === "belongsTo") {
      const a = s._getRelationshipRef(t);
      return !(a != null && a.data) || Array.isArray(a.data) ? null : this.peekRecord(a.data.type, a.data.id);
    }
    const o = new L(n);
    return this.setRelationshipCache(s, t, o), o;
  }
  /**
   * Called by the `Model` `belongsTo` setter to update a relationship ref
   * and keep its inverse in sync.
   */
  setRelationshipValue(s, t, e, i) {
    if (e.kind !== "belongsTo")
      return;
    const r = s._getRelationshipRef(t), n = r != null && r.data && !Array.isArray(r.data) ? r.data : null;
    if (i == null) {
      p(() => {
        s._setRelationshipRef(t, { data: null });
      }), n && e.options.inverse && this.removeInverse(n.type, n.id, e.options.inverse, s);
      return;
    }
    const o = i, a = { type: o.modelName, id: o.id };
    p(() => {
      s._setRelationshipRef(t, { data: a });
    }), e.options.inverse && (n && !g.refEquals(n, a) && this.removeInverse(n.type, n.id, e.options.inverse, s), this.addInverse(a.type, a.id, e.options.inverse, s));
  }
  // --- hooks used by ManyArray ---
  /** Returns the raw relationship ref stored on `record` for `name`. */
  _getRelationshipRefFor(s, t) {
    return s._getRelationshipRef(t);
  }
  /** Returns any pending (unsaved) members for a `hasMany` relationship. */
  _getPendingMembers(s, t) {
    var e;
    return ((e = this.pendingMembers.get(s)) == null ? void 0 : e.get(t)) ?? [];
  }
  addPendingMember(s, t, e) {
    let i = this.pendingMembers.get(s);
    i || (i = /* @__PURE__ */ new Map(), this.pendingMembers.set(s, i));
    let r = i.get(t);
    r || (r = m.set(), i.set(t, r)), r.add(e);
  }
  removePendingMember(s, t, e) {
    var i, r;
    (r = (i = this.pendingMembers.get(s)) == null ? void 0 : i.get(t)) == null || r.delete(e);
  }
  /**
   * Appends `value` to the `hasMany` relationship ref on `record` and syncs
   * the inverse.  Unsaved records (`value.id === null`) are tracked as
   * "pending members" until they are persisted.
   */
  _hasManyAppend(s, t, e, i) {
    if (i.id === null) {
      if (this.addPendingMember(s, t, i), e.options.inverse) {
        const a = this.schema.relationshipsDefinitionFor(i.modelName).get(e.options.inverse);
        (a == null ? void 0 : a.kind) === "belongsTo" && p(() => {
          i._setRelationshipRef(e.options.inverse, {
            data: { type: s.modelName, id: s.id }
          });
        });
      }
      return;
    }
    const r = this._getRelationshipRefFor(s, t), n = r != null && r.data && Array.isArray(r.data) ? r.data : [], o = { type: i.modelName, id: i.id };
    n.some((a) => g.refEquals(a, o)) || p(() => {
      s._setRelationshipRef(t, { data: [...n, o] });
    }), e.options.inverse && this.addInverse(i.modelName, i.id, e.options.inverse, s);
  }
  /**
   * Removes `value` from the `hasMany` relationship ref on `record` and syncs
   * the inverse.  Pending members are removed from the pending set.
   */
  _hasManyRemove(s, t, e, i) {
    if (i.id === null) {
      this.removePendingMember(s, t, i);
      return;
    }
    const r = this._getRelationshipRefFor(s, t), o = (r != null && r.data && Array.isArray(r.data) ? r.data : []).filter(
      (a) => !(a.id === i.id && a.type === i.modelName)
    );
    p(() => {
      s._setRelationshipRef(t, { data: o });
    }), e.options.inverse && this.removeInverse(i.modelName, i.id, e.options.inverse, s);
  }
  // --- persistent cache helpers ---
  cacheNormalizedDocument(s, t) {
    const e = [];
    s.data && (Array.isArray(s.data) ? e.push(...s.data) : e.push(s.data)), s.included && e.push(...s.included);
    for (const i of e)
      i.id && this._cache.set(i.type, i.id, i.attributes ?? {}, {
        relationships: i.relationships,
        ttl: t
      });
  }
  scheduleCoalescedFind(s, t) {
    return new Promise((e, i) => {
      let r = this.coalescePending.get(s);
      r || (r = /* @__PURE__ */ new Map(), this.coalescePending.set(s, r));
      let n = r.get(t);
      n || (n = [], r.set(t, n)), n.push({ resolve: e, reject: i }), this.coalesceScheduled.has(s) || (this.coalesceScheduled.add(s), queueMicrotask(() => this.flushCoalescedFind(s)));
    });
  }
  async flushCoalescedFind(s) {
    this.coalesceScheduled.delete(s);
    const t = this.coalescePending.get(s), e = new Map(t);
    t.clear();
    const i = Array.from(e.keys()), r = this.adapterFor(s);
    try {
      const n = i.map((l) => {
        const c = this.peekRecord(s, l);
        return c ? this.createSnapshot(c) : this.createEmptySnapshot(s, l);
      }), o = await r.findMany(this, s, i, n), a = this.serializerFor(s).normalizeResponse(
        this,
        this.schema.modelFor(s),
        o,
        null,
        "findMany"
      );
      this.push(a);
      for (const l of i) {
        const c = this.peekRecord(s, l), u = e.get(l);
        if (u)
          for (const d of u)
            c ? d.resolve(c) : d.reject(new Error(`Record not found after findMany: ${s}:${l}`));
      }
    } catch (n) {
      for (const o of e.values())
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
  liveQuery(s, t) {
    return new A({
      modelName: s,
      keepAlive: !0,
      source: () => {
        const e = this.identityMap.all(s), i = this.newRecords.get(s);
        return (i && i.size > 0 ? [...e, ...i] : e).filter(t);
      }
    });
  }
  // --- select (MDQL) ---
  select(s) {
    if (!this.schema.doesTypeExist(s))
      throw new Error(`Unknown model type: "${s}"`);
    return new w(this, s);
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
  async optimisticUpdate(s, t, e) {
    const i = s, r = { ...i._data };
    p(() => {
      Object.assign(i._data, t);
    });
    try {
      return await e(), s;
    } catch (n) {
      throw p(() => {
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
  runInTransaction(s) {
    p(s);
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
  serialize(s = {}) {
    var i;
    const t = {}, e = this.identityMap._buckets;
    for (const [r, n] of e) {
      const o = (i = s.exclude) == null ? void 0 : i[r], a = [];
      for (const [l, c] of n) {
        const u = c;
        let d;
        if (o && o.length > 0) {
          d = {};
          for (const [R, k] of Object.entries(u._data))
            o.includes(R) || (d[R] = k);
        } else
          d = { ...u._data };
        const b = {
          id: l,
          attributes: d
        };
        if (u._relationships && u._relationships.size > 0) {
          const R = {};
          for (const [k, D] of u._relationships)
            R[k] = D;
          b.relationships = R;
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
  hydrate(s) {
    p(() => {
      for (const [t, e] of Object.entries(s.records))
        for (const i of e)
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
  static hydrate(s, t) {
    const e = new g(s);
    return e.hydrate(t), e;
  }
};
g = V([
  I(),
  N(),
  q(0, M(T))
], g);
function st(s) {
  if (typeof Reflect.getMetadata != "function")
    throw new Error(
      'mobx-data requires reflect-metadata. Did you forget to import "reflect-metadata" at the top of your entry point?'
    );
  const t = new T();
  for (const n of s.models)
    t.registerModel(n.modelName, n);
  const e = new g(t), i = s.adapter ?? new j(), r = s.serializer ?? new B();
  for (const n of s.models)
    e.registerAdapter(n.modelName, i), e.registerSerializer(n.modelName, r);
  return e.registerAdapter("application", i), e.registerSerializer("application", r), e;
}
export {
  U as A,
  Q as I,
  h as M,
  G as O,
  A as R,
  g as S,
  z as a,
  w as b,
  st as c,
  x as d,
  f as e
};
//# sourceMappingURL=createStore-C94UzI7i.js.map
