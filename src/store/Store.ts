/**
 * Central store — the top-level coordinator for the mobx-data runtime.
 *
 * `Store` orchestrates every aspect of the data layer:
 *
 * - **Identity Map** — a two-level `IdentityMap` keyed by `modelName → id`.
 *   Records are merged in-place on repeated `push` calls so live references
 *   always reflect the latest server state.
 *
 * - **Finding records** — `findRecord`, `findAll`, `query`, `queryRecord`
 *   delegate to the registered adapter, then pass the raw response through the
 *   registered serializer before pushing normalized data into the identity map.
 *
 * - **Saving records** — `saveRecord` calls `adapter.createRecord` or
 *   `adapter.updateRecord` depending on `record.isNew`, then applies the
 *   server response back onto the record via `_applyServerData`.
 *
 * - **Relationships** — `resolveRelationship` returns sync (`ManyArray`) or
 *   async (`AsyncBelongsTo` / `AsyncHasMany`) proxy objects backed by the
 *   store.  `setRelationshipValue` updates `belongsTo` refs and keeps their
 *   inverses in sync.  `_hasManyAppend` / `_hasManyRemove` manage `hasMany`
 *   refs and their inverses.
 *
 * - **Inverse tracking** — `addInverse` / `removeInverse` keep both sides of
 *   a declared `inverse` relationship consistent when either side is mutated.
 *
 * ## Registration
 *
 * ```ts
 * store.registerAdapter('application', new RestAdapter());
 * store.registerSerializer('application', new JsonSerializer());
 * ```
 *
 * Adapters and serializers are looked up first by exact model name, then by
 * the special `'application'` fallback.
 */

import {
  singleton, inject, injectable,
} from 'tsyringe';
import {
  runInAction, observable, computed, makeObservable,
} from 'mobx';
import {
  SchemaService,
  type RelationshipDef,
  type AttributeDef,
} from '@mobx-data/schema';
import {
  Model,
  ManyArray,
  AsyncBelongsTo,
  AsyncHasMany,
  type RelationshipRef,
  type ModelStoreLike,
  type SaveOptions,
} from '@mobx-data/model';
import type { CacheLike } from '../cache/types.js';
import {
  extractResponseHeaders,
  parseCacheTTLFromHeaders,
} from '../cache/cache-utils.js';
import { IdentityMap } from './IdentityMap.js';
import {
  RecordArray,
  AdapterPopulatedRecordArray,
} from './RecordArray.js';
import { MdqlQueryBuilder } from '../mdql/MdqlQueryBuilder.js';

/** Options forwarded from the Store to adapter fetch methods. */
export interface AdapterFetchOptions {
  include?: string;
  adapterOptions?: Record<string, unknown>;
}

/** Minimal adapter interface the Store depends on. */
export interface AdapterLike {
  findRecord(
    store: Store,
    modelName: string,
    id: string,
    snapshot: unknown,
    options?: AdapterFetchOptions,
  ): Promise<unknown>;
  findAll(
    store: Store,
    modelName: string,
    sinceToken: string | null,
    snapshotArray: unknown,
    options?: AdapterFetchOptions,
  ): Promise<unknown>;
  findMany?(
    store: Store,
    modelName: string,
    ids: string[],
    snapshots: unknown,
  ): Promise<unknown>;
  query(
    store: Store,
    modelName: string,
    query: Record<string, unknown>,
    recordArray: AdapterPopulatedRecordArray,
  ): Promise<unknown>;
  queryRecord(
    store: Store,
    modelName: string,
    query: Record<string, unknown>,
  ): Promise<unknown>;
  createRecord(
    store: Store,
    modelName: string,
    snapshot: unknown,
  ): Promise<unknown>;
  updateRecord(
    store: Store,
    modelName: string,
    snapshot: unknown,
  ): Promise<unknown>;
  patchRecord?(
    store: Store,
    modelName: string,
    snapshot: unknown,
  ): Promise<unknown>;
  deleteRecord(
    store: Store,
    modelName: string,
    snapshot: unknown,
  ): Promise<unknown>;
  /** When `true` the store coalesces multiple `findRecord` calls into one `findMany`. */
  coalesceFindRequests?: boolean;
}

/** Minimal serializer interface the Store depends on. */
export interface SerializerLike {
  normalize(
    store: Store,
    modelClass: unknown,
    payload: unknown,
    prop?: string,
  ): unknown;
  normalizeResponse(
    store: Store,
    modelClass: unknown,
    payload: unknown,
    id: string | null,
    requestType: string,
  ): unknown;
  serialize(snapshot: unknown, options?: Record<string, unknown>): unknown;
  extractErrors?(
    store: Store,
    modelClass: unknown,
    payload: unknown,
    id: string | null,
  ): Record<string, string[]>;
}

/** Options for `findRecord` and `findAll`. */
export interface FindOptions {
  /** When `true`, bypass the cache and always hit the network. */
  reload?: boolean;
  /** When `true`, return the cached value and refetch in the background. */
  backgroundReload?: boolean;
  /** Adapter-specific options forwarded to the adapter method. */
  adapterOptions?: Record<string, unknown>;
  /** Comma-separated relationship paths to include (e.g. `'author,comments'`). */
  include?: string;
}

/** Normalized resource shape consumed internally by the store. */
export interface NormalizedResource {
  type: string;
  id: string | null;
  attributes?: Record<string, unknown>;
  relationships?: Record<string, RelationshipRef>;
}

/** Normalized document containing primary data and optional side-loaded records. */
export interface NormalizedDocument {
  data: NormalizedResource | NormalizedResource[] | null;
  included?: NormalizedResource[];
  meta?: Record<string, unknown>;
  links?: Record<string, string>;
}

/** Internal snapshot interface created and consumed by the store. */
interface Snapshot {
  id: string | null;
  clientId: string;
  modelName: string;
  record: Model;
  attr(key: string): unknown;
  belongsTo(key: string, options?: { id?: boolean }): unknown;
  hasMany(key: string, options?: { ids?: boolean }): unknown;
  changedAttributes(): Record<string, [unknown, unknown]>;
  eachAttribute(fn: (key: string, meta: AttributeDef) => void): void;
  eachRelationship(fn: (key: string, meta: RelationshipDef) => void): void;
}

