/**
 * Serializer that implements the [JSON:API](https://jsonapi.org) specification.
 *
 * ## Normalization
 *
 * Parses a JSON:API compound document `{ data, included, meta, links }` into
 * a `NormalizedDocument`.
 *
 * For each resource object:
 * - `type` is converted from JSON:API plural form to model name via
 *   `modelNameFromPayloadKey` (singularization).
 * - `id` is coerced to a string.
 * - `attributes` are copied directly.
 * - `relationships` data refs (`{ type, id }`) are normalized the same way.
 *
 * Side-loaded records in `included` are normalized individually, each using
 * its own `type` as the model class placeholder.
 *
 * ## Serialization
 *
 * Produces a JSON:API resource object wrapped in `{ data: … }`:
 *
 * ```json
 * {
 *   "data": {
 *     "type": "posts",
 *     "attributes": { "title": "Hello" },
 *     "relationships": {
 *       "author": { "data": { "type": "users", "id": "1" } }
 *     }
 *   }
 * }
 * ```
 *
 * `id` is included when `options.includeId` is `true`.
 */

import { injectable } from 'tsyringe';
import pluralize from 'pluralize';
import {
  Serializer,
  type ModelClassMeta,
  type NormalizeRequestType,
  type NormalizedDocument,
  type NormalizedResource,
  type SerializerSnapshot,
} from '@mobx-data/serializer';

/** Internal shape of a raw JSON:API resource object. */
interface JsonApiResource {
  type: string;
  id?: string | number | null;
  attributes?: Record<string, unknown>;
  relationships?: Record<string, {
    data:
    | { type: string; id: string | number }
    | Array<{ type: string; id: string | number }>
    | null;
  }>;
}

@injectable()
export class JsonApiSerializer extends Serializer {
  /**
   * Returns the plural JSON:API `type` string for a model name.
   * e.g. `'post'` → `'posts'`
   */
  payloadKeyFromModelName(modelName: string): string {
    return pluralize.plural(modelName);
  }

  /**
   * Returns the model name for a JSON:API `type` string.
   * e.g. `'posts'` → `'post'`
   */
  modelNameFromPayloadKey(key: string): string {
    return pluralize.singular(key);
  }

  /**
   * Normalizes a single JSON:API resource object into a `NormalizedResource`.
   * Returns `null` for absent, non-object, or type-less payloads.
   */
  override normalize(
    _store: unknown,
    _modelClass: ModelClassMeta,
    payload: unknown,
    _prop?: string,
  ): NormalizedResource | null {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return null;
    }
    const resource = payload as JsonApiResource;
    if (!resource.type) {
      return null;
    }
    const normalized: NormalizedResource = {
      type: this.modelNameFromPayloadKey(resource.type),
      id: resource.id === null || resource.id === undefined ? null : String(resource.id),
    };
    if (resource.attributes) {
      normalized.attributes = { ...resource.attributes };
    }
    if (resource.relationships) {
      const relationships: NonNullable<NormalizedResource['relationships']> = {};
      for (const [name, rel] of Object.entries(resource.relationships)) {
        if (rel.data === null) {
          relationships[name] = { data: null };
        } else if (Array.isArray(rel.data)) {
          relationships[name] = {
            data: rel.data.map((ref) => ({
              type: this.modelNameFromPayloadKey(ref.type),
              id: String(ref.id),
            })),
          };
        } else {
          relationships[name] = {
            data: {
              type: this.modelNameFromPayloadKey(rel.data.type),
              id: String(rel.data.id),
            },
          };
        }
      }
      normalized.relationships = relationships;
    }
    return normalized;
  }

  /**
   * Normalizes a full JSON:API compound document.
   *
   * - `data` (single or array) → primary resources
   * - `included` → side-loaded resources pushed to `normalizedDoc.included`
   * - `meta` and `links` → forwarded as-is
   */
  override normalizeResponse(
    store: unknown,
    modelClass: ModelClassMeta,
    payload: unknown,
    _id: string | null,
    _requestType: NormalizeRequestType,
  ): NormalizedDocument {
    if (!payload || typeof payload !== 'object') {
      return { data: null };
    }
    const doc = payload as {
      data?: JsonApiResource | JsonApiResource[] | null;
      included?: JsonApiResource[];
      meta?: Record<string, unknown>;
      links?: Record<string, string>;
    };

    let data: NormalizedResource | NormalizedResource[] | null = null;
    if (doc.data === null || doc.data === undefined) {
      data = null;
    } else if (Array.isArray(doc.data)) {
      data = doc.data
        .map((resource) => this.normalize(store, modelClass, resource))
        .filter((resource): resource is NormalizedResource => resource !== null);
    } else {
      data = this.normalize(store, modelClass, doc.data);
    }

    const normalizedDoc: NormalizedDocument = { data };
    if (doc.included && doc.included.length > 0) {
      const included: NormalizedResource[] = [];
      for (const resource of doc.included) {
        const placeholder: ModelClassMeta = {
          modelName: this.modelNameFromPayloadKey(resource.type),
          attributes: new Map(),
          relationships: new Map(),
        };
        const normalized = this.normalize(store, placeholder, resource);
        if (normalized) {
          included.push(normalized);
        }
      }
      normalizedDoc.included = included;
    }
    if (doc.meta) {
      normalizedDoc.meta = doc.meta;
    }
    if (doc.links) {
      normalizedDoc.links = doc.links;
    }
    return normalizedDoc;
  }

  /**
   * Serializes a record snapshot to a JSON:API `{ data: … }` document.
   *
   * Attributes are placed in `data.attributes`; relationships are placed in
   * `data.relationships` with proper `{ data: { type, id } }` structure.
   * `id` is included in `data` when `options.includeId` is `true`.
   */
  override serialize(
    snapshot: SerializerSnapshot,
    options?: { includeId?: boolean },
  ): Record<string, unknown> {
    const attributes: Record<string, unknown> = {};
    snapshot.eachAttribute((key) => {
      attributes[this.keyForAttribute(key)] = snapshot.attr(key);
    });

    const relationships: Record<string, { data: unknown }> = {};
    snapshot.eachRelationship((_key, rel) => {
      const { name } = rel;
      const payloadKey = this.keyForRelationship(name);
      const payloadType = this.payloadKeyFromModelName(rel.type);
      if (rel.kind === 'belongsTo') {
        const target = snapshot.belongsTo(name) as
          | { id: string; type?: string }
          | null
          | undefined;
        relationships[payloadKey] = target && target.id != null
          ? { data: { type: payloadType, id: String(target.id) } }
          : { data: null };
      } else {
        const targets = (snapshot.hasMany(name) as Array<{
          id: string; type?: string;
        }> | null) ?? [];
        relationships[payloadKey] = {
          data: targets.map((target) => ({
            type: payloadType,
            id: String(target.id),
          })),
        };
      }
    });

    const data: Record<string, unknown> = {
      type: this.payloadKeyFromModelName(snapshot.modelName),
      attributes,
    };
    if (options?.includeId && snapshot.id !== null) {
      data.id = snapshot.id;
    }
    if (Object.keys(relationships).length > 0) {
      data.relationships = relationships;
    }

    return { data };
  }
}
