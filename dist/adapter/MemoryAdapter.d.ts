/**
 * In-memory adapter for testing and server-side rendering.
 *
 * `MemoryAdapter` stores records in plain `Map` structures with no network I/O.
 * It implements the full adapter interface (findRecord, findAll, findMany, query,
 * queryRecord, createRecord, updateRecord, deleteRecord) so it can serve as a
 * drop-in replacement for `RestAdapter` in unit tests or SSR hydration scenarios.
 *
 * Use `seed()` to pre-populate data and `reset()` to clear all state between
 * test cases.
 */
import { Adapter, type AdapterSnapshot } from './Adapter.js';
export declare class MemoryAdapter extends Adapter {
    private storage;
    private nextId;
    private getCollection;
    private generateId;
    /**
     * Pre-populates the adapter with records for a given model type.
     * Auto-increments the internal ID counter to avoid collisions with
     * subsequently created records.
     *
     * @param modelName - The model type to seed.
     * @param records - Array of plain objects; each must have an `id` key.
     */
    seed(modelName: string, records: Array<{
        id: string;
        [key: string]: unknown;
    }>): void;
    /** Clears all stored records and resets ID counters. */
    reset(): void;
    findRecord(_store: unknown, modelName: string, id: string): Promise<unknown>;
    findAll(_store: unknown, modelName: string): Promise<unknown>;
    findMany(_store: unknown, modelName: string, ids: string[]): Promise<unknown>;
    /** Filters records by exact attribute match on all query keys. */
    query(_store: unknown, modelName: string, query: Record<string, unknown>): Promise<unknown>;
    /** Returns the first record matching the query, or `null`. */
    queryRecord(_store: unknown, modelName: string, query: Record<string, unknown>): Promise<unknown>;
    private static safeAssign;
    createRecord(_store: unknown, modelName: string, snapshot: AdapterSnapshot): Promise<unknown>;
    updateRecord(_store: unknown, modelName: string, snapshot: AdapterSnapshot): Promise<unknown>;
    deleteRecord(_store: unknown, modelName: string, snapshot: AdapterSnapshot): Promise<unknown>;
}
//# sourceMappingURL=MemoryAdapter.d.ts.map