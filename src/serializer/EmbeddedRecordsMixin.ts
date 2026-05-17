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
import type {
  ModelClassMeta,
  NormalizeRequestType,
  NormalizedDocument,
  NormalizedResource,
  SerializerSnapshot,
} from './Serializer.js';

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
  normalize(
    store: unknown,
    modelClass: ModelClassMeta,
    payload: unknown,
    prop?: string,
  ): NormalizedResource | null;
  normalizeResponse(
    store: unknown,
    modelClass: ModelClassMeta,
    payload: unknown,
    id: string | null,
    requestType: NormalizeRequestType,
  ): NormalizedDocument;
  serialize(
    snapshot: SerializerSnapshot,
    options?: { includeId?: boolean },
  ): Record<string, unknown>;
  serializeHasMany(
    snapshot: SerializerSnapshot,
    json: Record<string, unknown>,
    relationship: RelationshipDef,
  ): void;
  serializeBelongsTo(
    snapshot: SerializerSnapshot,
    json: Record<string, unknown>,
    relationship: RelationshipDef,
  ): void;
  keyForAttribute(key: string): string;
  keyForRelationship(key: string): string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T> = new (...args: any[]) => T;

/**
 * Returns a new class that extends `Base` with embedded-record support.
 * `Base` must be (or extend) `JsonSerializer`.
 */
export function EmbeddedRecordsMixin<
  TBase extends Constructor<JsonSerializerLike>,
>(Base: TBase): TBase {
  class WithEmbeddedRecords extends Base {
    override attrs?: EmbeddedRecordsAttrs;

    /** Accumulates extracted embedded resources during a `normalizeResponse` call. */
    private pendingIncluded: NormalizedResource[] = [];

    /**
     * Intercepts raw payload hashes to extract embedded records.
     *
     * For each relationship configured with `embedded: 'always'`:
     * - Recursively normalizes the embedded object(s) and adds them to
     *   `pendingIncluded`.
     * - Replaces the embedded value in the hash with the extracted id(s) so
     *   `super.normalize` treats it as a plain id reference.
     */
    override normalize(
      store: unknown,
      modelClass: ModelClassMeta,
      payload: unknown,
      prop?: string,
    ): NormalizedResource | null {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return super.normalize(store, modelClass, payload, prop);
      }
      const src = payload as Record<string, unknown>;
      const attrs = this.attrs ?? {};
      const hash: Record<string, unknown> = { ...src };

      for (const [name, rel] of modelClass.relationships) {
        const cfg = attrs[name];
        if (!cfg || cfg.embedded !== 'always') {
          continue;
        }
        const raw = hash[name];
        if (raw === undefined || raw === null) {
          continue;
        }

        if (rel.kind === 'hasMany' && Array.isArray(raw)) {
          const ids: string[] = [];
          for (const item of raw) {
            const extracted = this.extractEmbeddedResource(store, rel, item);
            if (extracted && extracted.id !== null) {
              ids.push(extracted.id);
              this.pendingIncluded.push(extracted);
            }
          }
          hash[name] = ids;
        } else if (
          rel.kind === 'belongsTo'
          && typeof raw === 'object'
          && !Array.isArray(raw)
        ) {
          const extracted = this.extractEmbeddedResource(store, rel, raw);
          if (extracted && extracted.id !== null) {
            this.pendingIncluded.push(extracted);
            hash[name] = extracted.id;
          }
        }
      }

      return super.normalize(store, modelClass, hash, prop);
    }

    /**
     * Resets `pendingIncluded`, delegates to `super.normalizeResponse`, then
     * appends any extracted embedded resources to `document.included`.
     */
    override normalizeResponse(
      store: unknown,
      modelClass: ModelClassMeta,
      payload: unknown,
      id: string | null,
      requestType: NormalizeRequestType,
    ): NormalizedDocument {
      this.pendingIncluded = [];
      const doc = super.normalizeResponse(store, modelClass, payload, id, requestType);
      if (this.pendingIncluded.length > 0) {
        const included = doc.included ? [...doc.included] : [];
        included.push(...this.pendingIncluded);
        doc.included = included;
        this.pendingIncluded = [];
      }
      return doc;
    }

    /**
     * When `serialize: 'records'` is configured, writes the full related
     * record objects instead of just ids.
     */
    override serializeHasMany(
      snapshot: SerializerSnapshot,
      json: Record<string, unknown>,
      relationship: RelationshipDef,
    ): void {
      const cfg = this.attrs?.[relationship.name];
      if (cfg?.serialize === 'records') {
        const records = snapshot.hasMany(relationship.name) as unknown[];
        json[this.keyForRelationship(relationship.name)] = records ?? [];
        return;
      }
      super.serializeHasMany(snapshot, json, relationship);
    }

    /**
     * When `serialize: 'records'` is configured, writes the full related
     * record object instead of just the id.
     */
    override serializeBelongsTo(
      snapshot: SerializerSnapshot,
      json: Record<string, unknown>,
      relationship: RelationshipDef,
    ): void {
      const cfg = this.attrs?.[relationship.name];
      if (cfg?.serialize === 'records') {
        const record = snapshot.belongsTo(relationship.name);
        json[this.keyForRelationship(relationship.name)] = record ?? null;
        return;
      }
      super.serializeBelongsTo(snapshot, json, relationship);
    }

    /**
     * Normalizes a single embedded resource object using the related model's
     * type as a placeholder `ModelClassMeta`.
     */
    private extractEmbeddedResource(
      store: unknown,
      rel: RelationshipDef,
      item: unknown,
    ): NormalizedResource | null {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null;
      }
      const embeddedClass: ModelClassMeta = {
        modelName: rel.type,
        attributes: new Map(),
        relationships: new Map(),
      };
      return this.normalize(store, embeddedClass, item);
    }
  }
  return WithEmbeddedRecords as unknown as TBase;
}