@singleton()
@injectable()
export class Store implements ModelStoreLike {
  static refEquals(
    a: { type: string; id: string },
    b: { type: string; id: string },
  ): boolean {
    return a.id === b.id && a.type === b.type;
  }

  /** Schema registry used to look up model classes and their metadata. */
  readonly schema: SchemaService;

  /** Two-level identity map: `modelName → id → record`. */
  readonly identityMap: IdentityMap = new IdentityMap();

  private adapters: Map<string, AdapterLike> = new Map();

  private serializers: Map<string, SerializerLike> = new Map();

  /** Tracks unsaved (new) records by model name. */
  private newRecords: Map<string, Set<Model>> = new Map();

  /** Reverse index: record → modelName for O(1) untrackNewRecord. */
  private newRecordTypes: WeakMap<Model, string> = new WeakMap();

  /** Per-record cache of relationship proxy objects (ManyArray / AsyncBelongsTo / AsyncHasMany). */
  private relationshipCache: WeakMap<
  Model,
  Map<string, ManyArray | AsyncBelongsTo | AsyncHasMany>
  > = new WeakMap();

  /** Tracks new records that have been appended to a hasMany but not yet saved. */
  private pendingMembers: WeakMap<Model, Map<string, Set<Model>>> = new WeakMap();

  /** Optional persistent cache layer (e.g. IndexedDB). */
  private _cache: CacheLike | null = null;

  constructor(@inject(SchemaService) schema: SchemaService) {
    this.schema = schema;
  }

  // --- registration ---

  /** Registers an adapter for a given model name (or `'application'` as a fallback). */
  registerAdapter(modelName: string, adapter: AdapterLike): void {
    this.adapters.set(modelName, adapter);
  }

  /** Registers a serializer for a given model name (or `'application'` as a fallback). */
  registerSerializer(modelName: string, serializer: SerializerLike): void {
    this.serializers.set(modelName, serializer);
  }

  /** Registers a persistent cache layer (e.g. IndexedDB) for offline-first reads. */
  registerCache(cache: CacheLike): void {
    this._cache = cache;
  }

  /**
   * Returns the adapter for `modelName`, falling back to `'application'`.
   * @throws when no adapter is registered.
   */
  adapterFor(modelName: string): AdapterLike {
    const adapter = this.adapters.get(modelName) ?? this.adapters.get('application');
    if (!adapter) {
      throw new Error(`No adapter registered for "${modelName}"`);
    }
    return adapter;
  }

  /**
   * Returns the serializer for `modelName`, falling back to `'application'`.
   * @throws when no serializer is registered.
   */
  serializerFor(modelName: string): SerializerLike {
    const serializer = this.serializers.get(modelName)
      ?? this.serializers.get('application');
    if (!serializer) {
      throw new Error(`No serializer registered for "${modelName}"`);
    }
    return serializer;
  }

  // --- creating ---

  /**
   * Creates a new (unsaved) record of the given type with optional initial data.
   * The record is tracked in `newRecords` until it is saved or rolled back.
   *
   * @throws when `modelName` has not been registered with `SchemaService`.
   */
  createRecord<T extends Model = Model>(
    modelName: string,
    data: Record<string, unknown> = {},
  ): T {
    if (!this.schema.doesTypeExist(modelName)) {
      throw new Error(`Unknown model type: "${modelName}"`);
    }
    const Klass = this.schema.modelFor(modelName) as unknown as new (
      opts: { id: null; data: Record<string, unknown>; store: Store },
    ) => Model;
    const record = new Klass({ id: null, data, store: this });
    this.trackNewRecord(modelName, record);
    return record as T;
  }

  private trackNewRecord(modelName: string, record: Model): void {
    let set = this.newRecords.get(modelName);
    if (!set) {
      set = new Set();
      this.newRecords.set(modelName, set);
    }
    set.add(record);
    this.newRecordTypes.set(record, modelName);
  }

  private untrackNewRecord(record: Model): void {
    const modelName = this.newRecordTypes.get(record);
    if (modelName) {
      this.newRecords.get(modelName)?.delete(record);
      this.newRecordTypes.delete(record);
    }
  }

  // --- peeking ---

  /**
   * Synchronously returns a record from the identity map, or `null` when not
   * found.  Does not trigger a network request.
   */
  peekRecord<T extends Model = Model>(modelName: string, id: string): T | null {
    const key = id === null || id === undefined ? null : String(id);
    if (key === null) {
      return null;
    }
    const direct = this.identityMap.get(modelName, key) as T | null;
    if (direct) { return direct; }

    const root = this.schema.polymorphicRootFor(modelName);
    if (root) {
      const record = this.identityMap.get(root, key);
      if (record && record instanceof (this.schema.modelFor(modelName) as unknown as abstract new (...args: never[]) => Model)) {
        return record as T;
      }
    }
    return null;
  }

  /**
   * Returns a live `RecordArray` backed by the identity map for `modelName`.
   * New (unsaved) records are included at the end.
   * Does not trigger a network request.
   */
  peekAll<T extends Model = Model>(modelName: string): RecordArray<T> {
    return new RecordArray<T>({
      modelName,
      source: () => {
        const persisted = this.identityMap.all(modelName) as T[];
        const newRecordsForType = this.newRecords.get(modelName);
        if (!newRecordsForType || newRecordsForType.size === 0) {
          return persisted;
        }
        return [...persisted, ...(newRecordsForType as unknown as Set<T>)];
      },
    });
  }

  // --- push / normalize ---

  /**
   * Pushes a normalized document into the identity map.
   * Side-loaded (`included`) records are pushed first.
   *
   * @returns The primary record(s), or `null` for empty payloads.
   */
  push(doc: unknown): Model | Model[] | null {
    const document = doc as NormalizedDocument;
    if (document.included) {
      for (const resource of document.included) {
        this.pushResource(resource);
      }
    }
    if (document.data === null || document.data === undefined) {
      return null;
    }
    if (Array.isArray(document.data)) {
      return document.data.map((resource) => this.pushResource(resource));
    }
    return this.pushResource(document.data);
  }

