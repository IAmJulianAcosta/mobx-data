/**
 * REST serializer for root-key payloads with optional sideloading.
 *
 * `RestSerializer` expects the primary data to be wrapped under a root key
 * that matches either the singular or plural model name:
 *
 * ```json
 * { "post": { "id": "1", "title": "Hello" } }
 * { "posts": [{ "id": "1", … }, { "id": "2", … }] }
 * ```
 *
 * Any additional keys in the payload are treated as sideloaded (compound)
 * data.  `meta` and `links` keys are reserved and forwarded to the document.
 *
 * Sideloaded types are inferred from the payload key via `modelNameFromPayloadKey`
 * (default: singularization).
 *
 * Extends `JsonSerializer` so it inherits flat `normalize` and `serialize`
 * behaviour and only overrides document-level parsing via `_buildDocument`.
 */

import { injectable } from 'tsyringe';
import pluralize from 'pluralize';
import {
  resolveModelClassMeta,
  type ModelClassMeta,
  type NormalizeRequestType,
  type NormalizedDocument,
  type NormalizedResource,
} from './Serializer.js';
import { JsonSerializer } from './JsonSerializer.js';

@injectable()
export class RestSerializer extends JsonSerializer {
  /**
   * Returns the plural payload key for a model name.
   * e.g. `'post'` → `'posts'`
   */
  payloadKeyFromModelName(modelName: string): string {
    return pluralize.plural(modelName);
  }

  /**
   * Returns the model name for a payload root key.
   * e.g. `'posts'` → `'post'`
   */
  modelNameFromPayloadKey(key: string): string {
    return pluralize.singular(key);
  }

  /**
   * Builds a `NormalizedDocument` from a root-key REST payload.
   *
   * - Looks for the model data under the singular or plural root key.
   * - Treats every other non-reserved key as a sideloaded type.
   * - Preserves `meta` and `links` from the root.
   */
  protected override _buildDocument(
    store: unknown,
    modelClass: ModelClassMeta,
    payload: unknown,
    _id: string | null,
    _requestType: NormalizeRequestType,
  ): NormalizedDocument {
    if (payload === null || payload === undefined || typeof payload !== 'object') {
      return { data: null };
    }
    const hash = payload as Record<string, unknown>;
    const singular = modelClass.modelName;
    const plural = this.payloadKeyFromModelName(singular);

    let data: NormalizedResource | NormalizedResource[] | null = null;
    const primaryKeys = new Set<string>();

    if (singular in hash) {
      primaryKeys.add(singular);
      const raw = hash[singular];
      if (Array.isArray(raw)) {
        data = raw
          .map((entry) => this.normalize(store, modelClass, entry))
          .filter((resource): resource is NormalizedResource => resource !== null);
      } else {
        data = this.normalize(store, modelClass, raw);
      }
    } else if (plural in hash) {
      primaryKeys.add(plural);
      const raw = hash[plural];
      if (Array.isArray(raw)) {
        data = raw
          .map((entry) => this.normalize(store, modelClass, entry))
          .filter((resource): resource is NormalizedResource => resource !== null);
      } else {
        data = this.normalize(store, modelClass, raw);
      }
    }

    // Collect sideloaded records from all remaining root keys.
    const included: NormalizedResource[] = [];
    for (const [key, value] of Object.entries(hash)) {
      if (primaryKeys.has(key)) {
        continue;
      }
      if (key === 'meta' || key === 'links') {
        continue;
      }
      const sideloadType = this.modelNameFromPayloadKey(key);
      const sideloadClass = resolveModelClassMeta(store, sideloadType);
      if (Array.isArray(value)) {
        for (const item of value) {
          const normalized = this.normalize(store, sideloadClass, item);
          if (normalized) {
            included.push(normalized);
          }
        }
      } else if (value && typeof value === 'object') {
        const normalized = this.normalize(store, sideloadClass, value);
        if (normalized) {
          included.push(normalized);
        }
      }
    }

    const doc: NormalizedDocument = { data };
    if (included.length > 0) {
      doc.included = included;
    }
    if (hash.meta && typeof hash.meta === 'object') {
      doc.meta = hash.meta as Record<string, unknown>;
    }
    if (hash.links && typeof hash.links === 'object') {
      doc.links = hash.links as Record<string, string>;
    }
    return doc;
  }
}
