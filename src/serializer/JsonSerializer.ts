/**
 * Flat-JSON serializer for simple REST APIs.
 *
 * `JsonSerializer` expects payloads to be plain JSON objects or arrays with
 * no root-key wrapping.  It is the lowest-level concrete serializer and the
 * base that `RestSerializer` extends.
 *
 * Normalization:
 * - Array payload → `{ data: [NormalizedResource, …] }`
 * - Object payload → `{ data: NormalizedResource }`
 * - `null` / `undefined` → `{ data: null }`
 *
 * Serialization:
 * - Iterates `@attr` → writes via `serializeAttribute`
 * - Iterates `@belongsTo` / `@hasMany` → writes via `serializeBelongsTo` /
 *   `serializeHasMany`
 *
 * `normalizeResponse` automatically dispatches to the correct per-operation
 * hook (`normalizeFindRecordResponse`, etc.) when a subclass overrides them.
 * If no override exists it falls through to `_buildDocument`.
 */

import 'reflect-metadata';
import { injectable } from 'tsyringe';
import { MODEL_OPTIONS_META_KEY, type ModelOptions } from '../schema/types.js';
import {
  Serializer,
  type ModelClassMeta,
  type NormalizeRequestType,
  type NormalizedDocument,
  type NormalizedResource,
  type SerializerSnapshot,
} from './Serializer.js';

@injectable()
export class JsonSerializer extends Serializer {
  static dispatchMethodName(
    requestType: NormalizeRequestType,
  ): keyof Serializer | null {
    switch (requestType) {
      case 'findRecord':
        return 'normalizeFindRecordResponse';
      case 'findAll':
        return 'normalizeFindAllResponse';
      case 'query':
        return 'normalizeQueryResponse';
      case 'queryRecord':
        return 'normalizeQueryRecordResponse';
      case 'createRecord':
        return 'normalizeCreateRecordResponse';
      case 'updateRecord':
        return 'normalizeUpdateRecordResponse';
      case 'deleteRecord':
        return 'normalizeDeleteRecordResponse';
      default:
        return null;
    }
  }

  /**
   * Normalizes a single flat JSON object into a `NormalizedResource`.
   * Returns `null` for absent or non-object payloads.
   */
  override normalize(
    _store: unknown,
    modelClass: ModelClassMeta,
    payload: unknown,
    _prop?: string,
  ): NormalizedResource | null {
    if (payload === null || payload === undefined) {
      return null;
    }
    if (typeof payload !== 'object') {
      return null;
    }
    const hash = payload as Record<string, unknown>;
    const id = this.extractId(modelClass, hash);

    const modelOptions = Reflect.getOwnMetadata(
      MODEL_OPTIONS_META_KEY,
      modelClass,
    ) as ModelOptions | undefined;
    const attributes = modelOptions?.discriminator
      ? this.extractAllAttributes(modelClass, hash)
      : this.extractAttributes(modelClass, hash);

    const relationships = this.extractRelationships(modelClass, hash);

    const resource: NormalizedResource = {
      type: modelClass.modelName,
      id,
      attributes,
    };
    if (relationships && Object.keys(relationships).length > 0) {
      resource.relationships = relationships;
    }
    return resource;
  }

  /**
   * Entry point for normalization.
   *
   * Checks whether a subclass has overridden the relevant per-operation hook
   * (e.g. `normalizeFindRecordResponse`).  If so, calls it; otherwise falls
   * through to `_buildDocument`.
   */
  override normalizeResponse(
    store: unknown,
    modelClass: ModelClassMeta,
    payload: unknown,
    id: string | null,
    requestType: NormalizeRequestType,
  ): NormalizedDocument {
    const methodName = JsonSerializer.dispatchMethodName(requestType);
    if (methodName) {
      const override = (this as unknown as Record<string, unknown>)[methodName];
      const baseImpl = (Serializer.prototype as unknown as Record<string, unknown>)[
        methodName
      ];
      if (typeof override === 'function' && override !== baseImpl) {
        return (override as (...args: unknown[]) => NormalizedDocument).call(
          this,
          store,
          modelClass,
          payload,
          id,
          requestType,
        );
      }
    }
    return this._buildDocument(store, modelClass, payload, id, requestType);
  }

  /**
   * Builds a `NormalizedDocument` from a raw payload.
   * Arrays are normalized item by item; plain objects are normalized as a
   * single resource.
   */
  protected _buildDocument(
    store: unknown,
    modelClass: ModelClassMeta,
    payload: unknown,
    _id: string | null,
    _requestType: NormalizeRequestType,
  ): NormalizedDocument {
    if (payload === null || payload === undefined) {
      return { data: null };
    }
    if (Array.isArray(payload)) {
      const data = payload
        .map((p) => this.normalize(store, modelClass, p))
        .filter((r): r is NormalizedResource => r !== null);
      return { data };
    }
    const data = this.normalize(store, modelClass, payload);
    return { data };
  }

  /**
   * Serializes a snapshot to a flat JSON object.
   * Includes `id` when `options.includeId` is `true`.
   */
  override serialize(
    snapshot: SerializerSnapshot,
    options?: { includeId?: boolean },
  ): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if (options?.includeId && snapshot.id !== null) {
      json[this.primaryKey] = snapshot.id;
    }
    snapshot.eachAttribute((key, meta) => {
      this.serializeAttribute(snapshot, json, key, meta);
    });
    snapshot.eachRelationship((_key, rel) => {
      if (rel.kind === 'belongsTo') {
        this.serializeBelongsTo(snapshot, json, rel);
      } else {
        this.serializeHasMany(snapshot, json, rel);
      }
    });
    return json;
  }
}
