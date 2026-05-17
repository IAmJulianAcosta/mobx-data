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

import { injectable } from 'tsyringe';
import { Adapter, type AdapterSnapshot } from './Adapter.js';

@injectable()
export class RestAdapter extends Adapter {
  static serializeSnapshotToObject(
    snapshot: AdapterSnapshot,
  ): Record<string, unknown> {
    const body: Record<string, unknown> = {};
    const record = snapshot.record as { _data?: Record<string, unknown> };
    const data = record._data;
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue;
        }
        body[key] = value;
      }
    }
    return body;
  }

  static toQueryString(query: Record<string, unknown>): string {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) {
        continue;
      }
      parts.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
      );
    }
    return parts.length > 0 ? `?${parts.join('&')}` : '';
  }

  /** Headers sent with every read (GET) request. */
  defaultHeaders(): Record<string, string> {
    return {
      Accept: 'application/json',
      ...this.headers,
    };
  }

  /** Headers sent with every write (POST / PUT / DELETE) request. */
  mutationHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...this.defaultHeaders(),
    };
  }

  /**
   * Low-level fetch wrapper used by all operation methods.
   *
   * - Throws an enriched `Error` (with `status` and `body` properties) for
   *   any non-2xx response.
   * - Returns `null` for 204 No Content responses.
   * - Attempts JSON parsing; falls back to the raw text string on failure.
   */
  async _fetchJSON(
    url: string,
    init: RequestInit,
  ): Promise<unknown> {
    const response = await fetch(url, init);
    if (!response.ok) {
      let body: unknown = null;
      try {
        body = await response.json();
      } catch {
        /* ignore */
      }
      const error = Object.assign(
        new Error(`Request failed: ${response.status}`),
        { status: response.status, body },
      );
      throw error;
    }
    if (response.status === 204) {
      return null;
    }
    const text = await response.text();
    if (!text) {
      return null;
    }
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  override async findRecord(
    _store: unknown,
    modelName: string,
    id: string,
    snapshot: AdapterSnapshot,
    options?: { include?: string },
  ): Promise<unknown> {
    let url = this.buildURL(modelName, id, snapshot, 'findRecord');
    if (options?.include) {
      url += `${url.includes('?') ? '&' : '?'}include=${encodeURIComponent(options.include)}`;
    }
    return this._fetchJSON(url, {
      method: 'GET',
      headers: this.defaultHeaders(),
    });
  }

  override async findAll(
    _store: unknown,
    modelName: string,
    _sinceToken: string | null,
    snapshotArray: AdapterSnapshot[],
    options?: { include?: string },
  ): Promise<unknown> {
    let url = this.buildURL(modelName, null, snapshotArray, 'findAll');
    if (options?.include) {
      url += `${url.includes('?') ? '&' : '?'}include=${encodeURIComponent(options.include)}`;
    }
    return this._fetchJSON(url, {
      method: 'GET',
      headers: this.defaultHeaders(),
    });
  }

  /**
   * Fetches multiple records by appending an `ids` query parameter.
   * e.g. `/posts?ids=1,2,3`
   */
  override async findMany(
    _store: unknown,
    modelName: string,
    ids: string[],
    snapshots: AdapterSnapshot[],
  ): Promise<unknown> {
    const url = this.buildURL(modelName, ids, snapshots, 'findMany');
    const separator = url.includes('?') ? '&' : '?';
    const fullUrl = `${url}${separator}ids=${ids.map(encodeURIComponent).join(',')}`;
    return this._fetchJSON(fullUrl, {
      method: 'GET',
      headers: this.defaultHeaders(),
    });
  }

  override async query(
    _store: unknown,
    modelName: string,
    query: Record<string, unknown>,
  ): Promise<unknown> {
    const base = this.buildURL(modelName, null, null, 'query', query);
    const url = `${base}${RestAdapter.toQueryString(query)}`;
    return this._fetchJSON(url, {
      method: 'GET',
      headers: this.defaultHeaders(),
    });
  }

  override async queryRecord(
    _store: unknown,
    modelName: string,
    query: Record<string, unknown>,
  ): Promise<unknown> {
    const base = this.buildURL(modelName, null, null, 'queryRecord', query);
    const url = `${base}${RestAdapter.toQueryString(query)}`;
    return this._fetchJSON(url, {
      method: 'GET',
      headers: this.defaultHeaders(),
    });
  }

  override async createRecord(
    _store: unknown,
    modelName: string,
    snapshot: AdapterSnapshot,
  ): Promise<unknown> {
    const url = this.buildURL(modelName, null, snapshot, 'createRecord');
    return this._fetchJSON(url, {
      method: 'POST',
      headers: this.mutationHeaders(),
      body: JSON.stringify(RestAdapter.serializeSnapshotToObject(snapshot)),
    });
  }

  override async updateRecord(
    _store: unknown,
    modelName: string,
    snapshot: AdapterSnapshot,
  ): Promise<unknown> {
    const url = this.buildURL(modelName, snapshot.id, snapshot, 'updateRecord');
    return this._fetchJSON(url, {
      method: 'PUT',
      headers: this.mutationHeaders(),
      body: JSON.stringify(RestAdapter.serializeSnapshotToObject(snapshot)),
    });
  }

  override async patchRecord(
    _store: unknown,
    modelName: string,
    snapshot: AdapterSnapshot,
  ): Promise<unknown> {
    const url = this.buildURL(modelName, snapshot.id, snapshot, 'updateRecord');
    const changed = snapshot.changedAttributes();
    const partial: Record<string, unknown> = {};
    for (const [key, [, current]] of Object.entries(changed)) {
      partial[key] = current;
    }
    return this._fetchJSON(url, {
      method: 'PATCH',
      headers: this.mutationHeaders(),
      body: JSON.stringify(partial),
    });
  }

  override async deleteRecord(
    _store: unknown,
    modelName: string,
    snapshot: AdapterSnapshot,
  ): Promise<unknown> {
    const url = this.buildURL(modelName, snapshot.id, snapshot, 'deleteRecord');
    return this._fetchJSON(url, {
      method: 'DELETE',
      headers: this.defaultHeaders(),
    });
  }
}
