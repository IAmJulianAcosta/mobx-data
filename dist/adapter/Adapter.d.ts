/**
 * Abstract base class for all adapters.
 *
 * An adapter translates store operations (findRecord, createRecord, …) into
 * concrete network requests and returns raw payloads that the serializer layer
 * then normalises.  Concrete subclasses (`RestAdapter`, `ODataAdapter`, …)
 * override the abstract CRUD methods and may also override the URL-building
 * helpers to produce protocol-specific URLs.
 *
 * URL construction follows an Ember Data–style pipeline:
 *   `buildURL` → `urlForFindRecord` / `urlForQuery` / … → `_composeURL`
 *
 * Configuration surface:
 *   - `host`      – base URL prefix (e.g. `https://api.example.com`)
 *   - `namespace` – path segment appended after the host (e.g. `v2`)
 *   - `headers`   – headers merged into every request
 *   - `coalesceFindRequests` – when `true` the store batches separate
 *     `findRecord` calls into a single `findMany` call
 */
/** Union of all operation names the store can issue to an adapter. */
export type AdapterRequestType = 'findRecord' | 'findAll' | 'findMany' | 'query' | 'queryRecord' | 'createRecord' | 'updateRecord' | 'deleteRecord';
/**
 * A frozen view of a model record passed to the adapter.
 * Adapters read but do not mutate snapshots.
 */
