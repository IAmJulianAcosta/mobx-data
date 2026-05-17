/**
 * Abstract base class for all serializers.
 *
 * A serializer translates between the raw wire format returned by an adapter
 * and the normalized document format consumed by the `Store`.  It also
 * converts a record `Snapshot` back into a wire-format payload for create /
 * update requests.
 *
 * ## Normalization pipeline
 *
 * ```
 * raw payload
 *   → normalizeResponse()  (dispatches to the per-operation override)
 *     → normalizeFindRecordResponse() / normalizeQueryResponse() / …
 *       → normalize()       (normalizes a single resource hash)
 *         → extractId()
 *         → extractAttributes()
 *         → extractRelationships()
 * → NormalizedDocument
 * ```
 *
 * ## Serialization pipeline
 *
 * ```
 * Snapshot
 *   → serialize()
 *     → serializeAttribute()    (for each @attr)
 *     → serializeBelongsTo()    (for each @belongsTo)
 *     → serializeHasMany()      (for each @hasMany)
 * → wire payload object
 * ```
 *
 * Subclasses (`JsonSerializer`, `RestSerializer`, `JsonApiSerializer`) override
 * selected methods to handle their specific wire formats.
 */
import type { AttributeDef, RelationshipDef } from '@mobx-data/schema';
/** Union of all request types that trigger a normalization call. */
export type NormalizeRequestType = 'findRecord' | 'findAll' | 'findBelongsTo' | 'findHasMany' | 'findMany' | 'query' | 'queryRecord' | 'createRecord' | 'updateRecord' | 'deleteRecord';
/**
 * Normalized representation of a single server resource.
 * This is the internal format understood by the `Store`.
 */
export interface NormalizedResource {
    /** Model name. */
    type: string;
    /** Server-assigned id, or `null` for new records. */
    id: string | null;
    /** Flat attribute map keyed by property name. */
    attributes?: Record<string, unknown>;
    /**
     * Relationship references keyed by property name.
     * Each value contains `data` — a single `{ type, id }` or an array of them.
     */
    relationships?: Record<string, {
        data: {
            type: string;
            id: string;
        } | Array<{
            type: string;
            id: string;
        }> | null;
    }>;
}
/**
 * Top-level normalized document returned by `normalizeResponse`.
 * Mirrors the JSON:API document structure but is also used for REST payloads.
 */
export interface NormalizedDocument {
    /** Primary resource(s), or `null` for empty responses. */
    data: NormalizedResource | NormalizedResource[] | null;
    /** Side-loaded or compound-document secondary resources. */
    included?: NormalizedResource[];
    /** Server-side metadata (pagination, total counts, etc.). */
    meta?: Record<string, unknown>;
    /** Pagination or related links. */
    links?: Record<string, string>;
}
/**
 * Snapshot-like interface consumed by `serialize` and the `serialize*` helpers.
 * Serializers only read from snapshots; they never mutate records.
 */