  /**
   * Normalizes a raw payload via the registered serializer and pushes the
   * result.  `modelName` is optional; when omitted the payload is pushed
   * directly without normalization.
   */
  pushPayload(modelNameOrPayload: string | unknown, payload?: unknown): void {
    let modelName: string | null;
    let body: unknown;
    if (typeof modelNameOrPayload === 'string') {
      modelName = modelNameOrPayload;
      body = payload;
    } else {
      modelName = null;
      body = modelNameOrPayload;
    }
    const normalized = modelName
      ? this.serializerFor(modelName).normalizeResponse(
        this,
        this.schema.modelFor(modelName),
        body,
        null,
        'pushPayload',
      )
      : body;
    this.push(normalized);
  }

  /**
   * Normalizes a raw payload for `modelName` via the registered serializer
   * and returns the `NormalizedDocument` without pushing it.
   */
  normalize(modelName: string, payload: unknown): NormalizedDocument {
    return this.serializerFor(modelName).normalizeResponse(
      this,
      this.schema.modelFor(modelName),
      payload,
      null,
      'normalize',
    ) as NormalizedDocument;
  }

  /**
   * Inserts or merges a single normalized resource into the identity map.
   * - Existing record → calls `_applyServerData` to merge attributes and
   *   relationships in place (preserving the live reference).
   * - New record → instantiates via `Model.push` and sets it in the map.
   *
   * @throws when `type` has not been registered or `id` is `null`.
   */
  private pushResource(resource: NormalizedResource): Model {
    const { type, id } = resource;
    if (!this.schema.doesTypeExist(type)) {
      throw new Error(`Unknown model type: "${type}"`);
    }
    if (id === null) {
      throw new Error(`Cannot push a resource of type "${type}" without an id`);
    }

    let bucketType = type;
    let modelClass = this.schema.modelFor(type);

    const resolved = this.schema.resolveConcreteModel(
      type,
      resource.attributes ?? {},
    );
    if (resolved) {
      modelClass = resolved.modelClass;
      bucketType = type;
    }

    const polymorphicRoot = this.schema.polymorphicRootFor(type);
    if (polymorphicRoot) {
      bucketType = polymorphicRoot;
    }

    const existing = this.identityMap.get(bucketType, id);
    if (existing) {
      runInAction(() => {
        (existing as unknown as {
          _applyServerData(
            id: string | null,
            data: Record<string, unknown>,
            relationships?: Record<string, RelationshipRef>,
          ): void;
        })._applyServerData(null, resource.attributes ?? {}, resource.relationships);
      });
      this.trackInverseForResource(existing, resource);
      return existing;
    }
    const Klass = modelClass as unknown as new (
      opts: {
        id: string;
        data: Record<string, unknown>;
        relationships?: Record<string, RelationshipRef>;
        store: Store;
      },
    ) => Model;
    const record = Model.push.call(Klass as unknown as typeof Model, {
      id,
      data: resource.attributes ?? {},
      relationships: resource.relationships,
      store: this,
    }) as Model;
    this.identityMap.set(bucketType, id, record);
    this.trackInverseForResource(record, resource);
    return record;
  }

  /**
   * After pushing a resource, updates the inverse side of every declared
   * inverse relationship so both sides stay consistent.
   */
  private trackInverseForResource(record: Model, resource: NormalizedResource): void {
    if (!resource.relationships) {
      return;
    }
    for (const [name, ref] of Object.entries(resource.relationships)) {
      const meta = this.schema.relationshipsDefinitionFor(record.modelName).get(name);
      if (!meta) {
        continue;
      }
      if (!meta.options.inverse) {
        continue;
      }
      if (!ref.data) {
        continue;
      }
      const items = Array.isArray(ref.data) ? ref.data : [ref.data];
      for (const item of items) {
        this.addInverse(item.type, item.id, meta.options.inverse, record);
      }
    }
  }

  /**
   * Adds `inverseRecord` to the inverse relationship on `targetType:targetId`.
   * No-ops when the target record is not in the identity map.
   */
  private addInverse(
    targetType: string,
    targetId: string,
    inverseName: string,
    inverseRecord: Model,
  ): void {
    const target = this.identityMap.get(targetType, targetId);
    if (!target) {
      return;
    }
    const targetRelationships = this.schema.relationshipsDefinitionFor(targetType);
    const inverseMeta = targetRelationships.get(inverseName);
    if (!inverseMeta) {
      return;
    }
    const existing = (target as unknown as {
      _getRelationshipRef(name: string): RelationshipRef | null;
    })._getRelationshipRef(inverseName);
    const inverseEntry = { type: inverseRecord.modelName, id: inverseRecord.id! };
    runInAction(() => {
      if (inverseMeta.kind === 'hasMany') {
        const currentData = existing?.data && Array.isArray(existing.data)
          ? existing.data : [];
        if (!currentData.some((reference) => Store.refEquals(reference, inverseEntry))) {
          (target as unknown as {
            _setRelationshipRef(name: string, ref: RelationshipRef): void;
          })._setRelationshipRef(inverseName, { data: [...currentData, inverseEntry] });
        }
      } else {
        (target as unknown as {
          _setRelationshipRef(name: string, ref: RelationshipRef): void;
        })._setRelationshipRef(inverseName, { data: inverseEntry });
      }
    });
  }

