import { singleton as _, injectable as M, inject as N } from "tsyringe";
import { makeObservable as F, action as v, observable as R, computed as y, runInAction as p } from "mobx";
import { S as $ } from "./SchemaService-BOy3SIWh.js";
import { b as I, A as P, a as E, M as L } from "./relationships-DcHr9Q3b.js";
import { e as O, p as C } from "./cache-utils-B2wFhisx.js";
class j {
  constructor() {
    this._buckets = /* @__PURE__ */ new Map(), F(this, {
      _buckets: R.shallow,
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
    return !i && e && (i = R.map({}, { deep: !1 }), this._buckets.set(t, i)), i;
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
    for (const n of this._buckets.values())
      e += n.size;
    return e;
  }
}
class A {
  constructor(t) {
    this.updating = !1, this.opts = t, F(this, {
      resolved: t.keepAlive ? y({ keepAlive: !0 }) : y,
      updating: R,
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
class B extends A {
  constructor(t) {
    super(t), this.queryParams = t.query, this.metaData = t.meta ?? {}, this.linksData = t.links ?? {}, F(this, {
      metaData: R.ref,
      linksData: R.ref,
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
const z = [
  "equals",
  "notEquals",
  "in",
  "notIn",
  "isNull",
  "isNotNull"
], Q = [
  ...z,
  "contains",
  "startsWith",
  "endsWith"
], S = [
  ...z,
  "greaterThan",
  "greaterThanOrEquals",
  "lessThan",
  "lessThanOrEquals",
  "between"
], U = {
  string: new Set(Q),
  number: new Set(S),
  date: new Set(S),
  boolean: /* @__PURE__ */ new Set(["equals", "notEquals", "isNull", "isNotNull"])
}, T = /* @__PURE__ */ new Set([
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
class W extends Error {
  constructor(t) {
    const e = t.map((i) => `${i.path}: ${i.message}`);
    super(`MDQL validation failed: ${e.join("; ")}`), this.name = "MdqlValidationException", this.errors = t;
  }
}
class f {
  static validate(t, e) {
    const i = f.validateQuiet(t, e);
    if (i.length > 0)
      throw new W(i);
  }
  static validateQuiet(t, e) {
    const i = [];
    if (!e.doesTypeExist(t.modelName))
      return i.push({
        path: "modelName",
        message: `Unknown model type "${t.modelName}".`
      }), i;
    const n = e.attributesDefinitionFor(t.modelName), o = e.relationshipsDefinitionFor(t.modelName);
    f.validateFilterNode(
      t.filters,
      "filters",
      i,
      e,
      t.modelName
    );
    for (let a = 0; a < t.orderBy.length; a++) {
      const r = t.orderBy[a];
      r.field.includes(".") ? f.resolveFieldAttribute(r.field, t.modelName, e) || i.push({
        path: `orderBy[${a}]`,
        message: `Unknown attribute path "${r.field}".`
      }) : r.field !== "id" && !n.has(r.field) && i.push({
        path: `orderBy[${a}]`,
        message: `Unknown attribute "${r.field}" on "${t.modelName}".`
      });
    }
    for (const a of t.includes)
      o.has(a) || i.push({
        path: "includes",
        message: `Unknown relationship "${a}" on "${t.modelName}".`
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
    const n = t.split(".");
    if (n.length === 1)
      return t === "id" ? { name: "id", type: "string" } : i.attributesDefinitionFor(e).get(t) ?? null;
    let o = e;
    for (let l = 0; l < n.length - 1; l++) {
      const u = i.relationshipsDefinitionFor(o).get(n[l]);
      if (!u || (o = u.type, !i.doesTypeExist(o))) return null;
    }
    const a = n[n.length - 1];
    return a === "id" ? { name: "id", type: "string" } : i.attributesDefinitionFor(o).get(a) ?? null;
  }
  static validateFilterNode(t, e, i, n, o) {
    if (t.kind === "condition") {
      const a = f.resolveFieldAttribute(
        t.field,
        o,
        n
      );
      if (!a) {
        const l = t.field.includes(".") ? `Unknown attribute path "${t.field}".` : `Unknown attribute "${t.field}".`;
        i.push({ path: e, message: l });
        return;
      }
      (a.type ? U[a.type] ?? T : T).has(t.operator) || i.push({
        path: e,
        message: `Operator "${t.operator}" is not valid for type "${a.type}".`
      }), t.operator === "between" && (!Array.isArray(t.value) || t.value.length !== 2) && i.push({
        path: e,
        message: 'Operator "between" requires a value of [min, max].'
      }), (t.operator === "in" || t.operator === "notIn") && (Array.isArray(t.value) || i.push({
        path: e,
        message: `Operator "${t.operator}" requires an array value.`
      }));
      return;
    }
    for (let a = 0; a < t.children.length; a++)
      f.validateFilterNode(
        t.children[a],
        `${e}.${t.kind}[${a}]`,
        i,
        n,
        o
      );
  }
}
class c {
  static executeMany(t, e) {
    let i = t.filter(
      (o) => c.matchesNode(o, e.filters)
    );
    e.orderBy.length > 0 && (i = c.sortRecords(i, e.orderBy));
    const n = e.offset ?? 0;
    if (n > 0 || e.limit !== null) {
      const o = e.limit !== null ? n + e.limit : void 0;
      i = i.slice(n, o);
    }
    return i;
  }
  static executeOne(t, e) {
    return c.executeMany(t, e)[0] ?? null;
  }
  static count(t, e) {
    return t.filter(
      (i) => c.matchesNode(i, e.filters)
    ).length;
  }
  static exists(t, e) {
    return t.some(
      (i) => c.matchesNode(i, e.filters)
    );
  }
  static compilePredicate(t) {
    return (e) => c.matchesNode(e, t.filters);
  }
  static matchesNode(t, e) {
    return e.kind === "condition" ? c.evaluateCondition(t, e) : e.kind === "and" ? e.children.every(
      (i) => c.matchesNode(t, i)
    ) : e.kind === "or" ? e.children.some(
      (i) => c.matchesNode(t, i)
    ) : !e.children.some(
      (i) => c.matchesNode(t, i)
    );
  }
  static resolveFieldValues(t, e) {
    const i = e.split(".");
    let n = [t];
    for (const o of i) {
      const a = [];
      for (const r of n)
        if (r != null)
          if (Array.isArray(r))
            for (const l of r)
              l != null && a.push(l[o]);
          else
            a.push(r[o]);
      n = a;
    }
    return n;
  }
  static resolveFieldValue(t, e) {
    const i = c.resolveFieldValues(t, e);
    return i.length === 1 ? i[0] : i.length === 0 ? void 0 : i;
  }
  static evaluateCondition(t, e) {
    const i = c.resolveFieldValues(t, e.field);
    if (i.length > 1)
      return i.some(
        (o) => c.evaluateSingleCondition(o, e.operator, e.value)
      );
    const n = i[0];
    return c.evaluateSingleCondition(n, e.operator, e.value);
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
        return c.compareValues(t, i) > 0;
      case "greaterThanOrEquals":
        return c.compareValues(t, i) >= 0;
      case "lessThan":
        return c.compareValues(t, i) < 0;
      case "lessThanOrEquals":
        return c.compareValues(t, i) <= 0;
      case "between": {
        if (!Array.isArray(i) || i.length !== 2) return !1;
        const n = c.compareValues(t, i[0]), o = c.compareValues(t, i[1]);
        return n >= 0 && o <= 0;
      }
      default:
        return !1;
    }
  }
  static compareValues(t, e) {
    return t == null ? -1 : e == null ? 1 : t instanceof Date && e instanceof Date ? t.getTime() - e.getTime() : typeof t == "number" && typeof e == "number" ? t - e : typeof t == "string" && typeof e == "string" ? t.localeCompare(e) : String(t).localeCompare(String(e));
  }
  static sortRecords(t, e) {
    return [...t].sort((i, n) => {
      for (const o of e) {
        const a = c.resolveFieldValue(i, o.field), r = c.resolveFieldValue(n, o.field);
        if (a === r) continue;
        if (a == null) return 1;
        if (r == null) return -1;
        const l = c.compareValues(a, r);
        if (l !== 0)
          return o.direction === "desc" ? -l : l;
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
    const n = {
      kind: "condition",
      field: t,
      operator: e,
      value: i
    };
    return this.rootGroup.children.push(n), this;
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
    return c.executeMany(e, t);
  }
  async first() {
    const t = this.toQueryObject();
    f.validate(t, this.store.schema);
    const e = this.store.peekAll(this.queryModelName).toArray();
    return c.executeOne(e, t);
  }
  async count() {
    const t = this.toQueryObject();
    f.validate(t, this.store.schema);
    const e = this.store.peekAll(this.queryModelName).toArray();
    return c.count(e, t);
  }
  async exists() {
    const t = this.toQueryObject();
    f.validate(t, this.store.schema);
    const e = this.store.peekAll(this.queryModelName).toArray();
    return c.exists(e, t);
  }
  toLiveArray() {
    const t = this.toQueryObject();
    f.validate(t, this.store.schema);
    const e = c.compilePredicate(t);
    return this.store.liveQuery(this.queryModelName, e);
  }
}
var G = Object.getOwnPropertyDescriptor, H = (s, t, e, i) => {
  for (var n = i > 1 ? void 0 : i ? G(t, e) : t, o = s.length - 1, a; o >= 0; o--)
    (a = s[o]) && (n = a(n) || n);
  return n;
}, x = (s, t) => (e, i) => t(e, i, s);
let g = class {
  constructor(s) {
    this.identityMap = new j(), this.adapters = /* @__PURE__ */ new Map(), this.serializers = /* @__PURE__ */ new Map(), this.newRecords = /* @__PURE__ */ new Map(), this.newRecordTypes = /* @__PURE__ */ new WeakMap(), this.relationshipCache = /* @__PURE__ */ new WeakMap(), this.pendingMembers = /* @__PURE__ */ new WeakMap(), this._cache = null, this.coalescePending = /* @__PURE__ */ new Map(), this.coalesceScheduled = /* @__PURE__ */ new Set(), this.schema = s;
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
    const n = this.schema.polymorphicRootFor(s);
    if (n) {
      const o = this.identityMap.get(n, e);
      if (o && o instanceof this.schema.modelFor(s))
        return o;
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
    const n = e ? this.serializerFor(e).normalizeResponse(
      this,
      this.schema.modelFor(e),
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
    let i = t, n = this.schema.modelFor(t);
    const o = this.schema.resolveConcreteModel(
      t,
      s.attributes ?? {}
    );
    o && (n = o.modelClass, i = t);
    const a = this.schema.polymorphicRootFor(t);
    a && (i = a);
    const r = this.identityMap.get(i, e);
    if (r)
      return p(() => {
        r._applyServerData(null, s.attributes ?? {}, s.relationships);
      }), this.trackInverseForResource(r, s), r;
    const l = n, h = I.push.call(l, {
      id: e,
      data: s.attributes ?? {},
      relationships: s.relationships,
      store: this
    });
    return this.identityMap.set(i, e, h), this.trackInverseForResource(h, s), h;
  }
  /**
   * After pushing a resource, updates the inverse side of every declared
   * inverse relationship so both sides stay consistent.
   */
  trackInverseForResource(s, t) {
    if (t.relationships)
      for (const [e, i] of Object.entries(t.relationships)) {
        const n = this.schema.relationshipsDefinitionFor(s.modelName).get(e);
        if (!n || !n.options.inverse || !i.data)
          continue;
        const o = Array.isArray(i.data) ? i.data : [i.data];
        for (const a of o)
          this.addInverse(a.type, a.id, n.options.inverse, s);
      }
  }
  /**
   * Adds `inverseRecord` to the inverse relationship on `targetType:targetId`.
   * No-ops when the target record is not in the identity map.
   */
  addInverse(s, t, e, i) {
    const n = this.identityMap.get(s, t);
    if (!n)
      return;
    const a = this.schema.relationshipsDefinitionFor(s).get(e);
    if (!a)
      return;
    const r = n._getRelationshipRef(e), l = { type: i.modelName, id: i.id };
    p(() => {
      if (a.kind === "hasMany") {
        const h = r != null && r.data && Array.isArray(r.data) ? r.data : [];
        h.some((u) => g.refEquals(u, l)) || n._setRelationshipRef(e, { data: [...h, l] });
      } else
        n._setRelationshipRef(e, { data: l });
    });
  }
  /**
   * Removes `inverseRecord` from the inverse relationship on `targetType:targetId`.
   * No-ops when the target record is not in the identity map.
   */
  removeInverse(s, t, e, i) {
    const n = this.identityMap.get(s, t);
    if (!n)
      return;
    const a = this.schema.relationshipsDefinitionFor(s).get(e);
    if (!a)
      return;
    const r = n._getRelationshipRef(e);
    p(() => {
      if (a.kind === "hasMany") {
        const h = (r != null && r.data && Array.isArray(r.data) ? r.data : []).filter((u) => !(u.id === i.id && u.type === i.modelName));
        n._setRelationshipRef(e, { data: h });
      } else
        n._setRelationshipRef(e, { data: null });
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
    const n = this.adapterFor(s);
    if (n.coalesceFindRequests && n.findMany && !e.include)
      return this.scheduleCoalescedFind(s, t);
    const o = i ? this.createSnapshot(i) : this.createEmptySnapshot(s, t), a = e.include ? { include: e.include, adapterOptions: e.adapterOptions } : e.adapterOptions ? { adapterOptions: e.adapterOptions } : void 0, r = await n.findRecord(this, s, t, o, a), l = O(r), h = this.serializerFor(s).normalizeResponse(
      this,
      this.schema.modelFor(s),
      r,
      t,
      "findRecord"
    ), u = this.push(h);
    if (this._cache) {
      const d = l ? C(l) : null;
      d !== 0 && this.cacheNormalizedDocument(h, d ?? void 0);
    }
    return u;
  }
  /**
   * Fetches all records of `modelName` from the server and returns a
   * `RecordArray` backed by the identity map.
   */
  async findAll(s, t = {}) {
    const e = this.adapterFor(s), i = t.include ? { include: t.include, adapterOptions: t.adapterOptions } : t.adapterOptions ? { adapterOptions: t.adapterOptions } : void 0, n = await e.findAll(this, s, null, [], i), o = O(n), a = this.serializerFor(s).normalizeResponse(
      this,
      this.schema.modelFor(s),
      n,
      null,
      "findAll"
    );
    if (this.push(a), this._cache) {
      const r = o ? C(o) : null;
      r !== 0 && this.cacheNormalizedDocument(a, r ?? void 0);
    }
    return this.peekAll(s);
  }
  /**
   * Executes an adapter query and returns an `AdapterPopulatedRecordArray`
   * whose `update()` method re-issues the same query.
   */
  async query(s, t) {
    const e = [], i = new B({
      modelName: s,
      query: t,
      source: () => e.map((n) => this.peekRecord(s, n)).filter((n) => n !== null),
      update: async () => {
        await this.runQuery(s, t, i, e);
      }
    });
    return await this.runQuery(s, t, i, e), i;
  }
  async runQuery(s, t, e, i) {
    const o = await this.adapterFor(s).query(this, s, t, e), a = this.serializerFor(s).normalizeResponse(
      this,
      this.schema.modelFor(s),
      o,
      null,
      "query"
    );
    if (this.push(a), i.length = 0, Array.isArray(a.data))
      for (const r of a.data)
        r.id && i.push(r.id);
    a.meta && e._setMeta(a.meta), a.links && e._setLinks(a.links);
  }
  /**
   * Executes an adapter query that returns at most one record.
   * Returns `null` when the adapter returns an empty payload.
   */
  async queryRecord(s, t) {
    const i = await this.adapterFor(s).queryRecord(this, s, t), n = this.serializerFor(s).normalizeResponse(
      this,
      this.schema.modelFor(s),
      i,
      null,
      "queryRecord"
    ), o = this.push(n);
    return Array.isArray(o) ? o[0] ?? null : o ?? null;
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
    const e = this.adapterFor(s.modelName), i = this.createSnapshot(s), { isNew: n } = s;
    let o;
    n ? o = await e.createRecord(this, s.modelName, i) : t.patch && e.patchRecord ? o = await e.patchRecord(this, s.modelName, i) : o = await e.updateRecord(this, s.modelName, i);
    const a = this.serializerFor(s.modelName).normalizeResponse(
      this,
      this.schema.modelFor(s.modelName),
      o,
      s.id,
      n ? "createRecord" : "updateRecord"
    ), r = a.data;
    if (r) {
      const l = r.id ?? s.id;
      p(() => {
        s._applyServerData(l, r.attributes ?? {}, r.relationships);
      }), n && l && (this.untrackNewRecord(s), this.identityMap.set(s.modelName, l, s));
    }
    if (a.included)
      for (const l of a.included)
        this.pushResource(l);
    if (this._cache && s.id) {
      const l = s, h = {};
      for (const [u, d] of l._relationships)
        h[u] = d;
      this._cache.set(s.modelName, s.id, { ...l._data }, {
        relationships: Object.keys(h).length > 0 ? h : void 0
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
    const t = this.adapterFor(s.modelName), e = this.createSnapshot(s), i = await t.findRecord(this, s.modelName, s.id, e), n = this.serializerFor(s.modelName).normalizeResponse(
      this,
      this.schema.modelFor(s.modelName),
      i,
      s.id,
      "findRecord"
    );
    return this.push(n), s;
  }
  // --- snapshot ---
  /**
   * Creates a `Snapshot` for a live record.
   * The snapshot reads directly from the record's internal state so it
   * reflects the current (possibly dirty) values.
   */
  createSnapshot(s) {
    const { modelName: t } = s, e = this.schema.attributesDefinitionFor(t), i = this.schema.relationshipsDefinitionFor(t), n = s;
    return {
      id: s.id,
      modelName: t,
      record: s,
      attr: (o) => n._data[o],
      belongsTo: (o, a) => {
        const r = n._getRelationshipRef(o);
        return !(r != null && r.data) || Array.isArray(r.data) ? null : a != null && a.id ? r.data.id : this.peekRecord(r.data.type, r.data.id);
      },
      hasMany: (o, a) => {
        const r = n._getRelationshipRef(o), l = r != null && r.data && Array.isArray(r.data) ? r.data : [];
        return a != null && a.ids ? l.map((h) => h.id) : l.map((h) => this.peekRecord(h.type, h.id)).filter((h) => h !== null);
      },
      changedAttributes: () => n.changedAttributes(),
      eachAttribute: (o) => {
        for (const [a, r] of e)
          o(a, r);
      },
      eachRelationship: (o) => {
        for (const [a, r] of i)
          o(a, r);
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
      modelName: s,
      record: null,
      attr: () => {
      },
      belongsTo: () => null,
      hasMany: () => [],
      changedAttributes: () => ({}),
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
    const i = e.options.async === !0, n = this.getRelationshipCache(s, t);
    if (n)
      return n;
    const o = {
      parent: s,
      name: t,
      meta: e,
      store: this
    };
    if (i) {
      if (e.kind === "belongsTo") {
        const l = new P(o);
        return this.setRelationshipCache(s, t, l), l;
      }
      const r = new E(o);
      return this.setRelationshipCache(s, t, r), r;
    }
    if (e.kind === "belongsTo") {
      const r = s._getRelationshipRef(t);
      return !(r != null && r.data) || Array.isArray(r.data) ? null : this.peekRecord(r.data.type, r.data.id);
    }
    const a = new L(o);
    return this.setRelationshipCache(s, t, a), a;
  }
  /**
   * Called by the `Model` `belongsTo` setter to update a relationship ref
   * and keep its inverse in sync.
   */
  setRelationshipValue(s, t, e, i) {
    if (e.kind !== "belongsTo")
      return;
    const n = s._getRelationshipRef(t), o = n != null && n.data && !Array.isArray(n.data) ? n.data : null;
    if (i == null) {
      p(() => {
        s._setRelationshipRef(t, { data: null });
      }), o && e.options.inverse && this.removeInverse(o.type, o.id, e.options.inverse, s);
      return;
    }
    const a = i, r = { type: a.modelName, id: a.id };
    p(() => {
      s._setRelationshipRef(t, { data: r });
    }), e.options.inverse && (o && !g.refEquals(o, r) && this.removeInverse(o.type, o.id, e.options.inverse, s), this.addInverse(r.type, r.id, e.options.inverse, s));
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
    let n = i.get(t);
    n || (n = R.set(), i.set(t, n)), n.add(e);
  }
  removePendingMember(s, t, e) {
    var i, n;
    (n = (i = this.pendingMembers.get(s)) == null ? void 0 : i.get(t)) == null || n.delete(e);
  }
  /**
   * Appends `value` to the `hasMany` relationship ref on `record` and syncs
   * the inverse.  Unsaved records (`value.id === null`) are tracked as
   * "pending members" until they are persisted.
   */
  _hasManyAppend(s, t, e, i) {
    if (i.id === null) {
      if (this.addPendingMember(s, t, i), e.options.inverse) {
        const r = this.schema.relationshipsDefinitionFor(i.modelName).get(e.options.inverse);
        (r == null ? void 0 : r.kind) === "belongsTo" && p(() => {
          i._setRelationshipRef(e.options.inverse, {
            data: { type: s.modelName, id: s.id }
          });
        });
      }
      return;
    }
    const n = this._getRelationshipRefFor(s, t), o = n != null && n.data && Array.isArray(n.data) ? n.data : [], a = { type: i.modelName, id: i.id };
    o.some((r) => g.refEquals(r, a)) || p(() => {
      s._setRelationshipRef(t, { data: [...o, a] });
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
    const n = this._getRelationshipRefFor(s, t), a = (n != null && n.data && Array.isArray(n.data) ? n.data : []).filter(
      (r) => !(r.id === i.id && r.type === i.modelName)
    );
    p(() => {
      s._setRelationshipRef(t, { data: a });
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
      let n = this.coalescePending.get(s);
      n || (n = /* @__PURE__ */ new Map(), this.coalescePending.set(s, n));
      let o = n.get(t);
      o || (o = [], n.set(t, o)), o.push({ resolve: e, reject: i }), this.coalesceScheduled.has(s) || (this.coalesceScheduled.add(s), queueMicrotask(() => this.flushCoalescedFind(s)));
    });
  }
  async flushCoalescedFind(s) {
    this.coalesceScheduled.delete(s);
    const t = this.coalescePending.get(s), e = new Map(t);
    t.clear();
    const i = Array.from(e.keys()), n = this.adapterFor(s);
    try {
      const o = i.map((l) => {
        const h = this.peekRecord(s, l);
        return h ? this.createSnapshot(h) : this.createEmptySnapshot(s, l);
      }), a = await n.findMany(this, s, i, o), r = this.serializerFor(s).normalizeResponse(
        this,
        this.schema.modelFor(s),
        a,
        null,
        "findMany"
      );
      this.push(r);
      for (const l of i) {
        const h = this.peekRecord(s, l), u = e.get(l);
        if (u)
          for (const d of u)
            h ? d.resolve(h) : d.reject(new Error(`Record not found after findMany: ${s}:${l}`));
      }
    } catch (o) {
      for (const a of e.values())
        for (const r of a)
          r.reject(o);
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
    const i = s, n = { ...i._data };
    p(() => {
      Object.assign(i._data, t);
    });
    try {
      return await e(), s;
    } catch (o) {
      throw p(() => {
        for (const [a, r] of Object.entries(n))
          i._data[a] = r;
      }), o;
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
    for (const [n, o] of e) {
      const a = (i = s.exclude) == null ? void 0 : i[n], r = [];
      for (const [l, h] of o) {
        const u = h;
        let d;
        if (a && a.length > 0) {
          d = {};
          for (const [m, k] of Object.entries(u._data))
            a.includes(m) || (d[m] = k);
        } else
          d = { ...u._data };
        const b = {
          id: l,
          attributes: d
        };
        if (u._relationships && u._relationships.size > 0) {
          const m = {};
          for (const [k, D] of u._relationships)
            m[k] = D;
          b.relationships = m;
        }
        r.push(b);
      }
      r.length > 0 && (t[n] = r);
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
g = H([
  _(),
  M(),
  x(0, N($))
], g);
export {
  B as A,
  j as I,
  c as M,
  U as O,
  A as R,
  g as S,
  T as a,
  w as b,
  W as c,
  f as d
};
//# sourceMappingURL=Store-BC3Tsy-Z.js.map
