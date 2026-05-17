import { RestAdapter } from '@mobx-data/adapter';
import type { AdapterSnapshot } from '@mobx-data/adapter';
/**
 * OData v4 adapter.
 *
 * Extends `RestAdapter` with OData-specific conventions:
 * - Entity-set names are PascalCase plural (`user` → `Users`).
 * - Single-entity URLs use key-in-parentheses syntax (`Users(1)`, `Users('abc')`).
 * - Mutations use PATCH instead of PUT.
 * - Accept / Content-Type headers carry the `odata.metadata=minimal` parameter.
 * - System query options (`$filter`, `$expand`, etc.) are passed through verbatim;
 *   bare names are auto-prefixed (`filter` → `$filter`).
 */
export declare class ODataAdapter extends RestAdapter {
    /** OData protocol version sent in `OData-Version` and `OData-MaxVersion` headers. */
    odataVersion: string;
    static isNumericKey(id: string): boolean;
    static escapeODataString(value: string): string;
    defaultHeaders(): Record<string, string>;
    mutationHeaders(): Record<string, string>;
    /**
     * Maps a camelCase/dasherized model name to a PascalCase plural entity-set name.
     * @example `pathForType('orderItem')` → `'OrderItems'`
     */
    pathForType(modelName: string): string;
    /**
     * Encodes a record id as an OData key literal.
     * Numeric ids are returned bare (`1`); string ids are single-quoted with
     * inner apostrophes escaped (`o'brien` → `'o''brien'`).
     *
     * Override this method when the service uses a non-default key format (e.g. GUIDs).
     */
    encodeKey(id: string): string;
    urlForFindRecord(id: string, modelName: string, _snapshot: AdapterSnapshot): string;
    urlForUpdateRecord(id: string, modelName: string, _snapshot: AdapterSnapshot): string;
    urlForDeleteRecord(id: string, modelName: string, _snapshot: AdapterSnapshot): string;
    /**
     * Fetches multiple records by id using a single request.
     * Builds a `$filter=id eq X or id eq Y` expression so only one HTTP round-trip
     * is needed regardless of how many ids are requested.
     */
    findMany(_store: unknown, modelName: string, ids: string[], snapshots: AdapterSnapshot[]): Promise<unknown>;
    query(_store: unknown, modelName: string, query: Record<string, unknown>): Promise<unknown>;
    /**
     * Queries for a single record by appending `$top=1` to whatever filter is provided.
     * The caller is responsible for picking the first element from the returned `value` array.
     */
    queryRecord(_store: unknown, modelName: string, query: Record<string, unknown>): Promise<unknown>;
    /** Sends a PATCH request (partial update) as required by the OData v4 spec. */
    updateRecord(_store: unknown, modelName: string, snapshot: AdapterSnapshot): Promise<unknown>;
    /** Sends a PATCH request with only the changed attributes (partial update). */
    patchRecord(_store: unknown, modelName: string, snapshot: AdapterSnapshot): Promise<unknown>;
    /** Extracts the raw attribute map from the snapshot's internal record. */
    protected _serializeSnapshot(snapshot: AdapterSnapshot): Record<string, unknown>;
    /**
     * Normalises a query hash so every OData system option has its `$` prefix.
     * Bare names (`filter`, `top`, `expand`) are prefixed automatically.
     * Custom (non-system) keys are forwarded verbatim.
     * `null` and `undefined` values are dropped.
     */
    protected _normalizeQuery(query: Record<string, unknown>): Record<string, unknown>;
    /** Serialises a key→value map to a `key=value&…` query string (percent-encoded). */
    protected _toQueryString(query: Record<string, unknown>): string;
    /** Returns `?key=value&…` when the query is non-empty, or an empty string. */
    protected _appendQuery(query: Record<string, unknown>): string;
}
//# sourceMappingURL=ODataAdapter.d.ts.map