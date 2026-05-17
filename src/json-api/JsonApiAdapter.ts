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

import { injectable } from 'tsyringe';
import { RestAdapter, type AdapterSnapshot } from '@mobx-data/adapter';

@injectable()
export class JsonApiAdapter extends RestAdapter {
  /** Always coalesce `findRecord` calls into a single `findMany` request. */
  override coalesceFindRequests = true;

  /** Returns JSON:API `Accept` header alongside any custom headers. */
  override defaultHeaders(): Record<string, string> {
    return {
      Accept: 'application/vnd.api+json',
      ...this.headers,
    };
  }

  /** Returns JSON:API `Content-Type` header for mutation requests. */
  override mutationHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/vnd.api+json',
      ...this.defaultHeaders(),
    };
  }

  /**
   * Sends a PATCH request to update a record (JSON:API mandates PATCH, not PUT).
   */
  override async updateRecord(
    _store: unknown,
    modelName: string,
    snapshot: AdapterSnapshot,
  ): Promise<unknown> {
    const url = this.buildURL(modelName, snapshot.id, snapshot, 'updateRecord');
    return this._fetchJSON(url, {
      method: 'PATCH',
      headers: this.mutationHeaders(),
      body: JSON.stringify(this._serializeForUpdate(snapshot)),
    });
  }

  /**
   * Sends a PATCH request with only the changed attributes (partial update).
   * Produces a JSON:API document with only the dirty attribute keys.
   */
  override async patchRecord(
    _store: unknown,
    modelName: string,
    snapshot: AdapterSnapshot,
  ): Promise<unknown> {
    const url = this.buildURL(modelName, snapshot.id, snapshot, 'updateRecord');
    const changed = snapshot.changedAttributes();
    const attributes: Record<string, unknown> = {};
    for (const [key, [, current]] of Object.entries(changed)) {
      attributes[key] = current;
    }
    const body = {
      data: {
        type: modelName,
        id: snapshot.id,
        attributes,
      },
    };
    return this._fetchJSON(url, {
      method: 'PATCH',
      headers: this.mutationHeaders(),
      body: JSON.stringify(body),
    });
  }

  /**
   * Extracts the raw data object from the snapshot for use as the PATCH body.
   * Subclasses may override this to produce a full JSON:API `{ data: … }` document.
   */
  protected _serializeForUpdate(snapshot: AdapterSnapshot): Record<string, unknown> {
    const rec = snapshot.record as { _data?: Record<string, unknown> };
    return rec._data ? { ...rec._data } : {};
  }
}
