/**
 * Base class for all mobx-data model records.
 *
 * `Model` is an abstract MobX-observable class that manages the complete
 * lifecycle of a server-side resource.  Subclasses declare their schema using
 * `@attr`, `@belongsTo`, and `@hasMany` decorators; `Model` automatically
 * installs observable getters/setters for each declaration the first time the
 * class is instantiated.
 *
 * ## State machine
 * Every record progresses through the states tracked by `StateMachine`:
 * - **empty** → initial placeholder state
 * - **loading** → adapter request in flight
 * - **loaded.saved** → clean, persisted record
 * - **loaded.created.uncommitted** → new, unsaved record
 * - **loaded.updated.uncommitted** → dirty, unsaved changes
 * - **deleted.***  → record marked for / undergoing deletion
 * - **error** → adapter threw a non-validation error
 *
 * ## Lifecycle hooks
 * Override `didLoad`, `didCreate`, `didUpdate`, `didDelete`, `willSave`,
 * `didSave`, `becameInvalid`, and `becameError` to react to state transitions.
 *
 * ## Store integration
 * Records are normally created and loaded through a `Store` instance.  The
 * `store` property is set by the store after instantiation so that `save()`,
 * `reload()`, and `destroyRecord()` can delegate back to it.
 */

import 'reflect-metadata';
import {
  makeObservable,
  observable,
  computed,
  action,
  runInAction,
} from 'mobx';
import {
  ATTRIBUTES_META_KEY,
  RELATIONSHIPS_META_KEY,
  type AttributeDef,
  type RelationshipDef,
} from '@mobx-data/schema';
import { Errors } from './Errors.js';
import { StateMachine, type RecordState, type RecordEvent } from './StateMachine.js';
import { Snapshot } from './Snapshot.js';

let clientIdCounter = 0;

function generateClientId(): string {
  clientIdCounter += 1;
  return `client-${clientIdCounter}`;
}

/**
 * Raw relationship reference stored on the record.
 * Contains either a single `{ type, id }` object (belongsTo),
 * an array of them (hasMany), or `null`.
 */
export interface RelationshipRef {
  data:
  | { type: string; id: string }
  | Array<{ type: string; id: string }>
  | null;
}

/**
 * Minimal store interface that `Model` uses to delegate persistence operations.
 * The full `Store` class satisfies this interface.
 */
export interface SaveOptions {
  patch?: boolean;
  adapterOptions?: Record<string, unknown>;
}

export interface ModelStoreLike {
  saveRecord?<T extends Model>(record: T, options?: SaveOptions): Promise<T>;
  deleteRecord?<T extends Model>(record: T): Promise<T>;
  reloadRecord?<T extends Model>(record: T): Promise<T>;
  unloadRecord?(record: Model): void;
  peekRecord?<T extends Model = Model>(type: string, id: string): T | null;
  findRecord?<T extends Model = Model>(
    type: string,
    id: string,
    options?: unknown,
  ): Promise<T>;
  onRelationshipSet?(
    record: Model,
    relName: string,
    ref: RelationshipRef,
  ): void;
  resolveRelationship?(
    record: Model,
    name: string,
    meta: RelationshipDef,
  ): unknown;
  setRelationshipValue?(
    record: Model,
    name: string,
    meta: RelationshipDef,
    value: unknown,
  ): void;
}

/** Options accepted by the `Model` constructor. */
export interface ModelConstructorOptions {
  /** Server-assigned id, or `null` / `undefined` for new records. */
  id?: string | null;
  /** Initial attribute data. */
  data?: Record<string, unknown>;
  /** Initial relationship references. */
  relationships?: Record<string, RelationshipRef>;
  /** Store instance injected so records can delegate persistence. */
  store?: ModelStoreLike;
}

/** Options accepted by the static `Model.push` factory method. */
export interface PushOptions {
  id: string;
  data: Record<string, unknown>;
  relationships?: Record<string, RelationshipRef>;
  store?: ModelStoreLike;
}

/** Internal constructor options that include the initial state override. */
interface InternalOptions extends ModelConstructorOptions {
  __initialState?: RecordState;
}

/** Symbol used as a per-class flag to avoid reinstalling accessors. */
const ACCESSORS_INSTALLED = Symbol('mobx-data:accessors-installed');

