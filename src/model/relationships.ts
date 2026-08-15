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

import {
  makeObservable, observable, computed, action, runInAction,
} from 'mobx';
import type { RelationshipDef } from '@mobx-data/schema';
import { observableRef } from '../mobxCompatibility.js';
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
  findRecord<T extends Model = Model>(
    type: string,
    id: string,
    options?: unknown,
  ): Promise<T>;
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
export class ManyArray<T extends Model = Model> implements Iterable<T> {
  static refData(
    ref: RelationshipRef | null,
  ): Array<{ type: string; id: string }> {
    if (!ref || !ref.data) {
      return [];
    }
    return Array.isArray(ref.data) ? ref.data : [];
  }

  private host: RelationshipHost;

  constructor(host: RelationshipHost) {
    this.host = host;
    makeObservable<this, 'resolved'>(this, {
      resolved: computed,
      length: computed,
      push: action,
      removeObject: action,
    });
  }

  /**
   * Resolves the current set of related records from the store identity map.
   * Pending (unsaved) members appended via `push()` are appended at the end.
   */
  private get resolved(): T[] {
    const ref = this.host.store._getRelationshipRefFor(this.host.parent, this.host.name);
    const resolved: T[] = [];
    const seen = new Set<T>();
    for (const reference of ManyArray.refData(ref)) {
      const record = this.host.store.peekRecord<T>(reference.type, reference.id);
      if (record) {
        resolved.push(record);
        seen.add(record);
      }
    }
    const pending = this.host.store._getPendingMembers(
      this.host.parent,
      this.host.name,
    );
    for (const pendingRecord of pending as Iterable<T>) {
      if (!seen.has(pendingRecord)) {
        resolved.push(pendingRecord);
      }
    }
    return resolved;
  }

  /** Number of related records currently in the array. */
  get length(): number {
    return this.resolved.length;
  }

  /** Returns the record at `index`, or `undefined`. */
  at(index: number): T | undefined {
    return this.resolved[index];
  }

  /**
   * Adds one or more records to the relationship.
   * Delegates to `store._hasManyAppend` which also handles inverse tracking.
   */
  push(...records: T[]): number {
    for (const record of records) {
      this.host.store._hasManyAppend(
        this.host.parent,
        this.host.name,
        this.host.meta,
        record,
      );
    }
    return this.length;
  }

  /**
   * Removes a record from the relationship.
   * Delegates to `store._hasManyRemove` which also handles inverse tracking.
   */
  removeObject(record: T): void {
    this.host.store._hasManyRemove(
      this.host.parent,
      this.host.name,
      this.host.meta,
      record,
    );
  }

  /** Returns `true` when `record` is currently in the relationship. */
  includes(record: T): boolean {
    return this.resolved.includes(record);
  }

  /** Returns a plain array snapshot of all related records. */
  toArray(): T[] {
    return [...this.resolved];
  }

  /** Maps over the related records. */
  map<R>(callback: (record: T, i: number) => R): R[] {
    return this.resolved.map(callback);
  }

  /** Filters the related records. */
  filter(predicate: (record: T, i: number) => boolean): T[] {
    return this.resolved.filter(predicate);
  }

  /** Iterates over the related records. */
  forEach(callback: (record: T, i: number) => void): void {
    this.resolved.forEach(callback);
  }