  /**
   * Removes `inverseRecord` from the inverse relationship on `targetType:targetId`.
   * No-ops when the target record is not in the identity map.
   */
  private removeInverse(
    targetType: string,
    targetId: string,
    inverseName: string,
    inverseRecord: Model,
  ): void {
    const target = this.identityMap.get(targetType, targetId);
    if (!target) {
      return;
    }
    const targetRelationships = this.schema.relationshipsDefinitionFor(targetType);
    const inverseMeta = targetRelationships.get(inverseName);
    if (!inverseMeta) {
      return;
    }
    const existing = (target as unknown as {
      _getRelationshipRef(name: string): RelationshipRef | null;
    })._getRelationshipRef(inverseName);
    runInAction(() => {
      if (inverseMeta.kind === 'hasMany') {
        const currentData = existing?.data && Array.isArray(existing.data)
          ? existing.data : [];
        const items = currentData.filter((reference) => !(
          reference.id === inverseRecord.id
          && reference.type === inverseRecord.modelName
        ));
        (target as unknown as {
          _setRelationshipRef(name: string, ref: RelationshipRef): void;
        })._setRelationshipRef(inverseName, { data: items });
      } else {
        (target as unknown as {
          _setRelationshipRef(name: string, ref: RelationshipRef): void;
        })._setRelationshipRef(inverseName, { data: null });
      }
    });
  }

  // --- unload ---

  /**
   * Removes a record from the identity map and clears its relationship cache.
   * Called by `record.unloadRecord()` and internally after `deleteRecord`.
   */
  unloadRecord(record: Model): void {
    if (record.id !== null) {
      this.identityMap.delete(record.modelName, record.id);
    }
    this.untrackNewRecord(record);
    this.relationshipCache.delete(record);
  }

  /**
   * Unloads all records for `modelName`, or all records across all types when
   * `modelName` is omitted.
   */
  unloadAll(modelName?: string): void {
    if (modelName) {
      for (const record of this.identityMap.all(modelName)) {
        this.relationshipCache.delete(record);
      }
      this.identityMap.clear(modelName);
      this.newRecords.get(modelName)?.clear();
    } else {
      this.identityMap.clear();
      this.newRecords.clear();
    }
  }

  // --- find ---

  /**
   * Finds a single record by id.  Returns the cached record immediately when
   * `options.reload` is not set; otherwise re-fetches.
   *
   * When the adapter has `coalesceFindRequests: true` and `findMany` is
   * implemented, multiple concurrent `findRecord` calls for the same type
   * are batched into a single `findMany` network request.
   */
  async findRecord<T extends Model = Model>(
    modelName: string,
    id: string,
    options: FindOptions = {},
  ): Promise<T> {
    const cached = this.peekRecord<T>(modelName, id);
    if (cached && !options.reload && !options.include) {
      return cached;
    }

    if (!options.reload && !options.include && this._cache) {
      const cacheEntry = await this._cache.get(modelName, id);
      if (cacheEntry) {
        const record = this.push({
          data: {
            type: cacheEntry.modelName,
            id: cacheEntry.id,
            attributes: cacheEntry.attributes,
            relationships: cacheEntry.relationships,
          },
        });
        return record as T;
      }
    }

    const adapter = this.adapterFor(modelName);

    if (adapter.coalesceFindRequests && adapter.findMany && !options.include) {
      return this.scheduleCoalescedFind(modelName, id) as Promise<T>;
    }

    const snapshot = cached ? this.createSnapshot(cached) : this.createEmptySnapshot(modelName, id);
    const adapterOptions: AdapterFetchOptions | undefined = options.include
      ? { include: options.include, adapterOptions: options.adapterOptions }
      : options.adapterOptions ? { adapterOptions: options.adapterOptions } : undefined;
    const response = await adapter.findRecord(this, modelName, id, snapshot, adapterOptions);
    const responseHeaders = extractResponseHeaders(response);
    const doc = this.serializerFor(modelName).normalizeResponse(
      this,
      this.schema.modelFor(modelName),
      response,
      id,
      'findRecord',
    ) as NormalizedDocument;
    const record = this.push(doc);

    if (this._cache) {
      const ttl = responseHeaders
        ? parseCacheTTLFromHeaders(responseHeaders)
        : null;
      if (ttl !== 0) {
        this.cacheNormalizedDocument(doc, ttl ?? undefined);
      }
    }

    return record as T;
  }

  /**
   * Fetches all records of `modelName` from the server and returns a
   * `RecordArray` backed by the identity map.
   */
  async findAll<T extends Model = Model>(
    modelName: string,
    options: FindOptions = {},
  ): Promise<RecordArray<T>> {
    const adapter = this.adapterFor(modelName);
    const adapterOptions: AdapterFetchOptions | undefined = options.include
      ? { include: options.include, adapterOptions: options.adapterOptions }
      : options.adapterOptions ? { adapterOptions: options.adapterOptions } : undefined;
    const response = await adapter.findAll(this, modelName, null, [], adapterOptions);
    const responseHeaders = extractResponseHeaders(response);
    const doc = this.serializerFor(modelName).normalizeResponse(
      this,
      this.schema.modelFor(modelName),
      response,
      null,
      'findAll',
    ) as NormalizedDocument;
    this.push(doc);

    if (this._cache) {
      const ttl = responseHeaders
        ? parseCacheTTLFromHeaders(responseHeaders)
        : null;
      if (ttl !== 0) {
        this.cacheNormalizedDocument(doc, ttl ?? undefined);
      }
    }

    return this.peekAll<T>(modelName);
  }

  /**
   * Executes an adapter query and returns an `AdapterPopulatedRecordArray`
   * whose `update()` method re-issues the same query.
   */
  async query<T extends Model = Model>(
    modelName: string,
    params: Record<string, unknown>,
  ): Promise<AdapterPopulatedRecordArray<T>> {
    const ids: string[] = [];
    const array = new AdapterPopulatedRecordArray<T>({
      modelName,
      query: params,
      source: () => ids
        .map((id) => this.peekRecord<T>(modelName, id))
        .filter((r): r is T => r !== null),
      update: async () => {
        await this.runQuery(modelName, params, array, ids);
      },
    });
    await this.runQuery(modelName, params, array, ids);
    return array;
  }

