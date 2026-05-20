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
import { Serializer, type ModelClassMeta, type NormalizeRequestType, type NormalizedDocument, type NormalizedResource, type SerializerSnapshot } from './Serializer.js';
export declare class JsonSerializer extends Serializer {
    static dispatchMethodName(requestType: NormalizeRequestType): keyof Serializer | null;
    /**
     * Normalizes a single flat JSON object into a `NormalizedResource`.
     * Returns `null` for absent or non-object payloads.
     */
    normalize(_store: unknown, modelClass: ModelClassMeta, payload: unknown, _prop?: string): NormalizedResource | null;
    /**
     * Entry point for normalization.
     *
     * Checks whether a subclass has overridden the relevant per-operation hook
     * (e.g. `normalizeFindRecordResponse`).  If so, calls it; otherwise falls
     * through to `_buildDocument`.
     */
    normalizeResponse(store: unknown, modelClass: ModelClassMeta, payload: unknown, id: string | null, requestType: NormalizeRequestType): NormalizedDocument;
    /**
     * Builds a `NormalizedDocument` from a raw payload.
     * Arrays are normalized item by item; plain objects are normalized as a
     * single resource.
     */
    protected _buildDocument(store: unknown, modelClass: ModelClassMeta, payload: unknown, _id: string | null, _requestType: NormalizeRequestType): NormalizedDocument;
    /**
     * Serializes a snapshot to a flat JSON object.
     * Includes `id` when `options.includeId` is `true`.
     */
    serialize(snapshot: SerializerSnapshot, options?: {
        includeId?: boolean;
    }): Record<string, unknown>;
}
//# sourceMappingURL=JsonSerializer.d.ts.map