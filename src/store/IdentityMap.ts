/**
 * Two-level observable map that serves as the store's record cache.
 *
 * Records are stored in per-type buckets:
 * ```
 * buckets: Map<modelName, Map<id, Model>>
 * ```
 *
 * The outer map is MobX-observable (shallow) so derived views like `peekAll`
 * react when new type buckets are added.  Each inner bucket is an observable
 * map so computed properties that iterate records within a type react to
 * additions and deletions.
 *
 * All mutating methods (`set`, `delete`, `clear`) are MobX `action`s so they
 * batch observable updates correctly.
 */

import { makeObservable, observable, action } from 'mobx';
import type { Model } from '@mobx-data/model';

export class IdentityMap {
  /** @internal */
  readonly _buckets: Map<string, Map<string, Model>> = new Map();

  constructor() {
    makeObservable<this, '_buckets'>(this, {
      _buckets: observable.shallow,
      set: action,
      delete: action,
      clear: action,
    });
  }

  /**
   * Returns the bucket for `modelName`, optionally creating it when absent.
   * Internal helper — not part of the public API.
   */
  private bucket(modelName: string, create = false): Map<string, Model> | undefined {
    let existing = this._buckets.get(modelName);
    if (!existing && create) {
      existing = observable.map<string, Model>({}, { deep: false });
      this._buckets.set(modelName, existing);
    }
    return existing;
  }

  /** Adds or replaces the record with the given `id` under `modelName`. */
  set(modelName: string, id: string, record: Model): void {
    const bucket = this.bucket(modelName, true)!;
    bucket.set(id, record);
  }

  /**
   * Returns the record for `modelName` + `id`, or `null` when not found.
   */
  get(modelName: string, id: string): Model | null {
    return this.bucket(modelName)?.get(id) ?? null;
  }

  /** Returns `true` when a record exists for `modelName` + `id`. */
  has(modelName: string, id: string): boolean {
    return this.bucket(modelName)?.has(id) ?? false;
  }

  /**
   * Removes the record for `modelName` + `id`.
   * @returns `true` when the record existed and was deleted.
   */
  delete(modelName: string, id: string): boolean {
    return this.bucket(modelName)?.delete(id) ?? false;
  }

  /** Returns all records stored under `modelName` as an array. */
  all(modelName: string): Model[] {
    const bucket = this.bucket(modelName);
    if (!bucket) {
      return [];
    }
    return Array.from(bucket.values());
  }

  /**
   * Clears all records for `modelName`, or all records across all types when
   * `modelName` is omitted.
   */
  clear(modelName?: string): void {
    if (modelName) {
      this.bucket(modelName)?.clear();
    } else {
      for (const bucket of this._buckets.values()) {
        bucket.clear();
      }
    }
  }

  /**
   * Returns the number of records stored for `modelName`, or the total across
   * all types when `modelName` is omitted.
   */
  size(modelName?: string): number {
    if (modelName) {
      return this.bucket(modelName)?.size ?? 0;
    }
    let total = 0;
    for (const bucket of this._buckets.values()) {
      total += bucket.size;
    }
    return total;
  }
}
