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

import { makeObservable, computed, observable } from 'mobx';
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
export class RecordArray<T extends Model = Model> implements Iterable<T> {
  private readonly opts: RecordArrayOptions<T>;

  /** `true` while `update()` is in progress. */
  protected updating: boolean = false;

  constructor(opts: RecordArrayOptions<T>) {
    this.opts = opts;
    makeObservable<this, 'resolved' | 'updating'>(this, {
      resolved: opts.keepAlive ? computed({ keepAlive: true }) : computed,
      updating: observable,
      length: computed,
      modelName: computed,
    });
  }

  /** Current record list, derived from the injected `source` function. */
  protected get resolved(): T[] {
    return this.opts.source();
  }

  /** `true` while a background `update()` call is in progress. */
  get isLoading(): boolean {
    return this.updating;
  }

  /** Alias for `isLoading`. */
  get isUpdating(): boolean {
    return this.updating;
  }

  /** Number of records in the array. */
  get length(): number {
    return this.resolved.length;
  }

  /** The registered model name for the records in this array. */
  get modelName(): string {
    return this.opts.modelName;
  }

  /** Returns the record at `index`, or `undefined`. */
  at(index: number): T | undefined {
    return this.resolved[index];
  }

  /** Returns a plain array snapshot of all records. */
  toArray(): T[] {
    return [...this.resolved];
  }

  /** Maps over records. */
  map<R>(callback: (record: T, i: number) => R): R[] {
    return this.resolved.map(callback);
  }

  /** Filters records. */
  filter(predicate: (record: T, i: number) => boolean): T[] {
    return this.resolved.filter(predicate);
  }

  /** Iterates records. */
  forEach(callback: (record: T, i: number) => void): void {
    this.resolved.forEach(callback);
  }

  /** Returns `true` when `record` is in the array. */
  includes(record: T): boolean {
    return this.resolved.includes(record);
  }

  /**
   * Triggers the `update` callback (if any) to refresh the array from the
   * adapter.  Sets `isLoading` while the request is in flight.
   */
  async update(): Promise<this> {
    if (!this.opts.update) {
      return this;
    }
    this.updating = true;
    try {
      await this.opts.update();
    } finally {
      this.updating = false;
    }
    return this;
  }

  [Symbol.iterator](): Iterator<T> {
    return this.resolved[Symbol.iterator]();
  }
}

/** Constructor options for `AdapterPopulatedRecordArray`. */
export interface AdapterPopulatedRecordArrayOptions<T extends Model>
  extends RecordArrayOptions<T> {
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
export class AdapterPopulatedRecordArray<
  T extends Model = Model,
> extends RecordArray<T> {
  private queryParams: Record<string, unknown>;

  private metaData: Record<string, unknown>;

  private linksData: Record<string, string>;

  constructor(opts: AdapterPopulatedRecordArrayOptions<T>) {
    super(opts);
    this.queryParams = opts.query;
    this.metaData = opts.meta ?? {};
    this.linksData = opts.links ?? {};
    makeObservable<this, 'metaData' | 'linksData'>(this, {
      metaData: observable.ref,
      linksData: observable.ref,
      meta: computed,
      links: computed,
      query: computed,
    });
  }

  /** Server-side metadata attached to the last response (e.g. pagination). */
  get meta(): Record<string, unknown> {
    return this.metaData;
  }

  /** Links attached to the last response. */
  get links(): Record<string, string> {
    return this.linksData;
  }

  /** The query parameters that produced this array. */
  get query(): Record<string, unknown> {
    return this.queryParams;
  }

  /** Called by the store to update `meta` after a successful query. */
  _setMeta(meta: Record<string, unknown>): void {
    this.metaData = meta;
  }

  /** Called by the store to update `links` after a successful query. */
  _setLinks(links: Record<string, string>): void {
    this.linksData = links;
  }
}
