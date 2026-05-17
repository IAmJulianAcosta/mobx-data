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
import { type ModelClassMeta, type NormalizeRequestType, type NormalizedDocument } from './Serializer.js';
import { JsonSerializer } from './JsonSerializer.js';
export declare class RestSerializer extends JsonSerializer {
    /**
     * Returns the plural payload key for a model name.
     * e.g. `'post'` → `'posts'`
     */
    payloadKeyFromModelName(modelName: string): string;
    /**
     * Returns the model name for a payload root key.
     * e.g. `'posts'` → `'post'`
     */
    modelNameFromPayloadKey(key: string): string;
    /**
     * Builds a `NormalizedDocument` from a root-key REST payload.
     *
     * - Looks for the model data under the singular or plural root key.
     * - Treats every other non-reserved key as a sideloaded type.
     * - Preserves `meta` and `links` from the root.
     */
    protected _buildDocument(store: unknown, modelClass: ModelClassMeta, payload: unknown, _id: string | null, _requestType: NormalizeRequestType): NormalizedDocument;
}
//# sourceMappingURL=RestSerializer.d.ts.map