/**
 * Walks the prototype chain from root to leaf and merges own-metadata
 * entries, with subclass definitions overriding ancestors.
 */
function walkProto<V>(
  proto: object | null,
  metadataKey: symbol,
): Map<string, V> {
  const chain: object[] = [];
  let current: object | null = proto;
  while (current && current !== Object.prototype) {
    chain.push(current);
    current = Object.getPrototypeOf(current);
  }
  const merged = new Map<string, V>();
  for (const entry of chain.reverse()) {
    const local = Reflect.getOwnMetadata(metadataKey, entry) as
      | Map<string, V>
      | undefined;
    if (local) {
      for (const [name, value] of local) {
        merged.set(name, value);
      }
    }
  }
  return merged;
}

/**
 * Installs observable getters/setters on the class prototype for every
 * `@attr` and `@belongsTo` / `@hasMany` declaration.
 *
 * Run once per class (guarded by `ACCESSORS_INSTALLED`); subsequent
 * instantiations are a no-op.
 */
function ensureAccessorsInstalled(klass: Function): void {
  const proto = klass.prototype as Record<PropertyKey, unknown> & {
    [ACCESSORS_INSTALLED]?: boolean;
  };
  if ((klass as unknown as Record<symbol, unknown>)[ACCESSORS_INSTALLED]) {
    return;
  }
  (klass as unknown as Record<symbol, unknown>)[ACCESSORS_INSTALLED] = true;

  const attrs = walkProto<AttributeDef>(proto as object, ATTRIBUTES_META_KEY);
  for (const [name] of attrs) {
    Object.defineProperty(proto, name, {
      get(this: Model) {
        return (this as unknown as { _data: Record<string, unknown> })._data[name];
      },
      set(this: Model, value: unknown) {
        (this as unknown as { _setAttribute(k: string, v: unknown): void })._setAttribute(
          name,
          value,
        );
      },
      configurable: true,
      enumerable: true,
    });
  }

  const relationships = walkProto<RelationshipDef>(proto as object, RELATIONSHIPS_META_KEY);
  for (const [name, meta] of relationships) {
    Object.defineProperty(proto, name, {
      get(this: Model) {
        return (this as unknown as {
          _resolveRelationship(name: string, meta: RelationshipDef): unknown;
        })._resolveRelationship(name, meta);
      },
      set(this: Model, value: unknown) {
        (this as unknown as {
          _setRelationship(name: string, meta: RelationshipDef, value: unknown): void;
        })._setRelationship(name, meta, value);
      },
      configurable: true,
      enumerable: true,
    });
  }
}

export abstract class Model {
  /** Registered model name — must be set as a static property on subclasses. */
  static modelName: string;

