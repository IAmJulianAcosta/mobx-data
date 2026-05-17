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
import type { Model } from '@mobx-data/model';
export declare class IdentityMap {
    /** @internal */
    readonly _buckets: Map<string, Map<string, Model>>;
    constructor();
    /**
     * Returns the bucket for `modelName`, optionally creating it when absent.
     * Internal helper — not part of the public API.
     */
    private bucket;
    /** Adds or replaces the record with the given `id` under `modelName`. */
    set(modelName: string, id: string, record: Model): void;
    /**
     * Returns the record for `modelName` + `id`, or `null` when not found.
     */
    get(modelName: string, id: string): Model | null;
    /** Returns `true` when a record exists for `modelName` + `id`. */
    has(modelName: string, id: string): boolean;
    /**
     * Removes the record for `modelName` + `id`.
     * @returns `true` when the record existed and was deleted.
     */
    delete(modelName: string, id: string): boolean;
    /** Returns all records stored under `modelName` as an array. */
    all(modelName: string): Model[];
    /**
     * Clears all records for `modelName`, or all records across all types when
     * `modelName` is omitted.
     */
    clear(modelName?: string): void;
    /**
     * Returns the number of records stored for `modelName`, or the total across
     * all types when `modelName` is omitted.
     */
    size(modelName?: string): number;
}
//# sourceMappingURL=IdentityMap.d.ts.map