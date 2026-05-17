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
import { type RelationshipDef } from '@mobx-data/schema';
import { Errors } from './Errors.js';
import { StateMachine, type RecordState, type RecordEvent } from './StateMachine.js';
import { Snapshot } from './Snapshot.js';
/**
 * Raw relationship reference stored on the record.
 * Contains either a single `{ type, id }` object (belongsTo),
 * an array of them (hasMany), or `null`.
 */
export interface RelationshipRef {
    data: {
        type: string;
        id: string;
    } | Array<{
        type: string;
        id: string;
    }> | null;
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
    findRecord?<T extends Model = Model>(type: string, id: string, options?: unknown): Promise<T>;
    onRelationshipSet?(record: Model, relName: string, ref: RelationshipRef): void;
    resolveRelationship?(record: Model, name: string, meta: RelationshipDef): unknown;
    setRelationshipValue?(record: Model, name: string, meta: RelationshipDef, value: unknown): void;
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
export declare abstract class Model {
    /** Registered model name — must be set as a static property on subclasses. */
    static modelName: string;
    /**
     * Factory method that creates an instance in the `root.loaded.saved` state
     * (i.e. as if freshly loaded from the server) and calls `didLoad()`.
     *
     * Used internally by `Store.pushResource` to avoid exposing the internal
     * `__initialState` option.
     */
    static push<T extends typeof Model>(this: T, opts: PushOptions): InstanceType<T>;
    /** Current attribute values. Deep-observable so nested mutations are tracked. */
    protected _data: Record<string, unknown>;
    /** Snapshot of attribute values as last received from the server (dirty tracking baseline). */
    protected _originalData: Record<string, unknown>;
    /** Raw relationship references keyed by relationship name. */
    protected _relationships: Map<string, RelationshipRef>;
    /** Server-assigned id, or `null` for new records. */
    protected _id: string | null;
    /** Internal lifecycle state machine. */
    protected _stateMachine: StateMachine;
    /** Observable validation error collection. */
    readonly errors: Errors;
    /** Reference to the owning store, injected at construction. */
    store?: ModelStoreLike;
    constructor(options?: ModelConstructorOptions);
    /** Server-assigned id, or `null` for new records. */
    get id(): string | null;
    set id(v: string | null);
    /** Returns the static `modelName` from the concrete subclass constructor. */
    get modelName(): string;
    /** Current state-machine state string. */
    get currentState(): RecordState;
    /** `true` while an adapter request to fetch this record is in flight. */
    get isLoading(): boolean;
    /** `true` when the record has been loaded (any `root.loaded.*` state). */
    get isLoaded(): boolean;
    /** `true` while a create or update request is in flight. */
    get isSaving(): boolean;
    /** `true` when the record was created locally and has never been saved. */
    get isNew(): boolean;
    /** `true` when `deleteRecord()` has been called (regardless of server state). */
    get isDeleted(): boolean;
    /** `true` when the record is in the `root.error` state. */
    get isError(): boolean;
    /** `true` when the record is in the `root.empty` placeholder state. */
    get isEmpty(): boolean;
    /** `true` when any attribute differs from its last-saved value. */
    get hasDirtyAttributes(): boolean;
    /**
     * `true` when the record needs to be saved — new, deleted (not yet
     * confirmed), or has dirty attributes.
     */
    get isDirty(): boolean;
    /** `true` when `errors.isEmpty` — i.e. no validation errors are present. */
    get isValid(): boolean;
    /**
     * Returns a `{ [key]: [original, current] }` map of attributes that differ
     * from the last server-received snapshot.
     */
    changedAttributes(): Record<string, [unknown, unknown]>;
    /**
     * Resets all attributes to their original server values and clears
     * validation errors.  For new records the record is transitioned to
     * `root.empty` and unloaded from the store.
     */
    rollbackAttributes(): void;
    /**
     * Persists the record to the server.  No-ops if the record is not dirty.
     * Delegates to `store.saveRecord`.
     *
     * @throws when no store is attached.
     */
    save(options?: SaveOptions): Promise<this>;
    /**
     * Reloads the record from the server.
     * @throws when no store is attached.
     */
    reload(): Promise<this>;
    /**
     * Marks the record for deletion.  The record moves to
     * `root.deleted.uncommitted` but is not yet removed from the server.
     * Call `destroyRecord()` to also issue the DELETE request.
     */
    deleteRecord(): void;
    /**
     * Marks the record for deletion and immediately sends a DELETE request.
     * @throws when no store is attached.
     */
    destroyRecord(): Promise<this>;
    /** Removes the record from the store's identity map without a server call. */
    unloadRecord(): void;
    /** Creates a frozen `Snapshot` of the current record state. */
    createSnapshot(): Snapshot<this>;
    /** Returns a plain-object representation of the current attribute data. */
    serialize(_options?: {
        includeId?: boolean;
    }): Record<string, unknown>;
    /** Returns `{ id, ...attributes }` — used by `JSON.stringify`. */
    toJSON(): Record<string, unknown>;
    /** Called after the record is loaded from the server. */
    didLoad(): void;
    /** Called after a new record is successfully persisted. */
    didCreate(): void;
    /** Called after an existing record is successfully updated. */
    didUpdate(): void;
    /** Called after a record is successfully deleted. */
    didDelete(): void;
    /** Called immediately before a save request is issued. */
    willSave(): void;
    /** Called after any successful save (create or update). */
    didSave(): void;
    /** Called when the server returns a 422-style validation error. */
    becameInvalid(): void;
    /** Called when the server returns a non-validation error. */
    becameError(): void;
    /** Called by generated attribute setters. */
    protected _setAttribute(key: string, value: unknown): void;
    /**
     * Transitions to `updated.uncommitted` when the record becomes dirty, or
     * back to `saved` when all changes are rolled back.
     */
    protected _transitionIfClean(): void;
    /** Directly sets the state machine's current state (bypasses transition validation). */
    protected _setState(state: RecordState): void;
    /** Fires a state-machine transition event. */
    protected _transition(event: RecordEvent): void;
    /** Used by Store to apply server data after save, making record clean again. */
    protected _applyServerData(id: string | null, data: Record<string, unknown>, relationships?: Record<string, RelationshipRef>): void;
    /** Relationship data (reference only). Resolution to records lives in Store. */
    protected _getRelationshipRef(name: string): RelationshipRef | null;
    /** Stores a raw relationship reference without triggering store logic. */
    protected _setRelationshipRef(name: string, ref: RelationshipRef): void;
    /**
     * Delegates relationship resolution to the store.
     * Returns `null` when no store is attached (e.g. in unit tests).
     */
    protected _resolveRelationship(name: string, meta: RelationshipDef): unknown;
    /** Delegates relationship mutation to the store (which also handles inverse sync). */
    protected _setRelationship(name: string, meta: RelationshipDef, value: unknown): void;
}
//# sourceMappingURL=Model.d.ts.map