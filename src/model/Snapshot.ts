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
import {
  ATTRIBUTES_META_KEY,
  RELATIONSHIPS_META_KEY,
  type AttributeDef,
  type RelationshipDef,
} from '@mobx-data/schema';
import type { Model, RelationshipRef } from './Model.js';

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

/**
 * Walks the prototype chain from root to leaf, merging own-metadata entries
 * so that subclass definitions override parent definitions.
 */
function walk<V>(proto: object | null, key: symbol): Map<string, V> {
  const chain: object[] = [];
  let current: object | null = proto;
  while (current && current !== Object.prototype) {
    chain.push(current);
    current = Object.getPrototypeOf(current);
  }
  const merged = new Map<string, V>();
  for (const entry of chain.reverse()) {
    const local = Reflect.getOwnMetadata(key, entry) as Map<string, V> | undefined;
    if (local) {
      for (const [name, meta] of local) {
        merged.set(name, meta);
      }
    }
  }
  return merged;
}

export class Snapshot<T extends Model = Model> {
  /** Server-assigned id at snapshot time, or `null` for new records. */
  readonly id: string | null;
  /** Client-generated identifier, always present. */
  readonly clientId: string;
  /** `modelName` of the snapshotted record. */
  readonly modelName: string;
  /** Reference to the live record (read-only from adapter/serializer code). */
  readonly record: T;

  private readonly _attributes: Record<string, unknown>;
  private readonly _relationships: Map<string, RelationshipRef>;
  private readonly _changedAttributes: Record<string, [unknown, unknown]>;
  private readonly _attributeDefinitions: Map<string, AttributeDef>;
  private readonly _relationshipDefinitions: Map<string, RelationshipDef>;

  constructor(record: T) {
    this.record = record;
    this.id = record.id;
    this.clientId = record._clientId;
    this.modelName = record.modelName;

    const internal = record as unknown as {
      _data: Record<string, unknown>;
      _relationships: Map<string, RelationshipRef>;
    };
    // Freeze a copy so later record mutations don't bleed in.
    this._attributes = { ...internal._data };
    this._relationships = new Map(internal._relationships);
    this._changedAttributes = record.changedAttributes();

    const proto = Object.getPrototypeOf(record) as object;
    this._attributeDefinitions = walk<AttributeDef>(proto, ATTRIBUTES_META_KEY);
    this._relationshipDefinitions = walk<RelationshipDef>(proto, RELATIONSHIPS_META_KEY);
  }

  /** Returns the snapshot-time value for an attribute key. */
  attr<K extends keyof T>(key: K): T[K] {
    return this._attributes[key as string] as T[K];
  }

  /**
   * Returns the `belongsTo` reference for `key`.
   * When `{ id: true }` is passed, returns only the id string; otherwise
   * returns a `BelongsToReference` `{ id, type }` object, or `null` when the
   * relationship is empty.
   */
  belongsTo(
    key: string,
    options?: { id: boolean },
  ): BelongsToReference | string | null {
    const relationship = this._relationships.get(key);
    if (!relationship || relationship.data === null) {
      return null;
    }
    const data = relationship.data as { id: string; type: string };
    if (options?.id) {
      return data.id;
    }
    return { id: data.id, type: data.type };
  }

  /**
   * Returns the `hasMany` references for `key`.
   * When `{ ids: true }` is passed, returns a plain string array of ids;
   * otherwise returns an array of `HasManyReference` objects.
   */
  hasMany(
    key: string,
    options?: { ids: boolean },
  ): HasManyReference[] | string[] {
    const relationship = this._relationships.get(key);
    if (!relationship || !Array.isArray(relationship.data)) {
      return [];
    }
    const list = relationship.data as Array<{ id: string; type: string }>;
    if (options?.ids) {
      return list.map((reference) => reference.id);
    }
    return list.map((reference) => ({ id: reference.id, type: reference.type }));
  }

  /**
   * Returns a `{ [key]: [original, current] }` map of attributes that
   * differ from the server-received values at snapshot time.
   */
  changedAttributes(): Record<string, [unknown, unknown]> {
    return { ...this._changedAttributes };
  }

  /** Iterates over every attribute definition, calling `callback` for each. */
  eachAttribute(callback: (key: string, meta: AttributeDef) => void): void {
    for (const [key, meta] of this._attributeDefinitions) {
      callback(key, meta);
    }
  }

  /** Iterates over every relationship definition, calling `callback` for each. */
  eachRelationship(callback: (key: string, meta: RelationshipDef) => void): void {
    for (const [key, meta] of this._relationshipDefinitions) {
      callback(key, meta);
    }
  }
}