  private async runQuery<T extends Model>(
    modelName: string,
    params: Record<string, unknown>,
    array: AdapterPopulatedRecordArray<T>,
    ids: string[],
  ): Promise<void> {
    const adapter = this.adapterFor(modelName);
    const response = await adapter.query(this, modelName, params, array);
    const doc = this.serializerFor(modelName).normalizeResponse(
      this,
      this.schema.modelFor(modelName),
      response,
      null,
      'query',
    ) as NormalizedDocument;
    this.push(doc);
    ids.length = 0;
    if (Array.isArray(doc.data)) {
      for (const resource of doc.data) {
        if (resource.id) {
          ids.push(resource.id);
        }
      }
    }
    if (doc.meta) {
      array._setMeta(doc.meta);
    }
    if (doc.links) {
      array._setLinks(doc.links);
    }
  }

  /**
   * Executes an adapter query that returns at most one record.
   * Returns `null` when the adapter returns an empty payload.
   */
  async queryRecord<T extends Model = Model>(
    modelName: string,
    params: Record<string, unknown>,
  ): Promise<T | null> {
    const adapter = this.adapterFor(modelName);
    const response = await adapter.queryRecord(this, modelName, params);
    const doc = this.serializerFor(modelName).normalizeResponse(
      this,
      this.schema.modelFor(modelName),
      response,
      null,
      'queryRecord',
    ) as NormalizedDocument;
    const result = this.push(doc);
    if (Array.isArray(result)) {
      return (result[0] ?? null) as T | null;
    }
    return (result as T | null) ?? null;
  }

  // --- save / delete / reload from Model ---

  /**
   * Persists a record to the server.
   * - New records → `adapter.createRecord` (POST)
   * - Existing dirty records → `adapter.updateRecord` (PUT) by default
   * - With `{ patch: true }` → `adapter.patchRecord` (PATCH, partial payload)
   *
   * After the response is received the server data is applied back to the
   * record via `_applyServerData` so it transitions to `saved`.
   */
  async saveRecord<T extends Model>(record: T, options: SaveOptions = {}): Promise<T> {
    const adapter = this.adapterFor(record.modelName);
    const { isNew } = record;

    if (isNew && this.schema.hasClientGeneratedIds(record.modelName) && record.id === null) {
      record.id = record._clientId;
    }

    const snapshot = this.createSnapshot(record);
    let response: unknown;
    if (isNew) {
      response = await adapter.createRecord(this, record.modelName, snapshot);
    } else if (options.patch && adapter.patchRecord) {
      response = await adapter.patchRecord(this, record.modelName, snapshot);
    } else {
      response = await adapter.updateRecord(this, record.modelName, snapshot);
    }
    const doc = this.serializerFor(record.modelName).normalizeResponse(
      this,
      this.schema.modelFor(record.modelName),
      response,
      record.id,
      isNew ? 'createRecord' : 'updateRecord',
    ) as NormalizedDocument;
    const data = doc.data as NormalizedResource | null;
    if (data) {
      const newId = data.id ?? record.id;
      runInAction(() => {
        (record as unknown as {
          _applyServerData(
            id: string | null,
            data: Record<string, unknown>,
            relationships?: Record<string, RelationshipRef>,
          ): void;
        })._applyServerData(newId, data.attributes ?? {}, data.relationships);
      });
      if (isNew && newId) {
        this.untrackNewRecord(record);
        this.identityMap.set(record.modelName, newId, record);
      }
    }
    if (doc.included) {
      for (const resource of doc.included) {
        this.pushResource(resource);
      }
    }

    if (this._cache && record.id) {
      const internal = record as unknown as {
        _data: Record<string, unknown>;
        _relationships: Map<string, RelationshipRef>;
      };
      const relationships: Record<string, RelationshipRef> = {};
      for (const [name, ref] of internal._relationships) {
        relationships[name] = ref;
      }
      this._cache.set(record.modelName, record.id, { ...internal._data }, {
        relationships: Object.keys(relationships).length > 0
          ? relationships : undefined,
      });
    }

    return record;
  }

  /**
   * Issues a DELETE request and unloads the record from the identity map.
   */
  async deleteRecord<T extends Model>(record: T): Promise<T> {
    const adapter = this.adapterFor(record.modelName);
    const snapshot = this.createSnapshot(record);
    await adapter.deleteRecord(this, record.modelName, snapshot);
    if (this._cache && record.id) {
      this._cache.invalidate(record.modelName, record.id);
    }
    this.unloadRecord(record);
    return record;
  }

  /**
   * Re-fetches a record from the server and merges the response into the
   * existing instance.
   */
  async reloadRecord<T extends Model>(record: T): Promise<T> {
    if (!record.id) {
      throw new Error('Cannot reload a record without an id');
    }
    const adapter = this.adapterFor(record.modelName);
    const snapshot = this.createSnapshot(record);
    const response = await adapter.findRecord(this, record.modelName, record.id, snapshot);
    const doc = this.serializerFor(record.modelName).normalizeResponse(
      this,
      this.schema.modelFor(record.modelName),
      response,
      record.id,
      'findRecord',
    ) as NormalizedDocument;
    this.push(doc);
    return record;
  }

  // --- snapshot ---

  /**
   * Creates a `Snapshot` for a live record.
   * The snapshot reads directly from the record's internal state so it
   * reflects the current (possibly dirty) values.
   */
  createSnapshot(record: Model): Snapshot {
    const { modelName } = record;
    const attributes = this.schema.attributesDefinitionFor(modelName);
    const relationships = this.schema.relationshipsDefinitionFor(modelName);
    const internal = record as unknown as {
      _data: Record<string, unknown>;
      _getRelationshipRef(name: string): RelationshipRef | null;
      changedAttributes(): Record<string, [unknown, unknown]>;
    };
    return {
      id: record.id,
      clientId: record._clientId,
      modelName,
      record,
      attr: (key) => internal._data[key],
      belongsTo: (key, options) => {
        const ref = internal._getRelationshipRef(key);
        if (!ref?.data || Array.isArray(ref.data)) {
          return null;
        }
        if (options?.id) {
          return ref.data.id;
        }
        return this.peekRecord(ref.data.type, ref.data.id);
      },
      hasMany: (key, options) => {
        const ref = internal._getRelationshipRef(key);
        const items: Array<{ type: string; id: string }> = ref?.data
          && Array.isArray(ref.data) ? ref.data : [];
        if (options?.ids) {
          return items.map((item) => item.id);
        }
        return items
          .map((item) => this.peekRecord(item.type, item.id))
          .filter((resolvedRecord): resolvedRecord is Model => resolvedRecord !== null);
      },
      changedAttributes: () => internal.changedAttributes(),
      eachAttribute: (callback) => {
        for (const [key, meta] of attributes) {
          callback(key, meta);
        }
      },
      eachRelationship: (callback) => {
        for (const [key, meta] of relationships) {
          callback(key, meta);
        }
      },
    };
  }

