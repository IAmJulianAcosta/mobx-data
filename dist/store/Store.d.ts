/**
 * Central store — the top-level coordinator for the mobx-data runtime.
 *
 * `Store` orchestrates every aspect of the data layer:
 *
 * - **Identity Map** — a two-level `IdentityMap` keyed by `modelName → id`.
 *   Records are merged in-place on repeated `push` calls so live references
 *   always reflect the latest server state.
 *
 * - **Finding records** — `findRecord`, `findAll`, `query`, `queryRecord`
 *   delegate to the registered adapter, then pass the raw response through the
 *   registered serializer before pushing normalized data into the identity map.
 *
 * - **Saving records** — `saveRecord` calls `adapter.createRecord` or
 *   `adapter.updateRecord` depending on `record.isNew`, then applies the
 *   server response back onto the record via `_applyServerData`.
 *
 * - **Relationships** — `resolveRelationship` returns sync (`ManyArray`) or
 *   async (`AsyncBelongsTo` / `AsyncHasMany`) proxy objects backed by the
 *   store.  `setRelationshipValue` updates `belongsTo` refs and keeps their
 *   inverses in sync.  `_hasManyAppend` / `_hasManyRemove` manage `hasMany`
 *   refs and their inverses.
 *
 * - **Inverse tracking** — `addInverse` / `removeInverse` keep both sides of
 *   a declared `inverse` relationship consistent when either side is mutated.
 *
 * ## Registration
 *
 * ```ts
 * store.registerAdapter('application', new RestAdapter());
 * store.registerSerializer('application', new JsonSerializer());
 * ```
 *
 * Adapters and serializers are looked up first by exact model name, then by
 * the special `'application'` fallback.
 */
import { SchemaService, type ModelMeta, type RelationshipDef, type AttributeDef } from '@mobx-data/schema';
import { Model, type RelationshipRef, type ModelStoreLike, type SaveOptions } from '@mobx-data/model';
import type { CacheLike } from '../cache/types.js';
import { IdentityMap } from './IdentityMap.js';
import { RecordArray, AdapterPopulatedRecordArray } from './RecordArray.js';
import { MdqlQueryBuilder } from '../mdql/MdqlQueryBuilder.js';
/** Options forwarded from the Store to adapter fetch methods. */
export interface AdapterFetchOptions {
    include?: string;
    adapterOptions?: Record<string, unknown>;
}
/** Minimal adapter interface the Store depends on. */
export interface AdapterLike {
    findRecord(store: Store, modelName: string, id: string, snapshot: unknown, options?: AdapterFetchOptions): Promise<unknown>;
    findAll(store: Store, modelName: string, sinceToken: string | null, snapshotArray: unknown, options?: AdapterFetchOptions): Promise<unknown>;
    findMany?(store: Store, modelName: string, ids: string[], snapshots: unknown): Promise<unknown>;
    query(store: Store, modelName: string, query: Record<string, unknown>, recordArray: AdapterPopulatedRecordArray): Promise<unknown>;
    queryRecord(store: Store, modelName: string, query: Record<string, unknown>): Promise<unknown>;
    createRecord(store: Store, modelName: string, snapshot: unknown): Promise<unknown>;
    updateRecord(store: Store, modelName: string, snapshot: unknown): Promise<unknown>;
    patchRecord?(store: Store, modelName: string, snapshot: unknown): Promise<unknown>;
    deleteRecord(store: Store, modelName: string, snapshot: unknown): Promise<unknown>;
    /** When `true` the store coalesces multiple `findRecord` calls into one `findMany`. */
    coalesceFindRequests?: boolean;
}
/**
 * Minimal serializer interface the Store depends on.
 *
 * `modelClass` is the schema view returned by `SchemaService.metaFor()`, never
 * a model constructor: serializers iterate `attributes` / `relationships`,
 * which exist only on that view.
 */
