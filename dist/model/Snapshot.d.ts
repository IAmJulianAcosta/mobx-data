/**
 * Immutable point-in-time view of a model record.
 *
 * A `Snapshot` is created immediately before an adapter call so that adapter
 * and serializer code reads a consistent, frozen picture of the record
 * regardless of mutations that happen after the call begins.
 *
 * Key guarantees:
 * - Attribute data is copied at construction time; later record mutations do
 *   not bleed into the snapshot.
 * - Relationship data is captured via a `Map` copy for the same reason.
 * - `changedAttributes()` compares the snapshot-time data against the
 *   record's original (server-received) data, not the current live state.
 * - `eachAttribute` / `eachRelationship` iterate the merged schema definitions
 *   walked at construction from the prototype chain.
 */
import 'reflect-metadata';
import { type AttributeDef, type RelationshipDef } from '@mobx-data/schema';
import type { Model } from './Model.js';
/** Shape of a serialised `belongsTo` reference as stored in a snapshot. */
export interface BelongsToReference {
    id: string | null;
    type: string;
}
/** Shape of a serialised `hasMany` item reference as stored in a snapshot. */
export interface HasManyReference {
    id: string;
    type: string;
}
export declare class Snapshot<T extends Model = Model> {
    /** Server-assigned id at snapshot time, or `null` for new records. */
    readonly id: string | null;
    /** Client-generated identifier, always present. */
    readonly clientId: string;
    /** `modelName` of the snapshotted record. */
    readonly modelName: string;
    /** Reference to the live record (read-only from adapter/serializer code). */
    readonly record: T;
    private readonly _attributes;
    private readonly _relationships;
    private readonly _changedAttributes;
    private readonly _attributeDefinitions;
    private readonly _relationshipDefinitions;
    constructor(record: T);
    /** Returns the snapshot-time value for an attribute key. */
    attr<K extends keyof T>(key: K): T[K];
    /**
     * Returns the `belongsTo` reference for `key`.
     * When `{ id: true }` is passed, returns only the id string; otherwise
     * returns a `BelongsToReference` `{ id, type }` object, or `null` when the
     * relationship is empty.
     */
    belongsTo(key: string, options?: {
        id: boolean;
    }): BelongsToReference | string | null;
    /**
     * Returns the `hasMany` references for `key`.
     * When `{ ids: true }` is passed, returns a plain string array of ids;
     * otherwise returns an array of `HasManyReference` objects.
     */
    hasMany(key: string, options?: {
        ids: boolean;
    }): HasManyReference[] | string[];
    /**
     * Returns a `{ [key]: [original, current] }` map of attributes that
     * differ from the server-received values at snapshot time.
     */
    changedAttributes(): Record<string, [unknown, unknown]>;
    /** Iterates over every attribute definition, calling `callback` for each. */
    eachAttribute(callback: (key: string, meta: AttributeDef) => void): void;
    /** Iterates over every relationship definition, calling `callback` for each. */
    eachRelationship(callback: (key: string, meta: RelationshipDef) => void): void;
}
//# sourceMappingURL=Snapshot.d.ts.map