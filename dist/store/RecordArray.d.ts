/**
 * Observable array proxies for store query results.
 *
 * Two classes are provided:
 *
 * ## `RecordArray<T>`
 * A live, read-only view of all records of a given type in the store's
 * identity map.  The contents are derived via an injected `source` function
 * so they stay in sync automatically with the identity map.
 *
 * Supports `update()` to trigger a background re-fetch if an `update` callback
 * is provided.
 *
 * ## `AdapterPopulatedRecordArray<T>`
 * A subclass used for the results of `store.query()`.  Unlike `RecordArray`,
 * its contents are determined by the last adapter response (order preserved,
 * no auto-sync with new pushes).
 *
 * Adds `meta`, `links`, and `query` properties that are set by the store after
 * each adapter call.
 */
import type { Model } from '@mobx-data/model';
/** Constructor options for `RecordArray`. */
export interface RecordArrayOptions<T extends Model> {
    /** Registered model name. */
    modelName: string;
    /** Function that returns the current record list (called on each access). */
    source: () => T[];
    /** Optional async callback invoked by `update()`. */
    update?: () => Promise<void>;
    /**
     * When `true`, the internal MobX computed retains its cached value even when
     * no observers are actively subscribed.  Prevents expensive recomputation
     * for long-lived filtered views (e.g. `liveQuery` results).
     */
    keepAlive?: boolean;
}
/**
 * Live, read-only view of all records of a given type.
 *
 * The `source` function is called on each observable access so the array
 * always reflects the current store state.  MobX tracks the `source` call
 * as part of `resolved`, so any computed prop that reads from this array
 * will re-run when the underlying identity map changes.
 */
export declare class RecordArray<T extends Model = Model> implements Iterable<T> {
    private readonly opts;
    /** `true` while `update()` is in progress. */
    protected updating: boolean;
    constructor(opts: RecordArrayOptions<T>);
    /** Current record list, derived from the injected `source` function. */
    protected get resolved(): T[];
    /** `true` while a background `update()` call is in progress. */
    get isLoading(): boolean;
    /** Alias for `isLoading`. */
    get isUpdating(): boolean;
    /** Number of records in the array. */
    get length(): number;
    /** The registered model name for the records in this array. */
    get modelName(): string;
    /** Returns the record at `index`, or `undefined`. */
    at(index: number): T | undefined;
    /** Returns a plain array snapshot of all records. */
    toArray(): T[];
    /** Maps over records. */
    map<R>(callback: (record: T, i: number) => R): R[];
    /** Filters records. */
    filter(predicate: (record: T, i: number) => boolean): T[];
    /** Iterates records. */
    forEach(callback: (record: T, i: number) => void): void;
    /** Returns `true` when `record` is in the array. */
    includes(record: T): boolean;
    /**
     * Triggers the `update` callback (if any) to refresh the array from the
     * adapter.  Sets `isLoading` while the request is in flight.
     */
    update(): Promise<this>;
    [Symbol.iterator](): Iterator<T>;
}
/** Constructor options for `AdapterPopulatedRecordArray`. */
export interface AdapterPopulatedRecordArrayOptions<T extends Model> extends RecordArrayOptions<T> {
    /** Query parameters that produced this result set. */
    query: Record<string, unknown>;
    /** Server-side metadata (pagination, total counts, etc.). */
    meta?: Record<string, unknown>;
    /** Pagination or related links. */
    links?: Record<string, string>;
}
/**
 * Record array populated by an adapter query response.
 *
 * The store creates one of these for each `store.query()` call.  Its contents
 * are driven by the id list returned from the last adapter call, not by live
 * identity map iteration.
 *
 * Call `.update()` to re-issue the original query and refresh the contents.
 */
export declare class AdapterPopulatedRecordArray<T extends Model = Model> extends RecordArray<T> {
    private queryParams;
    private metaData;
    private linksData;
    constructor(opts: AdapterPopulatedRecordArrayOptions<T>);
    /** Server-side metadata attached to the last response (e.g. pagination). */
    get meta(): Record<string, unknown>;
    /** Links attached to the last response. */
    get links(): Record<string, string>;
    /** The query parameters that produced this array. */
    get query(): Record<string, unknown>;
    /** Called by the store to update `meta` after a successful query. */
    _setMeta(meta: Record<string, unknown>): void;
    /** Called by the store to update `links` after a successful query. */
    _setLinks(links: Record<string, string>): void;
}
//# sourceMappingURL=RecordArray.d.ts.map