  /**
   * Creates a placeholder `Snapshot` for a record that is not yet in the
   * identity map (used when fetching a record that isn't cached).
   */
  private createEmptySnapshot(modelName: string, id: string): Snapshot {
    const attributes = this.schema.attributesDefinitionFor(modelName);
    const relationships = this.schema.relationshipsDefinitionFor(modelName);
    return {
      id,
      clientId: '',
      modelName,
      record: null as unknown as Model,
      attr: () => undefined,
      belongsTo: () => null,
      hasMany: () => [],
      changedAttributes: () => ({}),
      eachAttribute: (callback) => {
        for (const [key, meta] of attributes) {
          callback(key, meta);
        }
      },
      eachRelationship: (callback) => {
        for (const [key, meta] of relationships) {
          callback(key, meta);
        }
      },
    };
  }

  // --- relationship resolution (called by Model) ---

  private getRelationshipCache(
    record: Model,
    name: string,
  ): ManyArray | AsyncBelongsTo | AsyncHasMany | undefined {
    return this.relationshipCache.get(record)?.get(name);
  }

  private setRelationshipCache(
    record: Model,
    name: string,
    value: ManyArray | AsyncBelongsTo | AsyncHasMany,
  ): void {
    let m = this.relationshipCache.get(record);
    if (!m) {
      m = new Map();
      this.relationshipCache.set(record, m);
    }
    m.set(name, value);
  }

  /**
   * Called by the `Model` relationship getter to resolve a relationship.
   *
   * - **Async** `belongsTo` → returns an `AsyncBelongsTo` wrapper.
   * - **Async** `hasMany`   → returns an `AsyncHasMany` wrapper.
   * - **Sync** `belongsTo`  → peeks the related record from the identity map.
   * - **Sync** `hasMany`    → returns a `ManyArray` backed by the store.
   *
   * Results are cached per record + name so the same proxy is returned on
   * repeated accesses (important for MobX observability).
   */
  resolveRelationship(record: Model, name: string, meta: RelationshipDef): unknown {
    const isAsync = meta.options.async === true;
    const cached = this.getRelationshipCache(record, name);
    if (cached) {
      return cached;
    }
    const hostWithStore = {
      parent: record,
      name,
      meta,
      store: this as unknown as never,
    };

    if (isAsync) {
      if (meta.kind === 'belongsTo') {
        const wrapper = new AsyncBelongsTo(hostWithStore as never);
        this.setRelationshipCache(record, name, wrapper);
        return wrapper;
      }
      const wrapper = new AsyncHasMany(hostWithStore as never);
      this.setRelationshipCache(record, name, wrapper);
      return wrapper;
    }

    if (meta.kind === 'belongsTo') {
      const ref = (record as unknown as {
        _getRelationshipRef(name: string): RelationshipRef | null;
      })._getRelationshipRef(name);
      if (!ref?.data || Array.isArray(ref.data)) {
        return null;
      }
      return this.peekRecord(ref.data.type, ref.data.id);
    }
    const arr = new ManyArray(hostWithStore as never);
    this.setRelationshipCache(record, name, arr);
    return arr;
  }

  /**
   * Called by the `Model` `belongsTo` setter to update a relationship ref
   * and keep its inverse in sync.
   */
  setRelationshipValue(
    record: Model,
    name: string,
    meta: RelationshipDef,
    value: unknown,
  ): void {
    if (meta.kind !== 'belongsTo') {
      return;
    }
    const ref = (record as unknown as {
      _getRelationshipRef(name: string): RelationshipRef | null;
    })._getRelationshipRef(name);
    const prev = ref?.data && !Array.isArray(ref.data) ? ref.data : null;

    if (value === null || value === undefined) {
      runInAction(() => {
        (record as unknown as {
          _setRelationshipRef(name: string, ref: RelationshipRef): void;
        })._setRelationshipRef(name, { data: null });
      });
      if (prev && meta.options.inverse) {
        this.removeInverse(prev.type, prev.id, meta.options.inverse, record);
      }
      return;
    }

    const target = value as Model;
    const newRef = { type: target.modelName, id: target.id! };
    runInAction(() => {
      (record as unknown as {
        _setRelationshipRef(name: string, ref: RelationshipRef): void;
      })._setRelationshipRef(name, { data: newRef });
    });

    if (meta.options.inverse) {
      if (prev && !Store.refEquals(prev, newRef)) {
        this.removeInverse(prev.type, prev.id, meta.options.inverse, record);
      }
      this.addInverse(newRef.type, newRef.id, meta.options.inverse, record);
    }
  }

  // --- hooks used by ManyArray ---

  /** Returns the raw relationship ref stored on `record` for `name`. */
  _getRelationshipRefFor(record: Model, name: string): RelationshipRef | null {
    return (record as unknown as {
      _getRelationshipRef(n: string): RelationshipRef | null;
    })._getRelationshipRef(name);
  }

  /** Returns any pending (unsaved) members for a `hasMany` relationship. */
  _getPendingMembers(record: Model, name: string): Iterable<Model> {
    return this.pendingMembers.get(record)?.get(name) ?? [];
  }

  private addPendingMember(record: Model, name: string, value: Model): void {
    let byName = this.pendingMembers.get(record);
    if (!byName) {
      byName = new Map();
      this.pendingMembers.set(record, byName);
    }
    let set = byName.get(name);
    if (!set) {
      set = observable.set<Model>();
      byName.set(name, set);
    }
    set.add(value);
  }

