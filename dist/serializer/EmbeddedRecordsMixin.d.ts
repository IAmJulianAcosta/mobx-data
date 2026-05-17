/**
 * Mixin that adds support for embedded (nested) records in REST payloads.
 *
 * Apply with:
 * ```ts
 * class PostSerializer extends EmbeddedRecordsMixin(RestSerializer) {
 *   attrs = {
 *     comments: { embedded: 'always' },
 *     author:   { embedded: 'always', serialize: 'records' },
 *   };
 * }
 * ```
 *
 * ## How it works
 *
 * ### Deserialization
 * When `embedded: 'always'` is set for a relationship, `normalize()` intercepts
 * the raw payload before passing it to `super.normalize()`:
 * - For `hasMany`: replaces the nested array with a plain id array and queues
 *   each nested object as an `included` resource.
 * - For `belongsTo`: replaces the nested object with the extracted id and
 *   queues the nested object as an `included` resource.
 *
 * Queued resources are collected during `normalizeResponse()` and appended to
 * `document.included` so the `Store` can push them into the identity map.
 *
 * ### Serialization
 * When `serialize: 'records'` is set, `serializeHasMany` / `serializeBelongsTo`
 * write the full related record(s) into the payload instead of just ids.
 *
 * ## Configuration
 *
 * Each entry in `attrs` is an `EmbeddedAttrConfig`:
 * - `embedded: 'always'` — enable embedded deserialization.
 * - `serialize: 'records'` — write full records on serialize.
 * - `serialize: 'ids'` — write id array on serialize (default).
 * - `serialize: false` — omit relationship from serialized payload.
 * - `deserialize: 'records'` — same as `embedded: 'always'`.
 * - `deserialize: false` — ignore this relationship during normalization.
 */
import type { RelationshipDef } from '@mobx-data/schema';
import type { ModelClassMeta, NormalizeRequestType, NormalizedDocument, NormalizedResource, SerializerSnapshot } from './Serializer.js';
/** Per-relationship embedding configuration. */
export interface EmbeddedAttrConfig {
    /** `'always'` to deserialize embedded records; `'never'` to skip. */
    embedded?: 'always' | 'never';
    /** `'records'` to serialize full objects; `'ids'` for ids only; `false` to omit. */
    serialize?: 'records' | 'ids' | false;
    /** `'records'` to deserialize embedded objects; `'ids'` for plain ids; `false` to skip. */
    deserialize?: 'records' | 'ids' | false;
}
/** Map of relationship name → embedding config. */
export interface EmbeddedRecordsAttrs {
    [key: string]: EmbeddedAttrConfig;
}
/**
 * The minimal serializer interface required by the mixin.
 * Any class extending `JsonSerializer` satisfies this.
 */
export interface JsonSerializerLike {
    attrs?: EmbeddedRecordsAttrs;
    primaryKey: string;
    normalize(store: unknown, modelClass: ModelClassMeta, payload: unknown, prop?: string): NormalizedResource | null;
    normalizeResponse(store: unknown, modelClass: ModelClassMeta, payload: unknown, id: string | null, requestType: NormalizeRequestType): NormalizedDocument;
    serialize(snapshot: SerializerSnapshot, options?: {
        includeId?: boolean;
    }): Record<string, unknown>;
    serializeHasMany(snapshot: SerializerSnapshot, json: Record<string, unknown>, relationship: RelationshipDef): void;
    serializeBelongsTo(snapshot: SerializerSnapshot, json: Record<string, unknown>, relationship: RelationshipDef): void;
    keyForAttribute(key: string): string;
    keyForRelationship(key: string): string;
}
type Constructor<T> = new (...args: any[]) => T;
/**
 * Returns a new class that extends `Base` with embedded-record support.
 * `Base` must be (or extend) `JsonSerializer`.
 */
export declare function EmbeddedRecordsMixin<TBase extends Constructor<JsonSerializerLike>>(Base: TBase): TBase;
export {};
//# sourceMappingURL=EmbeddedRecordsMixin.d.ts.map