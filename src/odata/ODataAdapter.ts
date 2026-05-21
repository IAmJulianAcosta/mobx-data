import { injectable } from 'tsyringe';
import pluralize from 'pluralize';
import { pascalCase } from 'change-case';
import { RestAdapter } from '@mobx-data/adapter';
import type { AdapterSnapshot } from '@mobx-data/adapter';

/** All OData v4 system query option names (both bare and $-prefixed forms are checked). */
const ODATA_SYSTEM_QUERY_OPTIONS = new Set([
  '$filter',
  '$select',
  '$orderby',
  '$top',
  '$skip',
  '$expand',
  '$count',
  '$search',
  '$format',
  '$skiptoken',
]);

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
@injectable()
export class ODataAdapter extends RestAdapter {
  /** OData protocol version sent in `OData-Version` and `OData-MaxVersion` headers. */
  odataVersion: string = '4.0';

  static isNumericKey(id: string): boolean {
    return /^-?\d+(?:\.\d+)?$/.test(id);
  }

  static escapeODataString(value: string): string {
    return value.replace(/'/g, "''");
  }

  override defaultHeaders(): Record<string, string> {
    return {
      Accept: 'application/json;odata.metadata=minimal',
      'OData-Version': this.odataVersion,
      'OData-MaxVersion': this.odataVersion,
      ...this.headers,
    };
  }

  override mutationHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json;odata.metadata=minimal',
      ...this.defaultHeaders(),
    };
  }

  /**
   * Maps a camelCase/dasherized model name to a PascalCase plural entity-set name.
   * @example `pathForType('orderItem')` → `'OrderItems'`
   */
  override pathForType(modelName: string): string {
    return pascalCase(pluralize.plural(modelName));
  }

  /**
   * Encodes a record id as an OData key literal.
   * Numeric ids are returned bare (`1`); string ids are single-quoted with
   * inner apostrophes escaped (`o'brien` → `'o''brien'`).
   *
   * Override this method when the service uses a non-default key format (e.g. GUIDs).
   */
  encodeKey(id: string): string {
    if (ODataAdapter.isNumericKey(id)) {
      return id;
    }
    return `'${ODataAdapter.escapeODataString(id)}'`;
  }

  override urlForFindRecord(
    id: string,
    modelName: string,
    _snapshot: AdapterSnapshot,
  ): string {
    return this._composeURL(`${this.pathForType(modelName)}(${this.encodeKey(id)})`);
  }

  override urlForUpdateRecord(
    id: string,
    modelName: string,
    _snapshot: AdapterSnapshot,
  ): string {
    return this._composeURL(`${this.pathForType(modelName)}(${this.encodeKey(id)})`);
  }

  override urlForDeleteRecord(
    id: string,
    modelName: string,
    _snapshot: AdapterSnapshot,
  ): string {
    return this._composeURL(`${this.pathForType(modelName)}(${this.encodeKey(id)})`);
  }

  /**
   * Fetches multiple records by id using a single request.
   * Builds a `$filter=id eq X or id eq Y` expression so only one HTTP round-trip
   * is needed regardless of how many ids are requested.
   */
  override async findMany(
    _store: unknown,
    modelName: string,
    ids: string[],
    snapshots: AdapterSnapshot[],
  ): Promise<unknown> {
    const base = this.buildURL(modelName, ids, snapshots, 'findMany');
    const filter = ids.map((id) => `id eq ${this.encodeKey(id)}`).join(' or ');
    const url = `${base}?${this._toQueryString({ $filter: filter })}`;
    return this._fetchJSON(url, {
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
    const normalized = this._normalizeQuery(query);
    const url = `${base}${this._appendQuery(normalized)}`;
    return this._fetchJSON(url, {
      method: 'GET',
      headers: this.defaultHeaders(),
    });
  }

  /**
   * Queries for a single record by appending `$top=1` to whatever filter is provided.
   * The caller is responsible for picking the first element from the returned `value` array.
   */
  override async queryRecord(
    _store: unknown,
    modelName: string,
    query: Record<string, unknown>,
  ): Promise<unknown> {
    const base = this.buildURL(modelName, null, null, 'queryRecord', query);
    const normalized = { ...this._normalizeQuery(query), $top: 1 };
    const url = `${base}${this._appendQuery(normalized)}`;
    return this._fetchJSON(url, {
      method: 'GET',
      headers: this.defaultHeaders(),
    });
  }

  /** Sends a PATCH request (partial update) as required by the OData v4 spec. */
  override async updateRecord(
    _store: unknown,
    modelName: string,
    snapshot: AdapterSnapshot,
  ): Promise<unknown> {
    const url = this.buildURL(modelName, snapshot.id, snapshot, 'updateRecord');
    return this._fetchJSON(url, {
      method: 'PATCH',
      headers: this.mutationHeaders(),
      body: JSON.stringify(this._serializeSnapshot(snapshot)),
    });
  }

  /** Sends a PATCH request with only the changed attributes (partial update). */
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

  /** Extracts the raw attribute map from the snapshot's internal record. */
  protected _serializeSnapshot(snapshot: AdapterSnapshot): Record<string, unknown> {
    const record = snapshot.record as { _data?: Record<string, unknown> };
    const data = record._data;
    const body: Record<string, unknown> = {};
    if (data) {
      for (const key of Object.keys(data)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') { continue; }
        body[key] = data[key];
      }
    }
    return body;
  }

  /**
   * Normalises a query hash so every OData system option has its `$` prefix.
   * Bare names (`filter`, `top`, `expand`) are prefixed automatically.
   * Custom (non-system) keys are forwarded verbatim.
   * `null` and `undefined` values are dropped.
   */
  protected _normalizeQuery(
    query: Record<string, unknown>,
  ): Record<string, unknown> {
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) {
        continue;
      }
      if (ODATA_SYSTEM_QUERY_OPTIONS.has(key)) {
        normalized[key] = value;
      } else if (ODATA_SYSTEM_QUERY_OPTIONS.has(`$${key}`)) {
        normalized[`$${key}`] = value;
      } else {
        normalized[key] = value;
      }
    }
    return normalized;
  }

  /** Serialises a key→value map to a `key=value&…` query string (percent-encoded). */
  protected _toQueryString(query: Record<string, unknown>): string {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) {
        continue;
      }
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
    return parts.join('&');
  }

  /** Returns `?key=value&…` when the query is non-empty, or an empty string. */
  protected _appendQuery(query: Record<string, unknown>): string {
    const queryString = this._toQueryString(query);
    return queryString ? `?${queryString}` : '';
  }
}
