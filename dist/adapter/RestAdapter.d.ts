/**
 * HTTP/REST adapter that communicates with a JSON REST API.
 *
 * `RestAdapter` is the default concrete adapter.  It uses the Fetch API and
 * maps each store operation to a conventional HTTP verb:
 *
 * | Operation      | Method |
 * |----------------|--------|
 * | findRecord     | GET    |
 * | findAll        | GET    |
 * | findMany       | GET    |
 * | query          | GET    |
 * | queryRecord    | GET    |
 * | createRecord   | POST   |
 * | updateRecord   | PUT    |
 * | deleteRecord   | DELETE |
 *
 * Subclasses (e.g. `JsonApiAdapter`, `ODataAdapter`) override individual
 * methods to adjust headers, HTTP verbs, or body serialization without
 * reimplementing the full adapter.
 */
import { Adapter, type AdapterSnapshot } from './Adapter.js';
export declare class RestAdapter extends Adapter {
    static serializeSnapshotToObject(snapshot: AdapterSnapshot): Record<string, unknown>;
    static toQueryString(query: Record<string, unknown>): string;
    /** Headers sent with every read (GET) request. */
    defaultHeaders(): Record<string, string>;
    /** Headers sent with every write (POST / PUT / DELETE) request. */
    mutationHeaders(): Record<string, string>;
    /**
     * Low-level fetch wrapper used by all operation methods.
     *
     * - Throws an enriched `Error` (with `status` and `body` properties) for
     *   any non-2xx response.
     * - Returns `null` for 204 No Content responses.
     * - Attempts JSON parsing; falls back to the raw text string on failure.
     */
    _fetchJSON(url: string, init: RequestInit): Promise<unknown>;
    findRecord(_store: unknown, modelName: string, id: string, snapshot: AdapterSnapshot, options?: {
        include?: string;
    }): Promise<unknown>;
    findAll(_store: unknown, modelName: string, _sinceToken: string | null, snapshotArray: AdapterSnapshot[], options?: {
        include?: string;
    }): Promise<unknown>;
    /**
     * Fetches multiple records by appending an `ids` query parameter.
     * e.g. `/posts?ids=1,2,3`
     */
    findMany(_store: unknown, modelName: string, ids: string[], snapshots: AdapterSnapshot[]): Promise<unknown>;
    query(_store: unknown, modelName: string, query: Record<string, unknown>): Promise<unknown>;
    queryRecord(_store: unknown, modelName: string, query: Record<string, unknown>): Promise<unknown>;
    createRecord(_store: unknown, modelName: string, snapshot: AdapterSnapshot): Promise<unknown>;
    updateRecord(_store: unknown, modelName: string, snapshot: AdapterSnapshot): Promise<unknown>;
    patchRecord(_store: unknown, modelName: string, snapshot: AdapterSnapshot): Promise<unknown>;
    deleteRecord(_store: unknown, modelName: string, snapshot: AdapterSnapshot): Promise<unknown>;
}
//# sourceMappingURL=RestAdapter.d.ts.map