  /**
   * Factory method that creates an instance in the `root.loaded.saved` state
   * (i.e. as if freshly loaded from the server) and calls `didLoad()`.
   *
   * Used internally by `Store.pushResource` to avoid exposing the internal
   * `__initialState` option.
   */
  static push<T extends typeof Model>(
    this: T,
    opts: PushOptions,
  ): InstanceType<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Klass = this as unknown as new (internalOpts: InternalOptions) => Model;
    const instance = new Klass({
      ...opts,
      __initialState: 'root.loaded.saved',
    });
    (instance as unknown as { didLoad(): void }).didLoad();
    return instance as InstanceType<T>;
  }

  // --- internal reactive state (prefixed with _) ---

  /** Current attribute values. Deep-observable so nested mutations are tracked. */
  protected _data: Record<string, unknown> = {};
  /** Snapshot of attribute values as last received from the server (dirty tracking baseline). */
  protected _originalData: Record<string, unknown> = {};
  /** Raw relationship references keyed by relationship name. */
  protected _relationships: Map<string, RelationshipRef> = new Map();
  /** Server-assigned id, or `null` for new records. */
  protected _id: string | null = null;
  /** Client-generated identifier for new records that don't yet have a server id. */
  readonly _clientId: string = generateClientId();
  /** Internal lifecycle state machine. */
  protected _stateMachine: StateMachine;

  /** Observable validation error collection. */
  readonly errors: Errors = new Errors();
  /** Reference to the owning store, injected at construction. */
  store?: ModelStoreLike;

  constructor(options: ModelConstructorOptions = {}) {
    const opts = options as InternalOptions;
    ensureAccessorsInstalled(this.constructor);

    this._id = opts.id ?? null;
    this.store = opts.store;
    this._stateMachine = new StateMachine(
      opts.__initialState ?? 'root.loaded.created.uncommitted',
    );

    const initialData = opts.data ? { ...opts.data } : {};
    this._data = initialData;
    // When pushed (clean), snapshot original for dirty tracking.
    if (opts.__initialState === 'root.loaded.saved') {
      this._originalData = { ...initialData };
    } else {
      this._originalData = {};
    }

    if (opts.relationships) {
      for (const [name, reference] of Object.entries(opts.relationships)) {
        this._relationships.set(name, reference);
      }
    }

    makeObservable<
    this,
    | '_data'
    | '_originalData'
    | '_relationships'
    | '_id'
    | '_setAttribute'
    | '_transitionIfClean'
    | '_applyServerData'
    | '_setState'
    >(this, {
      _data: observable.shallow,
      _originalData: observable.ref,
      _relationships: observable.shallow,
      _id: observable,
      id: computed,
      uniqueId: computed,
      currentState: computed,
      isLoading: computed,
      isLoaded: computed,
      isSaving: computed,
      isDirty: computed,
      hasDirtyAttributes: computed,
      isNew: computed,
      isDeleted: computed,
      isValid: computed,
      isError: computed,
      isEmpty: computed,
      _setAttribute: action,
      _transitionIfClean: action,
      _applyServerData: action,
      _setState: action,
      rollbackAttributes: action,
      deleteRecord: action,
    });
  }

  /** Server-assigned id, or `null` for new records. */
  get id(): string | null {
    return this._id;
  }

  set id(v: string | null) {
    runInAction(() => {
      this._id = v;
    });
  }

  /** Returns a stable identifier: the server-assigned `id` if available, otherwise the client-generated `_clientId`. */
  get uniqueId(): string {
    return this._id ?? this._clientId;
  }

  /** Returns the static `modelName` from the concrete subclass constructor. */
  get modelName(): string {
    return (this.constructor as typeof Model).modelName;
  }

  /** Current state-machine state string. */
  get currentState(): RecordState {
    return this._stateMachine.current;
  }

  /** `true` while an adapter request to fetch this record is in flight. */
  get isLoading(): boolean {
    return this.currentState === 'root.loading';
  }

  /** `true` when the record has been loaded (any `root.loaded.*` state). */
  get isLoaded(): boolean {
    return this.currentState.startsWith('root.loaded');
  }

  /** `true` while a create or update request is in flight. */
  get isSaving(): boolean {
    return this.currentState.endsWith('.inFlight');
  }

  /** `true` when the record was created locally and has never been saved. */
  get isNew(): boolean {
    return this.currentState.startsWith('root.loaded.created');
  }

  /** `true` when `deleteRecord()` has been called (regardless of server state). */
  get isDeleted(): boolean {
    return this.currentState.startsWith('root.deleted');
  }

  /** `true` when the record is in the `root.error` state. */
  get isError(): boolean {
    return this.currentState === 'root.error';
  }

  /** `true` when the record is in the `root.empty` placeholder state. */
  get isEmpty(): boolean {
    return this.currentState === 'root.empty';
  }

  /** `true` when any attribute differs from its last-saved value. */
  get hasDirtyAttributes(): boolean {
    const data = this._data;
    const original = this._originalData;
    for (const key of Object.keys(data)) {
      if (!Object.is(data[key], original[key])) {
        return true;
      }
    }
    for (const key of Object.keys(original)) {
      if (!(key in data)) {
        return true;
      }
    }
    return false;
  }

  /**
   * `true` when the record needs to be saved — new, deleted (not yet
   * confirmed), or has dirty attributes.
   */
  get isDirty(): boolean {
    if (this.isNew) {
      return true;
    }
    if (this.isDeleted && this.currentState !== 'root.deleted.saved') {
      return true;
    }
    return this.hasDirtyAttributes;
  }

  /** `true` when `errors.isEmpty` — i.e. no validation errors are present. */
  get isValid(): boolean {
    return this.errors.isEmpty;
  }

  /**
   * Returns a `{ [key]: [original, current] }` map of attributes that differ
   * from the last server-received snapshot.
   */
  changedAttributes(): Record<string, [unknown, unknown]> {
    const changed: Record<string, [unknown, unknown]> = {};
    const keys = new Set([
      ...Object.keys(this._data),
      ...Object.keys(this._originalData),
    ]);
    for (const key of keys) {
      const current = this._data[key];
      const original = this._originalData[key];
      if (!Object.is(current, original)) {
        changed[key] = [original, current];
      }
    }
    return changed;
  }

  /**
   * Resets all attributes to their original server values and clears
   * validation errors.  For new records the record is transitioned to
   * `root.empty` and unloaded from the store.
   */
  rollbackAttributes(): void {
    this._data = { ...this._originalData };
    this.errors.clear();
    if (this.isNew) {
      this._setState('root.empty');
      if (this.store?.unloadRecord) {
        this.store.unloadRecord(this);
      }
      return;
    }
    if (this.currentState === 'root.loaded.updated.uncommitted') {
      this._stateMachine.transition('rolledBack');
    } else if (this.currentState === 'root.deleted.uncommitted') {
      this._stateMachine.transition('rolledBack');
    }
  }

  /**
   * Persists the record to the server.  No-ops if the record is not dirty.
   * Delegates to `store.saveRecord`.
   *
   * @throws when no store is attached.
   */
  async save(
    options: SaveOptions = {},
  ): Promise<this> {
    if (!this.isDirty) {
      return this;
    }
    if (!this.store?.saveRecord) {
      throw new Error('Cannot save: no store attached');
    }
    const wasNew = this.isNew;
    this.willSave();
    this._stateMachine.transition('willCommit');
    try {
      await this.store.saveRecord(this, options);
      // If the store didn't already finalize the record, do it here.
      if (
        this.currentState === 'root.loaded.created.inFlight'
        || this.currentState === 'root.loaded.updated.inFlight'
      ) {
        runInAction(() => {
          this._originalData = { ...this._data };
          this._stateMachine.transition('didCommit');
        });
      }
      if (wasNew) {
        this.didCreate();
      } else {
        this.didUpdate();
      }
      this.didSave();
      return this;
    } catch (error) {
      if (!this.errors.isEmpty) {
        this._stateMachine.transition('becameInvalid');
        this.becameInvalid();
      } else {
        this._stateMachine.transition('becameError');
        this.becameError();
      }
      throw error;
    }
  }

  /**
   * Reloads the record from the server.
   * @throws when no store is attached.
   */
  async reload(): Promise<this> {
    if (!this.store?.reloadRecord) {
      throw new Error('Cannot reload: no store attached');
    }
    return (await this.store.reloadRecord(this)) as this;
  }

  /**
   * Marks the record for deletion.  The record moves to
   * `root.deleted.uncommitted` but is not yet removed from the server.
   * Call `destroyRecord()` to also issue the DELETE request.
   */
  deleteRecord(): void {
    if (this.isNew) {
      this._setState('root.deleted.uncommitted');
    } else {
      this._stateMachine.transition('deleteRecord');
    }
  }

  /**
   * Marks the record for deletion and immediately sends a DELETE request.
   * @throws when no store is attached.
   */
  async destroyRecord(): Promise<this> {
    this.deleteRecord();
    if (!this.store?.deleteRecord) {
      throw new Error('Cannot destroy: no store attached');
    }
    this._stateMachine.transition('willCommit');
    const result = (await this.store.deleteRecord(this)) as this;
    if (this.currentState === 'root.deleted.inFlight') {
      this._stateMachine.transition('didCommit');
    }
    this.didDelete();
    return result;
  }

  /** Removes the record from the store's identity map without a server call. */
  unloadRecord(): void {
    if (this.store?.unloadRecord) {
      this.store.unloadRecord(this);
    }
  }

  /** Creates a frozen `Snapshot` of the current record state. */
  createSnapshot(): Snapshot<this> {
    return new Snapshot(this);
  }

  /** Returns a plain-object representation of the current attribute data. */
  serialize(_options: { includeId?: boolean } = {}): Record<string, unknown> {
    return { ...this._data };
  }

  /** Returns `{ id, ...attributes }` — used by `JSON.stringify`. */
  toJSON(): Record<string, unknown> {
    return { id: this._id, ...this._data };
  }

  // Lifecycle hooks — default no-ops, overridable.

  /** Called after the record is loaded from the server. */
  didLoad(): void {}
  /** Called after a new record is successfully persisted. */
  didCreate(): void {}
  /** Called after an existing record is successfully updated. */
  didUpdate(): void {}
  /** Called after a record is successfully deleted. */
  didDelete(): void {}
  /** Called immediately before a save request is issued. */
  willSave(): void {}
  /** Called after any successful save (create or update). */
  didSave(): void {}
  /** Called when the server returns a 422-style validation error. */
  becameInvalid(): void {}
  /** Called when the server returns a non-validation error. */
  becameError(): void {}

  // --- internals ---

  /** Called by generated attribute setters. */
  protected _setAttribute(key: string, value: unknown): void {
    if (Object.is(this._data[key], value)) {
      return;
    }
    this._data[key] = value;
    this._transitionIfClean();
  }

  /**
   * Transitions to `updated.uncommitted` when the record becomes dirty, or
   * back to `saved` when all changes are rolled back.
   */
  protected _transitionIfClean(): void {
    const dirty = this.hasDirtyAttributes;
    if (dirty && this.currentState === 'root.loaded.saved') {
      this._stateMachine.transition('didSetProperty');
    } else if (!dirty && this.currentState === 'root.loaded.updated.uncommitted') {
      this._stateMachine.transition('rolledBack');
    }
  }

  /** Directly sets the state machine's current state (bypasses transition validation). */
  protected _setState(state: RecordState): void {
    this._stateMachine.current = state;
  }

  /** Fires a state-machine transition event. */
  protected _transition(event: RecordEvent): void {
    this._stateMachine.transition(event);
  }

  /** Used by Store to apply server data after save, making record clean again. */
  protected _applyServerData(
    id: string | null,
    data: Record<string, unknown>,
    relationships?: Record<string, RelationshipRef>,
  ): void {
    if (id !== null) {
      this._id = id;
    }
    this._data = { ...this._data, ...data };
    this._originalData = { ...this._data };
    this.errors.clear();
    if (relationships) {
      for (const [name, reference] of Object.entries(relationships)) {
        this._relationships.set(name, reference);
      }
    }
    if (this.currentState === 'root.loaded.created.inFlight') {
      this._stateMachine.transition('didCommit');
      this.didCreate();
    } else if (this.currentState === 'root.loaded.updated.inFlight') {
      this._stateMachine.transition('didCommit');
      this.didUpdate();
    } else if (this.currentState === 'root.deleted.inFlight') {
      this._stateMachine.transition('didCommit');
    } else if (this.currentState === 'root.loading') {
      this._stateMachine.transition('pushedData');
    }
    // If pushed externally to a created/updated record, reset to saved.
    if (
      !this.isNew
      && !this.isDeleted
      && (this.currentState === 'root.loaded.updated.uncommitted'
        || this.currentState === 'root.loaded.created.uncommitted')
    ) {
      this._setState('root.loaded.saved');
    }
  }

  /** Relationship data (reference only). Resolution to records lives in Store. */
  protected _getRelationshipRef(name: string): RelationshipRef | null {
    return this._relationships.get(name) ?? null;
  }

  /** Stores a raw relationship reference without triggering store logic. */
  protected _setRelationshipRef(name: string, ref: RelationshipRef): void {
    this._relationships.set(name, ref);
  }

  /**
   * Delegates relationship resolution to the store.
   * Returns `null` when no store is attached (e.g. in unit tests).
   */
  protected _resolveRelationship(
    name: string,
    meta: RelationshipDef,
  ): unknown {
    if (this.store?.resolveRelationship) {
      return this.store.resolveRelationship(this, name, meta);
    }
    return null;
  }

  /** Delegates relationship mutation to the store (which also handles inverse sync). */
  protected _setRelationship(
    name: string,
    meta: RelationshipDef,
    value: unknown,
  ): void {
    if (this.store?.setRelationshipValue) {
      this.store.setRelationshipValue(this, name, meta, value);
    }
  }
}