  private removePendingMember(record: Model, name: string, value: Model): void {
    this.pendingMembers.get(record)?.get(name)?.delete(value);
  }

  /**
   * Appends `value` to the `hasMany` relationship ref on `record` and syncs
   * the inverse.  Unsaved records (`value.id === null`) are tracked as
   * "pending members" until they are persisted.
   */
  _hasManyAppend(
    record: Model,
    name: string,
    meta: RelationshipDef,
    value: Model,
  ): void {
    if (value.id === null) {
      this.addPendingMember(record, name, value);
      if (meta.options.inverse) {
        const inverseMeta = this.schema
          .relationshipsDefinitionFor(value.modelName)
          .get(meta.options.inverse);
        if (inverseMeta?.kind === 'belongsTo') {
          runInAction(() => {
            (value as unknown as {
              _setRelationshipRef(n: string, r: RelationshipRef): void;
            })._setRelationshipRef(meta.options.inverse!, {
              data: { type: record.modelName, id: record.id! },
            });
          });
        }
      }
      return;
    }
    const ref = this._getRelationshipRefFor(record, name);
    const currentData = ref?.data && Array.isArray(ref.data) ? ref.data : [];
    const entry = { type: value.modelName, id: value.id };
    if (!currentData.some((reference) => Store.refEquals(reference, entry))) {
      runInAction(() => {
        (record as unknown as {
          _setRelationshipRef(n: string, r: RelationshipRef): void;
        })._setRelationshipRef(name, { data: [...currentData, entry] });
      });
    }
    if (meta.options.inverse) {
      this.addInverse(value.modelName, value.id, meta.options.inverse, record);
    }
  }

  /**
   * Removes `value` from the `hasMany` relationship ref on `record` and syncs
   * the inverse.  Pending members are removed from the pending set.
   */
  _hasManyRemove(
    record: Model,
    name: string,
    meta: RelationshipDef,
    value: Model,
  ): void {
    if (value.id === null) {
      this.removePendingMember(record, name, value);
      return;
    }
    const ref = this._getRelationshipRefFor(record, name);
    const currentData = ref?.data && Array.isArray(ref.data) ? ref.data : [];
    const filtered = currentData.filter(
      (reference) => !(reference.id === value.id && reference.type === value.modelName),
    );
    runInAction(() => {
      (record as unknown as {
        _setRelationshipRef(n: string, r: RelationshipRef): void;
      })._setRelationshipRef(name, { data: filtered });
    });
    if (meta.options.inverse) {
      this.removeInverse(value.modelName, value.id, meta.options.inverse, record);
    }
  }

  // --- persistent cache helpers ---

  private cacheNormalizedDocument(
    doc: NormalizedDocument,
    ttl?: number,
  ): void {
    const resources: NormalizedResource[] = [];
    if (doc.data) {
      if (Array.isArray(doc.data)) {
        resources.push(...doc.data);
      } else {
        resources.push(doc.data);
      }
    }
    if (doc.included) {
      resources.push(...doc.included);
    }
    for (const resource of resources) {
      if (resource.id) {
        this._cache!.set(resource.type, resource.id, resource.attributes ?? {}, {
          relationships: resource.relationships,
          ttl,
        });
      }
    }
  }

  // --- coalesceFindRequests ---

  private coalescePending: Map<string, Map<string, {
    resolve: (record: Model) => void;
    reject: (error: unknown) => void;
  }[]>> = new Map();

  private coalesceScheduled: Set<string> = new Set();

  private scheduleCoalescedFind(modelName: string, id: string): Promise<Model> {
    return new Promise((resolve, reject) => {
      let byId = this.coalescePending.get(modelName);
      if (!byId) {
        byId = new Map();
        this.coalescePending.set(modelName, byId);
      }
      let callbacks = byId.get(id);
      if (!callbacks) {
        callbacks = [];
        byId.set(id, callbacks);
      }
      callbacks.push({ resolve, reject });

      if (!this.coalesceScheduled.has(modelName)) {
        this.coalesceScheduled.add(modelName);
        queueMicrotask(() => this.flushCoalescedFind(modelName));
      }
    });
  }

  private async flushCoalescedFind(modelName: string): Promise<void> {
    this.coalesceScheduled.delete(modelName);
    const byId = this.coalescePending.get(modelName)!;
    const pendingEntries = new Map(byId);
    byId.clear();

    const ids = Array.from(pendingEntries.keys());
    const adapter = this.adapterFor(modelName);

    try {
      const snapshots = ids.map((id) => {
        const cached = this.peekRecord(modelName, id);
        return cached
          ? this.createSnapshot(cached)
          : this.createEmptySnapshot(modelName, id);
      });
      const response = await adapter.findMany!(this, modelName, ids, snapshots);
      const doc = this.serializerFor(modelName).normalizeResponse(
        this,
        this.schema.modelFor(modelName),
        response,
        null,
        'findMany',
      ) as NormalizedDocument;
      this.push(doc);

      for (const id of ids) {
        const record = this.peekRecord(modelName, id);
        const callbacks = pendingEntries.get(id);
        if (callbacks) {
          for (const callback of callbacks) {
            if (record) {
              callback.resolve(record);
            } else {
              callback.reject(new Error(`Record not found after findMany: ${modelName}:${id}`));
            }
          }
        }
      }
    } catch (error) {
      for (const callbacks of pendingEntries.values()) {
        for (const callback of callbacks) {
          callback.reject(error);
        }
      }
    }
  }

  // --- liveQuery ---

