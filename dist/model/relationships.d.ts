/**
 * Relationship proxy classes returned by relationship getters on Model instances.
 *
 * Three classes are exported:
 *
 * - `ManyArray<T>` — a synchronous, MobX-observable live view of a `hasMany`
 *   relationship.  Its contents are resolved directly from the store's identity
 *   map on each access, so it stays in sync automatically as records are
 *   pushed, unloaded, or added/removed via `push` / `removeObject`.
 *
 * - `AsyncBelongsTo<T>` — a `PromiseLike` wrapper for a `belongsTo` that
 *   may need to be fetched from the server.  Supports `await`, `then`, and
 *   MobX-observable state flags (`isLoading`, `isLoaded`, `isFulfilled`,
 *   `isRejected`, `value`).
 *
 * - `AsyncHasMany<T>` — same semantics as `AsyncBelongsTo` but resolves to a
 *   `ManyArray<T>` instead of a single record.
 *
 * Both async wrappers eagerly check the store cache on construction; if all
 * referenced records are already present they transition to `fulfilled`
 * without issuing any network requests.
 */
import type { RelationshipDef } from '@mobx-data/schema';
import type { Model, ModelStoreLike, RelationshipRef } from './Model.js';
/** Context object shared by all relationship proxy classes. */
export interface RelationshipHost {
    /** The record that owns the relationship. */
    parent: Model;
    /** Name of the relationship property on the owner. */
    name: string;
    /** Relationship definition from the schema. */
    meta: RelationshipDef;
    /** Store instance used to peek / find related records. */
    store: RelationshipCapableStore;
}
/**
 * Extended store interface required by the relationship proxy classes.
 * `Store` satisfies this interface.
 */
export interface RelationshipCapableStore extends ModelStoreLike {
    peekRecord<T extends Model = Model>(type: string, id: string): T | null;
    findRecord<T extends Model = Model>(type: string, id: string, options?: unknown): Promise<T>;
    _getRelationshipRefFor(record: Model, name: string): RelationshipRef | null;
    _getPendingMembers(record: Model, name: string): Iterable<Model>;
    _hasManyAppend(record: Model, name: string, meta: RelationshipDef, value: Model): void;
    _hasManyRemove(record: Model, name: string, meta: RelationshipDef, value: Model): void;
}
/**
 * Synchronous, live-updating array proxy for a `hasMany` relationship.
 *
 * Each access to `length`, iteration, or mutation goes through the store so
 * the array always reflects the current identity map state.  Records that
 * have been `push`ed to the relationship but not yet assigned a server id
 * are tracked separately as "pending members" and are included in the
 * resolved list.
 */
export declare class ManyArray<T extends Model = Model> implements Iterable<T> {
    static refData(ref: RelationshipRef | null): Array<{
        type: string;
        id: string;
    }>;
    private host;
    constructor(host: RelationshipHost);
    /**
     * Resolves the current set of related records from the store identity map.
     * Pending (unsaved) members appended via `push()` are appended at the end.
     */
    private get resolved();
    /** Number of related records currently in the array. */
    get length(): number;
    /** Returns the record at `index`, or `undefined`. */
    at(index: number): T | undefined;
    /**
     * Adds one or more records to the relationship.
     * Delegates to `store._hasManyAppend` which also handles inverse tracking.
     */
    push(...records: T[]): number;
    /**
     * Removes a record from the relationship.
     * Delegates to `store._hasManyRemove` which also handles inverse tracking.
     */
    removeObject(record: T): void;
    /** Returns `true` when `record` is currently in the relationship. */
    includes(record: T): boolean;
    /** Returns a plain array snapshot of all related records. */
    toArray(): T[];
    /** Maps over the related records. */
    map<R>(callback: (record: T, i: number) => R): R[];
    /** Filters the related records. */
    filter(predicate: (record: T, i: number) => boolean): T[];
    /** Iterates over the related records. */
    forEach(callback: (record: T, i: number) => void): void;
    [Symbol.iterator](): Iterator<T>;
}
/**
 * Async wrapper for a `belongsTo` relationship.
 *
 * Implements `PromiseLike<T | null>` so it can be `await`ed.  Also exposes
 * MobX-observable state flags:
 * - `isPending` / `isFulfilled` / `isRejected` — promise lifecycle
 * - `isLoading` — a network request is currently in flight
 * - `isLoaded` — the relationship has been resolved (even to `null`)
 * - `value` — the resolved record, or `null`
 * - `reason` — the rejection error, if any
 *
 * Eagerly checks the store cache at construction; if the referenced record is
 * already present it transitions straight to `fulfilled`.
 */