  [Symbol.iterator](): Iterator<T> {
    return this.resolved[Symbol.iterator]();
  }
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
export class AsyncBelongsTo<T extends Model = Model>
implements PromiseLike<T | null> {
  private host: RelationshipHost;

  private loadedState: 'pending' | 'fulfilled' | 'rejected' = 'pending';

  private currentValue: T | null = null;

  private error: unknown = null;

  private inflight: Promise<T | null> | null = null;

  constructor(host: RelationshipHost) {
    this.host = host;
    makeObservable<this, 'loadedState' | 'currentValue' | 'error' | 'syncFromCache'>(this, {
      loadedState: observable,
      currentValue: observableRef,
      error: observableRef,
      isPending: computed,
      isFulfilled: computed,
      isRejected: computed,
      isLoaded: computed,
      isLoading: computed,
      value: computed,
      reason: computed,
      syncFromCache: action,
    });
    this.syncFromCache();
  }

  /** Checks the store cache and transitions to `fulfilled` if the record is already loaded. */
  private syncFromCache(): void {
    const ref = this.host.store._getRelationshipRefFor(this.host.parent, this.host.name);
    if (!ref || !ref.data || Array.isArray(ref.data)) {
      this.currentValue = null;
      this.loadedState = 'fulfilled';
      return;
    }
    const cached = this.host.store.peekRecord<T>(ref.data.type, ref.data.id);
    if (cached) {
      this.currentValue = cached;
      this.loadedState = 'fulfilled';
    }
  }

  /** `true` while the relationship has not yet been resolved. */
  get isPending(): boolean {
    return this.loadedState === 'pending';
  }

  /** `true` once the relationship has been resolved (including to `null`). */
  get isFulfilled(): boolean {
    return this.loadedState === 'fulfilled';
  }

  /** `true` if the network request failed. */
  get isRejected(): boolean {
    return this.loadedState === 'rejected';
  }

  /** `true` while a network request is in flight. */
  get isLoading(): boolean {
    return this.inflight !== null && this.isPending;
  }

  /** `true` once the relationship is resolved. */
  get isLoaded(): boolean {
    return this.loadedState === 'fulfilled';
  }

  /** The resolved record, or `null` when the relationship is empty or not yet loaded. */
  get value(): T | null {
    return this.currentValue;
  }

  /** The rejection reason if `isRejected`. */
  get reason(): unknown {
    return this.error;
  }

  /**
   * Ensures the related record is loaded, returning a `Promise<T | null>`.
   * If the record is already in the store it resolves immediately.
   * Concurrent calls share the same in-flight promise.
   */
  load(): Promise<T | null> {
    // Re-check cache each time in case it was populated externally.
    this.syncFromCache();
    if (this.loadedState === 'fulfilled' && this.currentValue) {
      return Promise.resolve(this.currentValue);
    }
    if (this.inflight) {
      return this.inflight;
    }
    const ref = this.host.store._getRelationshipRefFor(this.host.parent, this.host.name);
    if (!ref || !ref.data || Array.isArray(ref.data)) {
      return Promise.resolve(null);
    }
    const { type, id } = ref.data;
    this.inflight = this.host.store.findRecord<T>(type, id).then(
      (record) => {
        runInAction(() => {
          this.currentValue = record;
          this.loadedState = 'fulfilled';
          this.inflight = null;
        });
        return record;
      },
      (error) => {
        runInAction(() => {
          this.error = error;
          this.loadedState = 'rejected';
          this.inflight = null;
        });
        throw error;
      },
    );
    return this.inflight;
  }

  /** Forces a fresh fetch, ignoring any cached value. */
  reload(): Promise<T | null> {
    this.inflight = null;
    this.loadedState = 'pending';
    return this.load();
  }

  then<TResult1 = T | null, TResult2 = never>(
    onfulfilled?:
    | ((value: T | null) => TResult1 | PromiseLike<TResult1>)
    | null
    | undefined,
    onrejected?:
    | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
    | null
    | undefined,
  ): PromiseLike<TResult1 | TResult2> {
    return this.load().then(onfulfilled, onrejected);
  }
}

/**
 * Async wrapper for a `hasMany` relationship.
 *
 * Mirrors the `AsyncBelongsTo` API but resolves to a `ManyArray<T>` instead
 * of a single record.  Missing referenced records are fetched in parallel via
 * `store.findRecord`.
 */
export class AsyncHasMany<T extends Model = Model>
implements PromiseLike<ManyArray<T>> {
  private host: RelationshipHost;

  private manyArray: ManyArray<T>;

  private loadedState: 'pending' | 'fulfilled' | 'rejected' = 'pending';

  private error: unknown = null;

  private inflight: Promise<ManyArray<T>> | null = null;

  constructor(host: RelationshipHost) {
    this.host = host;
    this.manyArray = new ManyArray<T>(host);
    makeObservable<this, 'loadedState' | 'error' | 'syncFromCache'>(this, {
      loadedState: observable,
      error: observableRef,
      isPending: computed,
      isFulfilled: computed,
      isRejected: computed,
      isLoaded: computed,
      isLoading: computed,
      length: computed,
      syncFromCache: action,
    });
    this.syncFromCache();
  }

  /** Transitions to `fulfilled` if all referenced records are already in the cache. */
  private syncFromCache(): void {
    const ref = this.host.store._getRelationshipRefFor(this.host.parent, this.host.name);
    const items = ManyArray.refData(ref);
    const allCached = items.every(
      (reference) => this.host.store.peekRecord(reference.type, reference.id) !== null,
    );
    if (allCached) {
      this.loadedState = 'fulfilled';
    }
  }

  /** `true` while the relationship has not yet been resolved. */
  get isPending(): boolean {
    return this.loadedState === 'pending';
  }

  /** `true` once all referenced records have been resolved. */
  get isFulfilled(): boolean {
    return this.loadedState === 'fulfilled';
  }

  /** `true` if any fetch failed. */
  get isRejected(): boolean {
    return this.loadedState === 'rejected';
  }

  /** `true` while a network request is in flight. */
  get isLoading(): boolean {
    return this.inflight !== null && this.isPending;
  }

  /** `true` once the relationship is resolved. */
  get isLoaded(): boolean {
    return this.loadedState === 'fulfilled';
  }

  /** The underlying `ManyArray` (always available, even before `load()`). */
  get value(): ManyArray<T> {
    return this.manyArray;
  }

  /** Number of records currently in the resolved array. */
  get length(): number {
    return this.manyArray.length;
  }

  /**
   * Ensures all referenced records are loaded.
   * Records already in the cache are not re-fetched.
   * Concurrent calls share the same in-flight promise.
   */
  load(): Promise<ManyArray<T>> {
    this.syncFromCache();
    if (this.loadedState === 'fulfilled') {
      return Promise.resolve(this.manyArray);
    }
    if (this.inflight) {
      return this.inflight;
    }
    const ref = this.host.store._getRelationshipRefFor(this.host.parent, this.host.name);
    const items = ManyArray.refData(ref);
    const missing = items.filter(
      (reference) => this.host.store.peekRecord(reference.type, reference.id) === null,
    );
    const loads = missing.map(
      (reference) => this.host.store.findRecord(reference.type, reference.id),
    );
    this.inflight = Promise.all(loads).then(
      () => {
        runInAction(() => {
          this.loadedState = 'fulfilled';
          this.inflight = null;
        });
        return this.manyArray;
      },
      (error) => {
        runInAction(() => {
          this.error = error;
          this.loadedState = 'rejected';
          this.inflight = null;
        });
        throw error;
      },
    );
    return this.inflight;
  }

  /** Forces a fresh fetch, ignoring any cached state. */
  reload(): Promise<ManyArray<T>> {
    this.inflight = null;
    this.loadedState = 'pending';
    return this.load();
  }

  then<TResult1 = ManyArray<T>, TResult2 = never>(
    onfulfilled?:
    | ((value: ManyArray<T>) => TResult1 | PromiseLike<TResult1>)
    | null
    | undefined,
    onrejected?:
    | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
    | null
    | undefined,
  ): PromiseLike<TResult1 | TResult2> {
    return this.load().then(onfulfilled, onrejected);
  }
}