export interface AdapterSnapshot {
    /** The record's server-assigned id, or `null` for new records. */
    id: string | null;
    /** The model's registered `modelName`. */
    modelName: string;
    /** Returns the current value for an attribute key. */
    attr(key: string): unknown;
    /** Returns the `belongsTo` relationship value (or just its id when `{ id: true }`). */
    belongsTo(key: string, options?: {
        id: boolean;
    }): unknown;
    /** Returns the `hasMany` relationship values (or just ids when `{ ids: true }`). */
    hasMany(key: string, options?: {
        ids: boolean;
    }): unknown;
    /** Returns `{ [key]: [oldValue, newValue] }` for attributes that differ from the server state. */
    changedAttributes(): Record<string, [unknown, unknown]>;
    /** Reference to the live record instance. */
    record: unknown;
}
export declare abstract class Adapter {
    /** Base URL prepended to every generated URL.  Empty string = relative URLs. */
    namespace: string;
    /** Host prefix, e.g. `https://api.example.com`. */
    host: string;
    /** Extra headers merged into every request via `defaultHeaders()`. */
    headers: Record<string, string>;
    /**
     * When `true` the store will coalesce multiple `findRecord` calls for the
     * same model type into a single `findMany` network request.
     */
    coalesceFindRequests: boolean;
    /** Fetches a single record by id. */
    abstract findRecord(store: unknown, modelName: string, id: string, snapshot: AdapterSnapshot, options?: {
        include?: string;
    }): Promise<unknown>;
    /** Fetches all records of a given model type. */
    abstract findAll(store: unknown, modelName: string, sinceToken: string | null, snapshotArray: AdapterSnapshot[], options?: {
        include?: string;
    }): Promise<unknown>;
    /** Fetches multiple records by id in a single request. */
    abstract findMany(store: unknown, modelName: string, ids: string[], snapshots: AdapterSnapshot[]): Promise<unknown>;
    /** Executes an arbitrary server-side query, returning an array of records. */
    abstract query(store: unknown, modelName: string, query: Record<string, unknown>): Promise<unknown>;
    /** Like `query` but returns at most one record. */
    abstract queryRecord(store: unknown, modelName: string, query: Record<string, unknown>): Promise<unknown>;
    /** Persists a new record to the server (POST). */
    abstract createRecord(store: unknown, modelName: string, snapshot: AdapterSnapshot): Promise<unknown>;
    /** Persists all attributes of an existing record (PUT). */
    abstract updateRecord(store: unknown, modelName: string, snapshot: AdapterSnapshot): Promise<unknown>;
    /**
     * Persists only the changed attributes of an existing record (PATCH).
     * Default implementation delegates to `updateRecord`.
     * Override in subclasses to send a partial payload via HTTP PATCH.
     */
    patchRecord(store: unknown, modelName: string, snapshot: AdapterSnapshot): Promise<unknown>;
    /** Removes a record from the server (DELETE). */
    abstract deleteRecord(store: unknown, modelName: string, snapshot: AdapterSnapshot): Promise<unknown>;
    /**
     * Returns the URL path segment for a given model name.
     * Default: dasherized, pluralized form — e.g. `userPost` → `user-posts`.
     */
    pathForType(modelName: string): string;
    /**
     * Assembles a full URL from `host`, `namespace`, and the supplied `path`.
     * Returns an absolute URL when `host` is set, otherwise a root-relative path.
     */
    protected _composeURL(path: string): string;
    /**
     * Dispatches to the appropriate `urlFor*` method based on `requestType`.
     *
     * @param modelName   - Registered model name.
     * @param id          - Record id(s), or `null` for collection requests.
     * @param snapshot    - Snapshot(s) for the request.
     * @param requestType - Operation being performed.
     * @param query       - Query parameters (used for `query` / `queryRecord`).
     */
    buildURL(modelName: string, id: string | string[] | null, snapshot: AdapterSnapshot | AdapterSnapshot[] | null, requestType: AdapterRequestType, query?: Record<string, unknown>): string;
    /** URL for a `findRecord` request.  Default: `<collection>/<id>`. */
    urlForFindRecord(id: string, modelName: string, _snapshot: AdapterSnapshot): string;
    /** URL for a `findAll` request.  Default: `<collection>`. */
    urlForFindAll(modelName: string, _snapshots: AdapterSnapshot[]): string;
    /** URL for a `findMany` request.  Default: `<collection>` (ids appended by the adapter). */
    urlForFindMany(_ids: string[], modelName: string, _snapshots: AdapterSnapshot[]): string;
    /** URL for a `query` request.  Default: `<collection>`. */
    urlForQuery(_query: Record<string, unknown>, modelName: string): string;
    /** URL for a `queryRecord` request.  Default: `<collection>`. */
    urlForQueryRecord(_query: Record<string, unknown>, modelName: string): string;
    /** URL for a `createRecord` request.  Default: `<collection>`. */
    urlForCreateRecord(modelName: string, _snapshot: AdapterSnapshot): string;
    /** URL for an `updateRecord` request.  Default: `<collection>/<id>`. */
    urlForUpdateRecord(id: string, modelName: string, _snapshot: AdapterSnapshot): string;
    /** URL for a `deleteRecord` request.  Default: `<collection>/<id>`. */
    urlForDeleteRecord(id: string, modelName: string, _snapshot: AdapterSnapshot): string;
    /**
     * Groups snapshots into batches for `findMany`.
     * Default implementation puts all snapshots in a single batch.
     */
    groupRecordsForFindMany(_store: unknown, snapshots: AdapterSnapshot[]): AdapterSnapshot[][];
    /**
     * Returns `true` when the store should bypass the cache and reload this
     * record immediately.  Default: always `false`.
     */
    shouldReloadRecord(_store: unknown, _snapshot: AdapterSnapshot): boolean;
    /**
     * Returns `true` when the store should schedule a background reload for
     * this record after returning the cached version.  Default: always `true`.
     */
    shouldBackgroundReloadRecord(_store: unknown, _snapshot: AdapterSnapshot): boolean;
    /**
     * Returns `true` when the store should reload the full collection on every
     * `findAll` call.  Default: always `false`.
     */
    shouldReloadAll(_store: unknown, _snapshotRecordArray: AdapterSnapshot[]): boolean;
    /**
     * Returns `true` when the store should schedule a background reload after
     * returning a cached collection.  Default: always `true`.
     */
    shouldBackgroundReloadAll(_store: unknown, _snapshotRecordArray: AdapterSnapshot[]): boolean;
}
//# sourceMappingURL=Adapter.d.ts.map