export interface SerializerLike {
    normalize(store: Store, modelClass: ModelMeta, payload: unknown, prop?: string): unknown;
    normalizeResponse(store: Store, modelClass: ModelMeta, payload: unknown, id: string | null, requestType: string): unknown;
    serialize(snapshot: unknown, options?: Record<string, unknown>): unknown;
    extractErrors?(store: Store, modelClass: ModelMeta, payload: unknown, id: string | null): Record<string, string[]>;
}
/** Options for `findRecord` and `findAll`. */
export interface FindOptions {
    /** When `true`, bypass the cache and always hit the network. */
    reload?: boolean;
    /** When `true`, return the cached value and refetch in the background. */
    backgroundReload?: boolean;
    /** Adapter-specific options forwarded to the adapter method. */
    adapterOptions?: Record<string, unknown>;
    /** Comma-separated relationship paths to include (e.g. `'author,comments'`). */
    include?: string;
}
/** Normalized resource shape consumed internally by the store. */
export interface NormalizedResource {
    type: string;
    id: string | null;
    attributes?: Record<string, unknown>;
    relationships?: Record<string, RelationshipRef>;
}
/** Normalized document containing primary data and optional side-loaded records. */
export interface NormalizedDocument {
    data: NormalizedResource | NormalizedResource[] | null;
    included?: NormalizedResource[];
    meta?: Record<string, unknown>;
    links?: Record<string, string>;
}
/** Internal snapshot interface created and consumed by the store. */
interface Snapshot {
    id: string | null;
    clientId: string;
    modelName: string;
    record: Model;
    attr(key: string): unknown;
    belongsTo(key: string, options?: {
        id?: boolean;
    }): unknown;
    hasMany(key: string, options?: {
        ids?: boolean;
    }): unknown;
    changedAttributes(): Record<string, [unknown, unknown]>;
    eachAttribute(fn: (key: string, meta: AttributeDef) => void): void;
    eachRelationship(fn: (key: string, meta: RelationshipDef) => void): void;
}
export declare class Store implements ModelStoreLike {
    static refEquals(a: {
        type: string;
        id: string;
    }, b: {
        type: string;
        id: string;
    }): boolean;
    /** Schema registry used to look up model classes and their metadata. */
    readonly schema: SchemaService;
    /** Two-level identity map: `modelName → id → record`. */
    readonly identityMap: IdentityMap;
    private adapters;
    private serializers;
    /** Tracks unsaved (new) records by model name. */
    private newRecords;
    /** Reverse index: record → modelName for O(1) untrackNewRecord. */
    private newRecordTypes;
    /** Per-record cache of relationship proxy objects (ManyArray / AsyncBelongsTo / AsyncHasMany). */
    private relationshipCache;
    /** Tracks new records that have been appended to a hasMany but not yet saved. */
    private pendingMembers;
    /** Optional persistent cache layer (e.g. IndexedDB). */
    private _cache;
    constructor(schema: SchemaService);
    /** Registers an adapter for a given model name (or `'application'` as a fallback). */
    registerAdapter(modelName: string, adapter: AdapterLike): void;
    /** Registers a serializer for a given model name (or `'application'` as a fallback). */
    registerSerializer(modelName: string, serializer: SerializerLike): void;
    /** Registers a persistent cache layer (e.g. IndexedDB) for offline-first reads. */
    registerCache(cache: CacheLike): void;
    /**
     * Returns the adapter for `modelName`, falling back to `'application'`.
     * @throws when no adapter is registered.
     */
    adapterFor(modelName: string): AdapterLike;
    /**
     * Returns the serializer for `modelName`, falling back to `'application'`.
     * @throws when no serializer is registered.
     */
    serializerFor(modelName: string): SerializerLike;
    /**
     * Creates a new (unsaved) record of the given type with optional initial data.
     * The record is tracked in `newRecords` until it is saved or rolled back.
     *
     * @throws when `modelName` has not been registered with `SchemaService`.
     */
    createRecord<T extends Model = Model>(modelName: string, data?: Record<string, unknown>): T;
    private trackNewRecord;
    private untrackNewRecord;
    /**
     * Synchronously returns a record from the identity map, or `null` when not
     * found.  Does not trigger a network request.
     */
    peekRecord<T extends Model = Model>(modelName: string, id: string): T | null;
    /**
     * Returns a live `RecordArray` backed by the identity map for `modelName`.
     * New (unsaved) records are included at the end.
     * Does not trigger a network request.
     */
    peekAll<T extends Model = Model>(modelName: string): RecordArray<T>;
    /**
     * Pushes a normalized document into the identity map.
     * Side-loaded (`included`) records are pushed first.
     *
     * @returns The primary record(s), or `null` for empty payloads.
     */
    push(doc: unknown): Model | Model[] | null;
    /**
     * Normalizes a raw payload via the registered serializer and pushes the
     * result.  `modelName` is optional; when omitted the payload is pushed
     * directly without normalization.
     */
    pushPayload(modelNameOrPayload: string | unknown, payload?: unknown): void;
    /**
     * Normalizes a raw payload for `modelName` via the registered serializer
     * and returns the `NormalizedDocument` without pushing it.
     */
    normalize(modelName: string, payload: unknown): NormalizedDocument;
    /**
     * Inserts or merges a single normalized resource into the identity map.
     * - Existing record → calls `_applyServerData` to merge attributes and
     *   relationships in place (preserving the live reference).
     * - New record → instantiates via `Model.push` and sets it in the map.
     *
     * @throws when `type` has not been registered or `id` is `null`.
     */
    private pushResource;
    /**
     * After pushing a resource, updates the inverse side of every declared
     * inverse relationship so both sides stay consistent.
     */
    private trackInverseForResource;
    /**
     * Adds `inverseRecord` to the inverse relationship on `targetType:targetId`.
     * No-ops when the target record is not in the identity map.
     */
    private addInverse;
    /**
     * Removes `inverseRecord` from the inverse relationship on `targetType:targetId`.
     * No-ops when the target record is not in the identity map.
     */
    private removeInverse;
    /**
     * Removes a record from the identity map and clears its relationship cache.
     * Called by `record.unloadRecord()` and internally after `deleteRecord`.
     */
    unloadRecord(record: Model): void;
    /**
     * Unloads all records for `modelName`, or all records across all types when
     * `modelName` is omitted.
     */
    unloadAll(modelName?: string): void;
    /**
     * Finds a single record by id.  Returns the cached record immediately when
     * `options.reload` is not set; otherwise re-fetches.
     *
     * When the adapter has `coalesceFindRequests: true` and `findMany` is
     * implemented, multiple concurrent `findRecord` calls for the same type
     * are batched into a single `findMany` network request.
     */
    findRecord<T extends Model = Model>(modelName: string, id: string, options?: FindOptions): Promise<T>;
    /**
     * Fetches all records of `modelName` from the server and returns a
     * `RecordArray` backed by the identity map.
     */
    findAll<T extends Model = Model>(modelName: string, options?: FindOptions): Promise<RecordArray<T>>;
    /**
     * Executes an adapter query and returns an `AdapterPopulatedRecordArray`
     * whose `update()` method re-issues the same query.
     */
    query<T extends Model = Model>(modelName: string, params: Record<string, unknown>): Promise<AdapterPopulatedRecordArray<T>>;
    private runQuery;
    /**
     * Executes an adapter query that returns at most one record.
     * Returns `null` when the adapter returns an empty payload.
     */
    queryRecord<T extends Model = Model>(modelName: string, params: Record<string, unknown>): Promise<T | null>;
    /**
     * Persists a record to the server.
     * - New records → `adapter.createRecord` (POST)
     * - Existing dirty records → `adapter.updateRecord` (PUT) by default
     * - With `{ patch: true }` → `adapter.patchRecord` (PATCH, partial payload)
     *
     * After the response is received the server data is applied back to the
     * record via `_applyServerData` so it transitions to `saved`.
     */
    saveRecord<T extends Model>(record: T, options?: SaveOptions): Promise<T>;
    /**
     * Issues a DELETE request and unloads the record from the identity map.
     */
    deleteRecord<T extends Model>(record: T): Promise<T>;
    /**
     * Re-fetches a record from the server and merges the response into the
     * existing instance.
     */
    reloadRecord<T extends Model>(record: T): Promise<T>;
    /**
     * Creates a `Snapshot` for a live record.
     * The snapshot reads directly from the record's internal state so it
     * reflects the current (possibly dirty) values.
     */
    createSnapshot(record: Model): Snapshot;
    /**
     * Creates a placeholder `Snapshot` for a record that is not yet in the
     * identity map (used when fetching a record that isn't cached).
     */
    private createEmptySnapshot;
    private getRelationshipCache;
    private setRelationshipCache;
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
    resolveRelationship(record: Model, name: string, meta: RelationshipDef): unknown;
    /**
     * Called by the `Model` `belongsTo` setter to update a relationship ref
     * and keep its inverse in sync.
     */
    setRelationshipValue(record: Model, name: string, meta: RelationshipDef, value: unknown): void;
    /** Returns the raw relationship ref stored on `record` for `name`. */
    _getRelationshipRefFor(record: Model, name: string): RelationshipRef | null;
    /** Returns any pending (unsaved) members for a `hasMany` relationship. */
    _getPendingMembers(record: Model, name: string): Iterable<Model>;
    private addPendingMember;
    private removePendingMember;
    /**
     * Appends `value` to the `hasMany` relationship ref on `record` and syncs
     * the inverse.  Unsaved records (`value.id === null`) are tracked as
     * "pending members" until they are persisted.
     */
    _hasManyAppend(record: Model, name: string, meta: RelationshipDef, value: Model): void;
    /**
     * Removes `value` from the `hasMany` relationship ref on `record` and syncs
     * the inverse.  Pending members are removed from the pending set.
     */
    _hasManyRemove(record: Model, name: string, meta: RelationshipDef, value: Model): void;
    private cacheNormalizedDocument;
    private coalescePending;
    private coalesceScheduled;
    private scheduleCoalescedFind;
    private flushCoalescedFind;
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
    liveQuery<T extends Model = Model>(modelName: string, predicate: (record: T) => boolean): RecordArray<T>;
    select<T extends Model = Model>(modelName: string): MdqlQueryBuilder<T>;
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
    optimisticUpdate<T extends Model>(record: T, optimisticAttributes: Partial<Record<string, unknown>>, persistFn: () => Promise<unknown>): Promise<T>;
    /**
     * Executes multiple store mutations as a single MobX action, guaranteeing
     * that observers (and therefore UI renders) react only once — after all
     * mutations have been applied.
     *
     * @param callback - Synchronous function containing one or more store mutations.
     */
    runInTransaction(callback: () => void): void;
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
    serialize(options?: {
        exclude?: Record<string, string[]>;
    }): {
        records: Record<string, Array<{
            id: string;
            attributes: Record<string, unknown>;
            relationships?: Record<string, RelationshipRef>;
        }>>;
    };
    /**
     * Restores records from a snapshot produced by `serialize()` into this store
     * instance.  All records are pushed into the identity map in `loaded.saved`
     * state — no network requests are issued.
     *
     * @param snapshot - A snapshot object previously returned by `serialize()`.
     */
    hydrate(snapshot: {
        records: Record<string, Array<{
            id: string;
            attributes: Record<string, unknown>;
            relationships?: Record<string, RelationshipRef>;
        }>>;
    }): void;
    /**
     * Factory method that creates a new `Store` and immediately hydrates it from
     * the given snapshot.  Convenience for SSR client-side bootstrap.
     *
     * @param schema - SchemaService with all model types registered.
     * @param snapshot - A snapshot object previously returned by `serialize()`.
     * @returns A fully populated `Store` instance ready for use.
     */
    static hydrate(schema: SchemaService, snapshot: {
        records: Record<string, Array<{
            id: string;
            attributes: Record<string, unknown>;
            relationships?: Record<string, RelationshipRef>;
        }>>;
    }): Store;
}
export {};
//# sourceMappingURL=Store.d.ts.map