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
import { Serializer, type ModelClassMeta, type NormalizeRequestType, type NormalizedDocument, type NormalizedResource, type SerializerSnapshot } from '@mobx-data/serializer';
export declare class JsonApiSerializer extends Serializer {
    /**
     * Returns the plural JSON:API `type` string for a model name.
     * e.g. `'post'` → `'posts'`
     */
    payloadKeyFromModelName(modelName: string): string;
    /**
     * Returns the model name for a JSON:API `type` string.
     * e.g. `'posts'` → `'post'`
     */
    modelNameFromPayloadKey(key: string): string;
    /**
     * Normalizes a single JSON:API resource object into a `NormalizedResource`.
     * Returns `null` for absent, non-object, or type-less payloads.
     */
    normalize(_store: unknown, _modelClass: ModelClassMeta, payload: unknown, _prop?: string): NormalizedResource | null;
    /**
     * Normalizes a full JSON:API compound document.
     *
     * - `data` (single or array) → primary resources
     * - `included` → side-loaded resources pushed to `normalizedDoc.included`
     * - `meta` and `links` → forwarded as-is
     */
    normalizeResponse(store: unknown, modelClass: ModelClassMeta, payload: unknown, _id: string | null, _requestType: NormalizeRequestType): NormalizedDocument;
    /**
     * Serializes a record snapshot to a JSON:API `{ data: … }` document.
     *
     * Attributes are placed in `data.attributes`; relationships are placed in
     * `data.relationships` with proper `{ data: { type, id } }` structure.
     * `id` is included in `data` when `options.includeId` is `true`.
     */
    serialize(snapshot: SerializerSnapshot, options?: {
        includeId?: boolean;
    }): Record<string, unknown>;
}
//# sourceMappingURL=JsonApiSerializer.d.ts.map