  /**
   * Returns a reactive `RecordArray` that auto-updates whenever records matching
   * the predicate are added, removed, or mutated in the identity map.
   *
   * The underlying computed uses `keepAlive: true` so it remains cached even
   * without active MobX observers — useful for long-lived filtered views.
   *
   * @param modelName - The registered model type to query.
   * @param predicate - Filter function applied to each record of `modelName`.
   * @returns A live `RecordArray` containing only records that satisfy `predicate`.
   */
  liveQuery<T extends Model = Model>(
    modelName: string,
    predicate: (record: T) => boolean,
  ): RecordArray<T> {
    return new RecordArray<T>({
      modelName,
      keepAlive: true,
      source: () => {
        const all = this.identityMap.all(modelName) as T[];
        const newRecordsForType = this.newRecords.get(modelName);
        const combined = newRecordsForType && newRecordsForType.size > 0
          ? [...all, ...(newRecordsForType as unknown as Set<T>)]
          : all;
        return combined.filter(predicate);
      },
    });
  }

  // --- select (MDQL) ---

  select<T extends Model = Model>(modelName: string): MdqlQueryBuilder<T> {
    if (!this.schema.doesTypeExist(modelName)) {
      throw new Error(`Unknown model type: "${modelName}"`);
    }
    return new MdqlQueryBuilder<T>(this, modelName);
  }

  // --- optimisticUpdate ---

  /**
   * Applies attribute changes to a record immediately (optimistically), then
   * executes `persistFn`.  If `persistFn` throws, the record is automatically
   * rolled back to its state before the optimistic update.
   *
   * @param record - The record to update optimistically.
   * @param optimisticAttributes - Attributes to apply before persistence.
   * @param persistFn - Async function that persists the change (e.g. `record.save()`).
   * @returns The record on success.
   * @throws Re-throws the error from `persistFn` after rollback.
   */
  async optimisticUpdate<T extends Model>(
    record: T,
    optimisticAttributes: Partial<Record<string, unknown>>,
    persistFn: () => Promise<unknown>,
  ): Promise<T> {
    const internal = record as unknown as {
      _data: Record<string, unknown>;
      _savedData: Record<string, unknown>;
    };
    const backup = { ...internal._data };

    runInAction(() => {
      for (const key of Object.keys(optimisticAttributes)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') { continue; }
        internal._data[key] = optimisticAttributes[key];
      }
    });

    try {
      await persistFn();
      return record;
    } catch (error) {
      runInAction(() => {
        for (const [key, value] of Object.entries(backup)) {
          internal._data[key] = value;
        }
      });
      throw error;
    }
  }

  // --- runInTransaction ---

  /**
   * Executes multiple store mutations as a single MobX action, guaranteeing
   * that observers (and therefore UI renders) react only once — after all
   * mutations have been applied.
   *
   * @param callback - Synchronous function containing one or more store mutations.
   */
  runInTransaction(callback: () => void): void {
    runInAction(callback);
  }

  // --- SSR: serialize / hydrate ---

  /**
   * Produces a JSON-serializable snapshot of all records in the identity map.
   * Designed for server-side rendering: serialize on the server, transfer as
   * JSON, then `hydrate()` on the client to restore the full store state
   * without network requests.
   *
   * @param options.exclude - Per-model-type list of attribute keys to omit
   *   (e.g. `{ user: ['password', 'token'] }`) to prevent leaking sensitive
   *   data in SSR payloads.
   * @returns A snapshot object safe to pass through `JSON.stringify`.
   */
  serialize(options: {
    exclude?: Record<string, string[]>;
  } = {}): { records: Record<string, Array<{ id: string; attributes: Record<string, unknown>; relationships?: Record<string, RelationshipRef> }>> } {
    const records: Record<string, Array<{ id: string; attributes: Record<string, unknown>; relationships?: Record<string, RelationshipRef> }>> = {};
    const allTypes = this.identityMap._buckets;
    for (const [modelName, bucket] of allTypes) {
      const excludeKeys = options.exclude?.[modelName];
      const items: Array<{ id: string; attributes: Record<string, unknown>; relationships?: Record<string, RelationshipRef> }> = [];
      for (const [id, record] of bucket) {
        const internal = record as unknown as {
          _data: Record<string, unknown>;
          _relationships: Map<string, RelationshipRef>;
        };
        let attributes: Record<string, unknown>;
        if (excludeKeys && excludeKeys.length > 0) {
          attributes = {};
          for (const [key, value] of Object.entries(internal._data)) {
            if (!excludeKeys.includes(key)) {
              attributes[key] = value;
            }
          }
        } else {
          attributes = { ...internal._data };
        }
        const entry: { id: string; attributes: Record<string, unknown>; relationships?: Record<string, RelationshipRef> } = {
          id,
          attributes,
        };
        if (internal._relationships && internal._relationships.size > 0) {
          const relationships: Record<string, RelationshipRef> = {};
          for (const [name, ref] of internal._relationships) {
            relationships[name] = ref;
          }
          entry.relationships = relationships;
        }
        items.push(entry);
      }
      if (items.length > 0) {
        records[modelName] = items;
      }
    }
    return { records };
  }

  /**
   * Restores records from a snapshot produced by `serialize()` into this store
   * instance.  All records are pushed into the identity map in `loaded.saved`
   * state — no network requests are issued.
   *
   * @param snapshot - A snapshot object previously returned by `serialize()`.
   */
  hydrate(snapshot: { records: Record<string, Array<{ id: string; attributes: Record<string, unknown>; relationships?: Record<string, RelationshipRef> }>> }): void {
    runInAction(() => {
      for (const [modelName, items] of Object.entries(snapshot.records)) {
        for (const item of items) {
          this.pushResource({
            type: modelName,
            id: item.id,
            attributes: item.attributes,
            relationships: item.relationships,
          });
        }
      }
    });
  }

  /**
   * Factory method that creates a new `Store` and immediately hydrates it from
   * the given snapshot.  Convenience for SSR client-side bootstrap.
   *
   * @param schema - SchemaService with all model types registered.
   * @param snapshot - A snapshot object previously returned by `serialize()`.
   * @returns A fully populated `Store` instance ready for use.
   */
  static hydrate(
    schema: SchemaService,
    snapshot: { records: Record<string, Array<{ id: string; attributes: Record<string, unknown>; relationships?: Record<string, RelationshipRef> }>> },
  ): Store {
    const store = new Store(schema);
    store.hydrate(snapshot);
    return store;
  }
}
