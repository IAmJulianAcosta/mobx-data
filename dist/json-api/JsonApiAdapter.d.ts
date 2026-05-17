/**
 * Adapter that implements the [JSON:API](https://jsonapi.org) specification.
 *
 * Extends `RestAdapter` with the following differences:
 *
 * - **MIME types** — `Accept` and `Content-Type` headers are set to
 *   `application/vnd.api+json` as required by the spec.
 * - **PATCH for updates** — `updateRecord` uses `PATCH` instead of `PUT`.
 * - **`coalesceFindRequests: true`** — the store coalesces separate
 *   `findRecord` calls into a single `findMany` request.
 *
 * URL construction is inherited from `RestAdapter` / `Adapter` unchanged;
 * override `pathForType` or `urlFor*` methods to customize.
 */
import { RestAdapter, type AdapterSnapshot } from '@mobx-data/adapter';
export declare class JsonApiAdapter extends RestAdapter {
    /** Always coalesce `findRecord` calls into a single `findMany` request. */
    coalesceFindRequests: boolean;
    /** Returns JSON:API `Accept` header alongside any custom headers. */
    defaultHeaders(): Record<string, string>;
    /** Returns JSON:API `Content-Type` header for mutation requests. */
    mutationHeaders(): Record<string, string>;
    /**
     * Sends a PATCH request to update a record (JSON:API mandates PATCH, not PUT).
     */
    updateRecord(_store: unknown, modelName: string, snapshot: AdapterSnapshot): Promise<unknown>;
    /**
     * Sends a PATCH request with only the changed attributes (partial update).
     * Produces a JSON:API document with only the dirty attribute keys.
     */
    patchRecord(_store: unknown, modelName: string, snapshot: AdapterSnapshot): Promise<unknown>;
    /**
     * Extracts the raw data object from the snapshot for use as the PATCH body.
     * Subclasses may override this to produce a full JSON:API `{ data: … }` document.
     */
    protected _serializeForUpdate(snapshot: AdapterSnapshot): Record<string, unknown>;
}
//# sourceMappingURL=JsonApiAdapter.d.ts.map