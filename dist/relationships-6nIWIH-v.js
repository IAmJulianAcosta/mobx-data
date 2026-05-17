import "reflect-metadata";
import { makeObservable as c, action as d, computed as a, observable as h, runInAction as l } from "mobx";
import { A as S, R as v } from "./types-C9NB2gRj.js";
import { injectable as b } from "tsyringe";
var R = Object.getOwnPropertyDescriptor, w = (o, t, e, i) => {
  for (var r = i > 1 ? void 0 : i ? R(t, e) : t, s = o.length - 1, n; s >= 0; s--)
    (n = o[s]) && (r = n(r) || r);
  return r;
};
let g = class {
  constructor() {
    this._errors = /* @__PURE__ */ new Map(), c(this, {
      _errors: h.shallow,
      isEmpty: a,
      length: a,
      add: d,
      remove: d,
      clear: d
    });
  }
  /** `true` when there are no validation errors. */
  get isEmpty() {
    return this._errors.size === 0;
  }
  /** Total number of error messages across all attributes. */
  get length() {
    let o = 0;
    for (const t of this._errors.values())
      o += t.length;
    return o;
  }
  /** Returns all error messages for `attribute`, or an empty array. */
  get(o) {
    return this._errors.get(o) ?? [];
  }
  /** Returns `true` when `attribute` has at least one error message. */
  has(o) {
    const t = this._errors.get(o);
    return !!t && t.length > 0;
  }
  /**
   * Appends one or more error messages for `attribute`.
   * Existing messages are preserved — this is an additive operation.
   */
  add(o, t) {
    const e = Array.isArray(t) ? t : [t], r = [
      ...this._errors.get(o) ?? [],
      ...e.map((s) => ({ attribute: o, message: s }))
    ];
    this._errors.set(o, r);
  }
  /** Removes all error messages for `attribute`. */
  remove(o) {
    this._errors.delete(o);
  }
  /** Removes all error messages for every attribute. */
  clear() {
    this._errors.clear();
  }
  /** Iterates `[attributeName, ErrorMessage[]]` pairs. */
  *[Symbol.iterator]() {
    for (const o of this._errors.entries())
      yield o;
  }
};
g = w([
  b()
], g);
const A = {
  "root.empty": {
    loadingData: "root.loading",
    pushedData: "root.loaded.saved"
  },
  "root.loading": {
    pushedData: "root.loaded.saved",
    becameError: "root.error"
  },
  "root.loaded.saved": {
    didSetProperty: "root.loaded.updated.uncommitted",
    deleteRecord: "root.deleted.uncommitted",
    loadingData: "root.loading",
    pushedData: "root.loaded.saved",
    unloadRecord: "root.empty"
  },
  "root.loaded.created.uncommitted": {
    willCommit: "root.loaded.created.inFlight",
    rolledBack: "root.empty",
    deleteRecord: "root.deleted.uncommitted",
    didSetProperty: "root.loaded.created.uncommitted",
    unloadRecord: "root.empty"
  },
  "root.loaded.created.inFlight": {
    didCommit: "root.loaded.saved",
    becameInvalid: "root.loaded.created.uncommitted",
    becameError: "root.error"
  },
  "root.loaded.updated.uncommitted": {
    willCommit: "root.loaded.updated.inFlight",
    rolledBack: "root.loaded.saved",
    didSetProperty: "root.loaded.updated.uncommitted",
    deleteRecord: "root.deleted.uncommitted",
    unloadRecord: "root.empty"
  },
  "root.loaded.updated.inFlight": {
    didCommit: "root.loaded.saved",
    becameInvalid: "root.loaded.updated.uncommitted",
    becameError: "root.error"
  },
  "root.deleted.uncommitted": {
    willCommit: "root.deleted.inFlight",
    rolledBack: "root.loaded.saved",
    unloadRecord: "root.empty"
  },
  "root.deleted.inFlight": {
    didCommit: "root.deleted.saved",
    becameError: "root.error"
  },
  "root.deleted.saved": {
    unloadRecord: "root.empty"
  },
  "root.error": {
    rolledBack: "root.loaded.saved",
    unloadRecord: "root.empty"
  }
};
class D {
  constructor(t = "root.empty") {
    this.current = t, c(this, {
      current: h,
      transition: d
    });
  }
  /**
   * Applies `event` to the current state, updates `current`, and returns the
   * new state.
   *
   * @throws `Error` when `event` is not permitted from the current state.
   */
  transition(t) {
    const e = A[this.current][t];
    if (!e)
      throw new Error(
        `Invalid transition: event "${t}" not allowed from state "${this.current}"`
      );
    return this.current = e, e;
  }
}
function p(o, t) {
  const e = [];
  let i = o;
  for (; i && i !== Object.prototype; )
    e.push(i), i = Object.getPrototypeOf(i);
  const r = /* @__PURE__ */ new Map();
  for (const s of e.reverse()) {
    const n = Reflect.getOwnMetadata(t, s);
    if (n)
      for (const [f, m] of n)
        r.set(f, m);
  }
  return r;
}
class M {
  constructor(t) {
    this.record = t, this.id = t.id, this.modelName = t.modelName;
    const e = t;
    this._attributes = { ...e._data }, this._relationships = new Map(e._relationships), this._changedAttributes = t.changedAttributes();
    const i = Object.getPrototypeOf(t);
    this._attributeDefinitions = p(i, S), this._relationshipDefinitions = p(i, v);
  }
  /** Returns the snapshot-time value for an attribute key. */
  attr(t) {
    return this._attributes[t];
  }
  /**
   * Returns the `belongsTo` reference for `key`.
   * When `{ id: true }` is passed, returns only the id string; otherwise
   * returns a `BelongsToReference` `{ id, type }` object, or `null` when the
   * relationship is empty.
   */
  belongsTo(t, e) {
    const i = this._relationships.get(t);
    if (!i || i.data === null)
      return null;
    const r = i.data;
    return e != null && e.id ? r.id : { id: r.id, type: r.type };
  }
  /**
   * Returns the `hasMany` references for `key`.
   * When `{ ids: true }` is passed, returns a plain string array of ids;
   * otherwise returns an array of `HasManyReference` objects.
   */
  hasMany(t, e) {
    const i = this._relationships.get(t);
    if (!i || !Array.isArray(i.data))
      return [];
    const r = i.data;
    return e != null && e.ids ? r.map((s) => s.id) : r.map((s) => ({ id: s.id, type: s.type }));
  }
  /**
   * Returns a `{ [key]: [original, current] }` map of attributes that
   * differ from the server-received values at snapshot time.
   */
  changedAttributes() {
    return { ...this._changedAttributes };
  }
  /** Iterates over every attribute definition, calling `callback` for each. */
  eachAttribute(t) {
    for (const [e, i] of this._attributeDefinitions)
      t(e, i);
  }
  /** Iterates over every relationship definition, calling `callback` for each. */
  eachRelationship(t) {
    for (const [e, i] of this._relationshipDefinitions)
      t(e, i);
  }
}
const _ = Symbol("mobx-data:accessors-installed");
function y(o, t) {
  const e = [];
  let i = o;
  for (; i && i !== Object.prototype; )
    e.push(i), i = Object.getPrototypeOf(i);
  const r = /* @__PURE__ */ new Map();
  for (const s of e.reverse()) {
    const n = Reflect.getOwnMetadata(t, s);
    if (n)
      for (const [f, m] of n)
        r.set(f, m);
  }
  return r;
}
function C(o) {
  const t = o.prototype;
  if (o[_])
    return;
  o[_] = !0;
  const e = y(t, S);
  for (const [r] of e)
    Object.defineProperty(t, r, {
      get() {
        return this._data[r];
      },
      set(s) {
        this._setAttribute(
          r,
          s
        );
      },
      configurable: !0,
      enumerable: !0
    });
  const i = y(t, v);
  for (const [r, s] of i)
    Object.defineProperty(t, r, {
      get() {
        return this._resolveRelationship(r, s);
      },
      set(n) {
        this._setRelationship(r, s, n);
      },
      configurable: !0,
      enumerable: !0
    });
}
class P {
  constructor(t = {}) {
    this._data = {}, this._originalData = {}, this._relationships = /* @__PURE__ */ new Map(), this._id = null, this.errors = new g();
    const e = t;
    C(this.constructor), this._id = e.id ?? null, this.store = e.store, this._stateMachine = new D(
      e.__initialState ?? "root.loaded.created.uncommitted"
    );
    const i = e.data ? { ...e.data } : {};
    if (this._data = i, e.__initialState === "root.loaded.saved" ? this._originalData = { ...i } : this._originalData = {}, e.relationships)
      for (const [r, s] of Object.entries(e.relationships))
        this._relationships.set(r, s);
    c(this, {
      _data: h.deep,
      _originalData: h.ref,
      _relationships: h.shallow,
      _id: h,
      id: a,
      currentState: a,
      isLoading: a,
      isLoaded: a,
      isSaving: a,
      isDirty: a,
      hasDirtyAttributes: a,
      isNew: a,
      isDeleted: a,
      isValid: a,
      isError: a,
      isEmpty: a,
      _setAttribute: d,
      _transitionIfClean: d,
      _applyServerData: d,
      _setState: d,
      rollbackAttributes: d,
      deleteRecord: d
    });
  }
  /**
   * Factory method that creates an instance in the `root.loaded.saved` state
   * (i.e. as if freshly loaded from the server) and calls `didLoad()`.
   *
   * Used internally by `Store.pushResource` to avoid exposing the internal
   * `__initialState` option.
   */
  static push(t) {
    const e = this, i = new e({
      ...t,
      __initialState: "root.loaded.saved"
    });
    return i.didLoad(), i;
  }
  /** Server-assigned id, or `null` for new records. */
  get id() {
    return this._id;
  }
  set id(t) {
    l(() => {
      this._id = t;
    });
  }
  /** Returns the static `modelName` from the concrete subclass constructor. */
  get modelName() {
    return this.constructor.modelName;
  }
  /** Current state-machine state string. */
  get currentState() {
    return this._stateMachine.current;
  }
  /** `true` while an adapter request to fetch this record is in flight. */
  get isLoading() {
    return this.currentState === "root.loading";
  }
  /** `true` when the record has been loaded (any `root.loaded.*` state). */
  get isLoaded() {
    return this.currentState.startsWith("root.loaded");
  }
  /** `true` while a create or update request is in flight. */
  get isSaving() {
    return this.currentState.endsWith(".inFlight");
  }
  /** `true` when the record was created locally and has never been saved. */
  get isNew() {
    return this.currentState.startsWith("root.loaded.created");
  }
  /** `true` when `deleteRecord()` has been called (regardless of server state). */
  get isDeleted() {
    return this.currentState.startsWith("root.deleted");
  }
  /** `true` when the record is in the `root.error` state. */
  get isError() {
    return this.currentState === "root.error";
  }
  /** `true` when the record is in the `root.empty` placeholder state. */
  get isEmpty() {
    return this.currentState === "root.empty";
  }
  /** `true` when any attribute differs from its last-saved value. */
  get hasDirtyAttributes() {
    const t = this._data, e = this._originalData;
    for (const i of Object.keys(t))
      if (!Object.is(t[i], e[i]))
        return !0;
    for (const i of Object.keys(e))
      if (!(i in t))
        return !0;
    return !1;
  }
  /**
   * `true` when the record needs to be saved — new, deleted (not yet
   * confirmed), or has dirty attributes.
   */
  get isDirty() {
    return this.isNew || this.isDeleted && this.currentState !== "root.deleted.saved" ? !0 : this.hasDirtyAttributes;
  }
  /** `true` when `errors.isEmpty` — i.e. no validation errors are present. */
  get isValid() {
    return this.errors.isEmpty;
  }
  /**
   * Returns a `{ [key]: [original, current] }` map of attributes that differ
   * from the last server-received snapshot.
   */
  changedAttributes() {
    const t = {}, e = /* @__PURE__ */ new Set([
      ...Object.keys(this._data),
      ...Object.keys(this._originalData)
    ]);
    for (const i of e) {
      const r = this._data[i], s = this._originalData[i];
      Object.is(r, s) || (t[i] = [s, r]);
    }
    return t;
  }
  /**
   * Resets all attributes to their original server values and clears
   * validation errors.  For new records the record is transitioned to
   * `root.empty` and unloaded from the store.
   */
  rollbackAttributes() {
    var t;
    if (this._data = { ...this._originalData }, this.errors.clear(), this.isNew) {
      this._setState("root.empty"), (t = this.store) != null && t.unloadRecord && this.store.unloadRecord(this);
      return;
    }
    this.currentState === "root.loaded.updated.uncommitted" ? this._stateMachine.transition("rolledBack") : this.currentState === "root.deleted.uncommitted" && this._stateMachine.transition("rolledBack");
  }
  /**
   * Persists the record to the server.  No-ops if the record is not dirty.
   * Delegates to `store.saveRecord`.
   *
   * @throws when no store is attached.
   */
  async save(t = {}) {
    var i;
    if (!this.isDirty)
      return this;
    if (!((i = this.store) != null && i.saveRecord))
      throw new Error("Cannot save: no store attached");
    const e = this.isNew;
    this.willSave(), this._stateMachine.transition("willCommit");
    try {
      return await this.store.saveRecord(this, t), (this.currentState === "root.loaded.created.inFlight" || this.currentState === "root.loaded.updated.inFlight") && l(() => {
        this._originalData = { ...this._data }, this._stateMachine.transition("didCommit");
      }), e ? this.didCreate() : this.didUpdate(), this.didSave(), this;
    } catch (r) {
      throw this.errors.isEmpty ? (this._stateMachine.transition("becameError"), this.becameError()) : (this._stateMachine.transition("becameInvalid"), this.becameInvalid()), r;
    }
  }
  /**
   * Reloads the record from the server.
   * @throws when no store is attached.
   */
  async reload() {
    var t;
    if (!((t = this.store) != null && t.reloadRecord))
      throw new Error("Cannot reload: no store attached");
    return await this.store.reloadRecord(this);
  }
  /**
   * Marks the record for deletion.  The record moves to
   * `root.deleted.uncommitted` but is not yet removed from the server.
   * Call `destroyRecord()` to also issue the DELETE request.
   */
  deleteRecord() {
    this.isNew ? this._setState("root.deleted.uncommitted") : this._stateMachine.transition("deleteRecord");
  }
  /**
   * Marks the record for deletion and immediately sends a DELETE request.
   * @throws when no store is attached.
   */
  async destroyRecord() {
    var e;
    if (this.deleteRecord(), !((e = this.store) != null && e.deleteRecord))
      throw new Error("Cannot destroy: no store attached");
    this._stateMachine.transition("willCommit");
    const t = await this.store.deleteRecord(this);
    return this.currentState === "root.deleted.inFlight" && this._stateMachine.transition("didCommit"), this.didDelete(), t;
  }
  /** Removes the record from the store's identity map without a server call. */
  unloadRecord() {
    var t;
    (t = this.store) != null && t.unloadRecord && this.store.unloadRecord(this);
  }
  /** Creates a frozen `Snapshot` of the current record state. */
  createSnapshot() {
    return new M(this);
  }
  /** Returns a plain-object representation of the current attribute data. */
  serialize(t = {}) {
    return { ...this._data };
  }
  /** Returns `{ id, ...attributes }` — used by `JSON.stringify`. */
  toJSON() {
    return { id: this._id, ...this._data };
  }
  // Lifecycle hooks — default no-ops, overridable.
  /** Called after the record is loaded from the server. */
  didLoad() {
  }
  /** Called after a new record is successfully persisted. */
  didCreate() {
  }
  /** Called after an existing record is successfully updated. */
  didUpdate() {
  }
  /** Called after a record is successfully deleted. */
  didDelete() {
  }
  /** Called immediately before a save request is issued. */
  willSave() {
  }
  /** Called after any successful save (create or update). */
  didSave() {
  }
  /** Called when the server returns a 422-style validation error. */
  becameInvalid() {
  }
  /** Called when the server returns a non-validation error. */
  becameError() {
  }
  // --- internals ---
  /** Called by generated attribute setters. */
  _setAttribute(t, e) {
    Object.is(this._data[t], e) || (this._data[t] = e, this._transitionIfClean());
  }
  /**
   * Transitions to `updated.uncommitted` when the record becomes dirty, or
   * back to `saved` when all changes are rolled back.
   */
  _transitionIfClean() {
    const t = this.hasDirtyAttributes;
    t && this.currentState === "root.loaded.saved" ? this._stateMachine.transition("didSetProperty") : !t && this.currentState === "root.loaded.updated.uncommitted" && this._stateMachine.transition("rolledBack");
  }
  /** Directly sets the state machine's current state (bypasses transition validation). */
  _setState(t) {
    this._stateMachine.current = t;
  }
  /** Fires a state-machine transition event. */
  _transition(t) {
    this._stateMachine.transition(t);
  }
  /** Used by Store to apply server data after save, making record clean again. */
  _applyServerData(t, e, i) {
    if (t !== null && (this._id = t), this._data = { ...this._data, ...e }, this._originalData = { ...this._data }, this.errors.clear(), i)
      for (const [r, s] of Object.entries(i))
        this._relationships.set(r, s);
    this.currentState === "root.loaded.created.inFlight" ? (this._stateMachine.transition("didCommit"), this.didCreate()) : this.currentState === "root.loaded.updated.inFlight" ? (this._stateMachine.transition("didCommit"), this.didUpdate()) : this.currentState === "root.deleted.inFlight" ? this._stateMachine.transition("didCommit") : this.currentState === "root.loading" && this._stateMachine.transition("pushedData"), !this.isNew && !this.isDeleted && (this.currentState === "root.loaded.updated.uncommitted" || this.currentState === "root.loaded.created.uncommitted") && this._setState("root.loaded.saved");
  }
  /** Relationship data (reference only). Resolution to records lives in Store. */
  _getRelationshipRef(t) {
    return this._relationships.get(t) ?? null;
  }
  /** Stores a raw relationship reference without triggering store logic. */
  _setRelationshipRef(t, e) {
    this._relationships.set(t, e);
  }
  /**
   * Delegates relationship resolution to the store.
   * Returns `null` when no store is attached (e.g. in unit tests).
   */
  _resolveRelationship(t, e) {
    var i;
    return (i = this.store) != null && i.resolveRelationship ? this.store.resolveRelationship(this, t, e) : null;
  }
  /** Delegates relationship mutation to the store (which also handles inverse sync). */
  _setRelationship(t, e, i) {
    var r;
    (r = this.store) != null && r.setRelationshipValue && this.store.setRelationshipValue(this, t, e, i);
  }
}
class u {
  static refData(t) {
    return !t || !t.data ? [] : Array.isArray(t.data) ? t.data : [];
  }
  constructor(t) {
    this.host = t, c(this, {
      resolved: a,
      length: a,
      push: d,
      removeObject: d
    });
  }
  /**
   * Resolves the current set of related records from the store identity map.
   * Pending (unsaved) members appended via `push()` are appended at the end.
   */
  get resolved() {
    const t = this.host.store._getRelationshipRefFor(this.host.parent, this.host.name), e = [], i = /* @__PURE__ */ new Set();
    for (const s of u.refData(t)) {
      const n = this.host.store.peekRecord(s.type, s.id);
      n && (e.push(n), i.add(n));
    }
    const r = this.host.store._getPendingMembers(
      this.host.parent,
      this.host.name
    );
    for (const s of r)
      i.has(s) || e.push(s);
    return e;
  }
  /** Number of related records currently in the array. */
  get length() {
    return this.resolved.length;
  }
  /** Returns the record at `index`, or `undefined`. */
  at(t) {
    return this.resolved[t];
  }
  /**
   * Adds one or more records to the relationship.
   * Delegates to `store._hasManyAppend` which also handles inverse tracking.
   */
  push(...t) {
    for (const e of t)
      this.host.store._hasManyAppend(
        this.host.parent,
        this.host.name,
        this.host.meta,
        e
      );
    return this.length;
  }
  /**
   * Removes a record from the relationship.
   * Delegates to `store._hasManyRemove` which also handles inverse tracking.
   */
  removeObject(t) {
    this.host.store._hasManyRemove(
      this.host.parent,
      this.host.name,
      this.host.meta,
      t
    );
  }
  /** Returns `true` when `record` is currently in the relationship. */
  includes(t) {
    return this.resolved.includes(t);
  }
  /** Returns a plain array snapshot of all related records. */
  toArray() {
    return [...this.resolved];
  }
  /** Maps over the related records. */
  map(t) {
    return this.resolved.map(t);
  }
  /** Filters the related records. */
  filter(t) {
    return this.resolved.filter(t);
  }
  /** Iterates over the related records. */
  forEach(t) {
    this.resolved.forEach(t);
  }
  [Symbol.iterator]() {
    return this.resolved[Symbol.iterator]();
  }
}
class k {
  constructor(t) {
    this.loadedState = "pending", this.currentValue = null, this.error = null, this.inflight = null, this.host = t, c(this, {
      loadedState: h,
      currentValue: h.ref,
      error: h.ref,
      isPending: a,
      isFulfilled: a,
      isRejected: a,
      isLoaded: a,
      isLoading: a,
      value: a,
      reason: a,
      syncFromCache: d
    }), this.syncFromCache();
  }
  /** Checks the store cache and transitions to `fulfilled` if the record is already loaded. */
  syncFromCache() {
    const t = this.host.store._getRelationshipRefFor(this.host.parent, this.host.name);
    if (!t || !t.data || Array.isArray(t.data)) {
      this.currentValue = null, this.loadedState = "fulfilled";
      return;
    }
    const e = this.host.store.peekRecord(t.data.type, t.data.id);
    e && (this.currentValue = e, this.loadedState = "fulfilled");
  }
  /** `true` while the relationship has not yet been resolved. */
  get isPending() {
    return this.loadedState === "pending";
  }
  /** `true` once the relationship has been resolved (including to `null`). */
  get isFulfilled() {
    return this.loadedState === "fulfilled";
  }
  /** `true` if the network request failed. */
  get isRejected() {
    return this.loadedState === "rejected";
  }
  /** `true` while a network request is in flight. */
  get isLoading() {
    return this.inflight !== null && this.isPending;
  }
  /** `true` once the relationship is resolved. */
  get isLoaded() {
    return this.loadedState === "fulfilled";
  }
  /** The resolved record, or `null` when the relationship is empty or not yet loaded. */
  get value() {
    return this.currentValue;
  }
  /** The rejection reason if `isRejected`. */
  get reason() {
    return this.error;
  }
  /**
   * Ensures the related record is loaded, returning a `Promise<T | null>`.
   * If the record is already in the store it resolves immediately.
   * Concurrent calls share the same in-flight promise.
   */
  load() {
    if (this.syncFromCache(), this.loadedState === "fulfilled" && this.currentValue)
      return Promise.resolve(this.currentValue);
    if (this.inflight)
      return this.inflight;
    const t = this.host.store._getRelationshipRefFor(this.host.parent, this.host.name);
    if (!t || !t.data || Array.isArray(t.data))
      return Promise.resolve(null);
    const { type: e, id: i } = t.data;
    return this.inflight = this.host.store.findRecord(e, i).then(
      (r) => (l(() => {
        this.currentValue = r, this.loadedState = "fulfilled", this.inflight = null;
      }), r),
      (r) => {
        throw l(() => {
          this.error = r, this.loadedState = "rejected", this.inflight = null;
        }), r;
      }
    ), this.inflight;
  }
  /** Forces a fresh fetch, ignoring any cached value. */
  reload() {
    return this.inflight = null, this.loadedState = "pending", this.load();
  }
  then(t, e) {
    return this.load().then(t, e);
  }
}
class L {
  constructor(t) {
    this.loadedState = "pending", this.error = null, this.inflight = null, this.host = t, this.manyArray = new u(t), c(this, {
      loadedState: h,
      error: h.ref,
      isPending: a,
      isFulfilled: a,
      isRejected: a,
      isLoaded: a,
      isLoading: a,
      length: a,
      syncFromCache: d
    }), this.syncFromCache();
  }
  /** Transitions to `fulfilled` if all referenced records are already in the cache. */
  syncFromCache() {
    const t = this.host.store._getRelationshipRefFor(this.host.parent, this.host.name);
    u.refData(t).every(
      (r) => this.host.store.peekRecord(r.type, r.id) !== null
    ) && (this.loadedState = "fulfilled");
  }
  /** `true` while the relationship has not yet been resolved. */
  get isPending() {
    return this.loadedState === "pending";
  }
  /** `true` once all referenced records have been resolved. */
  get isFulfilled() {
    return this.loadedState === "fulfilled";
  }
  /** `true` if any fetch failed. */
  get isRejected() {
    return this.loadedState === "rejected";
  }
  /** `true` while a network request is in flight. */
  get isLoading() {
    return this.inflight !== null && this.isPending;
  }
  /** `true` once the relationship is resolved. */
  get isLoaded() {
    return this.loadedState === "fulfilled";
  }
  /** The underlying `ManyArray` (always available, even before `load()`). */
  get value() {
    return this.manyArray;
  }
  /** Number of records currently in the resolved array. */
  get length() {
    return this.manyArray.length;
  }
  /**
   * Ensures all referenced records are loaded.
   * Records already in the cache are not re-fetched.
   * Concurrent calls share the same in-flight promise.
   */
  load() {
    if (this.syncFromCache(), this.loadedState === "fulfilled")
      return Promise.resolve(this.manyArray);
    if (this.inflight)
      return this.inflight;
    const t = this.host.store._getRelationshipRefFor(this.host.parent, this.host.name), r = u.refData(t).filter(
      (s) => this.host.store.peekRecord(s.type, s.id) === null
    ).map(
      (s) => this.host.store.findRecord(s.type, s.id)
    );
    return this.inflight = Promise.all(r).then(
      () => (l(() => {
        this.loadedState = "fulfilled", this.inflight = null;
      }), this.manyArray),
      (s) => {
        throw l(() => {
          this.error = s, this.loadedState = "rejected", this.inflight = null;
        }), s;
      }
    ), this.inflight;
  }
  /** Forces a fresh fetch, ignoring any cached state. */
  reload() {
    return this.inflight = null, this.loadedState = "pending", this.load();
  }
  then(t, e) {
    return this.load().then(t, e);
  }
}
export {
  k as A,
  g as E,
  u as M,
  M as S,
  L as a,
  P as b,
  D as c
};
//# sourceMappingURL=relationships-6nIWIH-v.js.map