export declare class AsyncBelongsTo<T extends Model = Model> implements PromiseLike<T | null> {
    private host;
    private loadedState;
    private currentValue;
    private error;
    private inflight;
    constructor(host: RelationshipHost);
    /** Checks the store cache and transitions to `fulfilled` if the record is already loaded. */
    private syncFromCache;
    /** `true` while the relationship has not yet been resolved. */
    get isPending(): boolean;
    /** `true` once the relationship has been resolved (including to `null`). */
    get isFulfilled(): boolean;
    /** `true` if the network request failed. */
    get isRejected(): boolean;
    /** `true` while a network request is in flight. */
    get isLoading(): boolean;
    /** `true` once the relationship is resolved. */
    get isLoaded(): boolean;
    /** The resolved record, or `null` when the relationship is empty or not yet loaded. */
    get value(): T | null;
    /** The rejection reason if `isRejected`. */
    get reason(): unknown;
    /**
     * Ensures the related record is loaded, returning a `Promise<T | null>`.
     * If the record is already in the store it resolves immediately.
     * Concurrent calls share the same in-flight promise.
     */
    load(): Promise<T | null>;
    /** Forces a fresh fetch, ignoring any cached value. */
    reload(): Promise<T | null>;
    then<TResult1 = T | null, TResult2 = never>(onfulfilled?: ((value: T | null) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null | undefined): PromiseLike<TResult1 | TResult2>;
}
/**
 * Async wrapper for a `hasMany` relationship.
 *
 * Mirrors the `AsyncBelongsTo` API but resolves to a `ManyArray<T>` instead
 * of a single record.  Missing referenced records are fetched in parallel via
 * `store.findRecord`.
 */
export declare class AsyncHasMany<T extends Model = Model> implements PromiseLike<ManyArray<T>> {
    private host;
    private manyArray;
    private loadedState;
    private error;
    private inflight;
    constructor(host: RelationshipHost);
    /** Transitions to `fulfilled` if all referenced records are already in the cache. */
    private syncFromCache;
    /** `true` while the relationship has not yet been resolved. */
    get isPending(): boolean;
    /** `true` once all referenced records have been resolved. */
    get isFulfilled(): boolean;
    /** `true` if any fetch failed. */
    get isRejected(): boolean;
    /** `true` while a network request is in flight. */
    get isLoading(): boolean;
    /** `true` once the relationship is resolved. */
    get isLoaded(): boolean;
    /** The underlying `ManyArray` (always available, even before `load()`). */
    get value(): ManyArray<T>;
    /** Number of records currently in the resolved array. */
    get length(): number;
    /**
     * Ensures all referenced records are loaded.
     * Records already in the cache are not re-fetched.
     * Concurrent calls share the same in-flight promise.
     */
    load(): Promise<ManyArray<T>>;
    /** Forces a fresh fetch, ignoring any cached state. */
    reload(): Promise<ManyArray<T>>;
    then<TResult1 = ManyArray<T>, TResult2 = never>(onfulfilled?: ((value: ManyArray<T>) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null | undefined): PromiseLike<TResult1 | TResult2>;
}
//# sourceMappingURL=relationships.d.ts.map