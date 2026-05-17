/**
 * In-memory adapter for testing and server-side rendering.
 *
 * `MemoryAdapter` stores records in plain `Map` structures with no network I/O.
 * It implements the full adapter interface (findRecord, findAll, findMany, query,
 * queryRecord, createRecord, updateRecord, deleteRecord) so it can serve as a
 * drop-in replacement for `RestAdapter` in unit tests or SSR hydration scenarios.
 *
 * Use `seed()` to pre-populate data and `reset()` to clear all state between
 * test cases.
 */

import { injectable } from 'tsyringe';
import { Adapter, type AdapterSnapshot } from './Adapter.js';

interface MemoryRecord {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
}

@injectable()
export class MemoryAdapter extends Adapter {
  private storage: Map<string, Map<string, MemoryRecord>> = new Map();

  private nextId: Map<string, number> = new Map();

  private getCollection(modelName: string): Map<string, MemoryRecord> {
    let collection = this.storage.get(modelName);
    if (!collection) {
      collection = new Map();
      this.storage.set(modelName, collection);
    }
    return collection;
  }

  private generateId(modelName: string): string {
    const current = this.nextId.get(modelName) ?? 1;
    this.nextId.set(modelName, current + 1);
    return String(current);
  }

  /**
   * Pre-populates the adapter with records for a given model type.
   * Auto-increments the internal ID counter to avoid collisions with
   * subsequently created records.
   *
   * @param modelName - The model type to seed.
   * @param records - Array of plain objects; each must have an `id` key.
   */
  seed(modelName: string, records: Array<{ id: string; [key: string]: unknown }>): void {
    const collection = this.getCollection(modelName);
    for (const record of records) {
      const { id, ...attributes } = record;
      collection.set(id, { id, type: modelName, attributes });
      const numId = Number(id);
      if (!Number.isNaN(numId)) {
        const current = this.nextId.get(modelName) ?? 1;
        if (numId >= current) {
          this.nextId.set(modelName, numId + 1);
        }
      }
    }
  }

  /** Clears all stored records and resets ID counters. */
  reset(): void {
    this.storage.clear();
    this.nextId.clear();
  }

  override async findRecord(
    _store: unknown,
    modelName: string,
    id: string,
  ): Promise<unknown> {
    const collection = this.getCollection(modelName);
    const record = collection.get(id);
    if (!record) {
      throw Object.assign(
        new Error(`Record not found: ${modelName}:${id}`),
        { status: 404 },
      );
    }
    return { data: { id: record.id, type: record.type, attributes: { ...record.attributes } } };
  }

  override async findAll(
    _store: unknown,
    modelName: string,
  ): Promise<unknown> {
    const collection = this.getCollection(modelName);
    const data = Array.from(collection.values()).map((record) => ({
      id: record.id,
      type: record.type,
      attributes: { ...record.attributes },
    }));
    return { data };
  }

  override async findMany(
    _store: unknown,
    modelName: string,
    ids: string[],
  ): Promise<unknown> {
    const collection = this.getCollection(modelName);
    const data = ids
      .map((id) => collection.get(id))
      .filter((record): record is MemoryRecord => record !== undefined)
      .map((record) => ({
        id: record.id,
        type: record.type,
        attributes: { ...record.attributes },
      }));
    return { data };
  }

  /** Filters records by exact attribute match on all query keys. */
  override async query(
    _store: unknown,
    modelName: string,
    query: Record<string, unknown>,
  ): Promise<unknown> {
    const collection = this.getCollection(modelName);
    const entries = Array.from(collection.values());
    const filtered = entries.filter((record) => {
      for (const [key, value] of Object.entries(query)) {
        if (record.attributes[key] !== value) {
          return false;
        }
      }
      return true;
    });
    const data = filtered.map((record) => ({
      id: record.id,
      type: record.type,
      attributes: { ...record.attributes },
    }));
    return { data };
  }

  /** Returns the first record matching the query, or `null`. */
  override async queryRecord(
    _store: unknown,
    modelName: string,
    query: Record<string, unknown>,
  ): Promise<unknown> {
    const result = await this.query(_store, modelName, query) as { data: unknown[] };
    return { data: result.data[0] ?? null };
  }

  private static safeAssign(
    target: Record<string, unknown>,
    source: Record<string, unknown>,
  ): void {
    for (const [key, value] of Object.entries(source)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      target[key] = value;
    }
  }

  override async createRecord(
    _store: unknown,
    modelName: string,
    snapshot: AdapterSnapshot,
  ): Promise<unknown> {
    const id = this.generateId(modelName);
    const attributes: Record<string, unknown> = {};
    const record = snapshot.record as { _data?: Record<string, unknown> };
    if (record._data) {
      MemoryAdapter.safeAssign(attributes, record._data);
    }
    const entry: MemoryRecord = { id, type: modelName, attributes };
    this.getCollection(modelName).set(id, entry);
    return { data: { id, type: modelName, attributes: { ...attributes } } };
  }

  override async updateRecord(
    _store: unknown,
    modelName: string,
    snapshot: AdapterSnapshot,
  ): Promise<unknown> {
    const { id } = snapshot;
    if (!id) {
      throw new Error('Cannot update a record without an id');
    }
    const collection = this.getCollection(modelName);
    const existing = collection.get(id);
    if (!existing) {
      throw Object.assign(
        new Error(`Record not found: ${modelName}:${id}`),
        { status: 404 },
      );
    }
    const record = snapshot.record as { _data?: Record<string, unknown> };
    if (record._data) {
      MemoryAdapter.safeAssign(existing.attributes, record._data);
    }
    return { data: { id, type: modelName, attributes: { ...existing.attributes } } };
  }

  override async deleteRecord(
    _store: unknown,
    modelName: string,
    snapshot: AdapterSnapshot,
  ): Promise<unknown> {
    const { id } = snapshot;
    if (!id) {
      throw new Error('Cannot delete a record without an id');
    }
    this.getCollection(modelName).delete(id);
    return null;
  }
}