export interface SerializerSnapshot {
    /** Server-assigned id, or `null` for new records. */
    id: string | null;
    /** Model name. */
    modelName: string;
    /** Returns the snapshot-time value for an attribute key. */
    attr(key: string): unknown;
    /** Returns the `belongsTo` reference (or just the id when `{ id: true }`). */
    belongsTo(key: string, options?: {
        id: boolean;
    }): unknown;
    /** Returns the `hasMany` references (or just ids when `{ ids: true }`). */
    hasMany(key: string, options?: {
        ids: boolean;
    }): unknown;
    /** Returns `{ [key]: [original, current] }` pairs for dirty attributes. */
    changedAttributes(): Record<string, [unknown, unknown]>;
    /** Iterates over all attribute definitions. */
    eachAttribute(fn: (key: string, meta: AttributeDef) => void): void;
    /** Iterates over all relationship definitions. */
    eachRelationship(fn: (key: string, meta: RelationshipDef) => void): void;
    /** Live record reference (treated as read-only in serializer context). */
    record: unknown;
}
/** Minimal model class descriptor passed to serializer methods. */
export interface ModelClassMeta {
    /** Registered model name. */
    modelName: string;
    /** Merged attribute definitions. */
    attributes: Map<string, AttributeDef>;
    /** Merged relationship definitions. */
    relationships: Map<string, RelationshipDef>;
}
export declare abstract class Serializer {
    /** Name of the field used as the primary key in raw payloads.  Default: `'id'`. */
    primaryKey: string;
    /**
     * Normalizes a single raw resource hash into a `NormalizedResource`.
     * Returns `null` for absent or non-object payloads.
     */
    abstract normalize(store: unknown, modelClass: ModelClassMeta, payload: unknown, prop?: string): NormalizedResource | null;
    /**
     * Entry point for normalization.  Dispatches to the appropriate
     * `normalize*Response` method based on `requestType`, then builds the full
     * `NormalizedDocument`.
     */
    abstract normalizeResponse(store: unknown, modelClass: ModelClassMeta, payload: unknown, id: string | null, requestType: NormalizeRequestType): NormalizedDocument;
    /**
     * Serializes a record snapshot into a plain object suitable for a create
     * or update request body.
     */
    abstract serialize(snapshot: SerializerSnapshot, options?: {
        includeId?: boolean;
    }): Record<string, unknown>;
    /** Called when normalizing a `findRecord` response. */
    normalizeFindRecordResponse(store: unknown, modelClass: ModelClassMeta, payload: unknown, id: string | null, requestType: NormalizeRequestType): NormalizedDocument;
    /** Called when normalizing a `findAll` response. */
    normalizeFindAllResponse(store: unknown, modelClass: ModelClassMeta, payload: unknown, id: string | null, requestType: NormalizeRequestType): NormalizedDocument;
    /** Called when normalizing a `query` response. */
    normalizeQueryResponse(store: unknown, modelClass: ModelClassMeta, payload: unknown, id: string | null, requestType: NormalizeRequestType): NormalizedDocument;
    /** Called when normalizing a `queryRecord` response. */
    normalizeQueryRecordResponse(store: unknown, modelClass: ModelClassMeta, payload: unknown, id: string | null, requestType: NormalizeRequestType): NormalizedDocument;
    /** Called when normalizing a `createRecord` response. */
    normalizeCreateRecordResponse(store: unknown, modelClass: ModelClassMeta, payload: unknown, id: string | null, requestType: NormalizeRequestType): NormalizedDocument;
    /** Called when normalizing an `updateRecord` response. */
    normalizeUpdateRecordResponse(store: unknown, modelClass: ModelClassMeta, payload: unknown, id: string | null, requestType: NormalizeRequestType): NormalizedDocument;
    /** Called when normalizing a `deleteRecord` response. */
    normalizeDeleteRecordResponse(store: unknown, modelClass: ModelClassMeta, payload: unknown, id: string | null, requestType: NormalizeRequestType): NormalizedDocument;
    /**
     * Writes a single attribute value into `json`.
     * Default: writes `snapshot.attr(key)` under the key returned by `keyForAttribute`.
     */
    serializeAttribute(snapshot: SerializerSnapshot, json: Record<string, unknown>, key: string, _attribute: AttributeDef): void;
    /**
     * Writes a `belongsTo` relationship id into `json`.
     * Default: writes the related record's id (or `null`) under `keyForRelationship`.
     */
    serializeBelongsTo(snapshot: SerializerSnapshot, json: Record<string, unknown>, relationship: RelationshipDef): void;
    /**
     * Writes a `hasMany` relationship id array into `json`.
     * Default: writes the array of related ids under `keyForRelationship`.
     */
    serializeHasMany(snapshot: SerializerSnapshot, json: Record<string, unknown>, relationship: RelationshipDef): void;
    /**
     * Extracts attribute values from a raw resource hash.
     * Returns a map of `{ propertyName: value }` using `keyForAttribute` to
     * locate the payload key.
     */
    extractAttributes(modelClass: ModelClassMeta, resourceHash: Record<string, unknown>): Record<string, unknown>;
    /**
     * Extracts relationship references from a raw resource hash.
     *
     * - `belongsTo`: raw id (string or number) → `{ data: { type, id } }`
     * - `hasMany`: array of raw ids → `{ data: [{ type, id }, …] }`
     *
     * Returns only the relationships whose payload keys are present in `resourceHash`.
     */
    extractRelationships(modelClass: ModelClassMeta, resourceHash: Record<string, unknown>): NormalizedResource['relationships'];
    /**
     * Extracts the primary key from a raw resource hash.
     * Returns `null` when the key is absent.
     */
    extractId(_modelClass: ModelClassMeta, resourceHash: Record<string, unknown>): string | null;
    /**
     * Extracts field-level validation errors from a server error payload.
     * Default: looks for `{ errors: { field: string | string[] } }`.
     * Returns an empty object when no recognisable error structure is found.
     */
    extractErrors(_store: unknown, _modelClass: ModelClassMeta, payload: unknown, _id: string | null): Record<string, string[]>;
    /**
     * Maps a camelCase property name to the payload key used by this format.
     * Default: identity (no transformation).
     */
    keyForAttribute(key: string): string;
    /**
     * Maps a camelCase relationship name to the payload key used by this format.
     * Default: identity (no transformation).
     */
    keyForRelationship(key: string): string;
}
//# sourceMappingURL=Serializer.d.ts.map