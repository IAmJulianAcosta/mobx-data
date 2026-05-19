import type { RelationshipRef } from '@mobx-data/model';

export const RESPONSE_HEADERS: unique symbol = Symbol('response-headers');

export interface CacheEntryData {
  modelName: string;
  id: string;
  attributes: Record<string, unknown>;
  relationships?: Record<string, RelationshipRef>;
  cachedAt: number;
  expiresAt: number;
}

export interface IndexedDBCacheOptions {
  databaseName?: string;
  defaultTTL?: number;
}

export interface CacheLike {
  get(modelName: string, id: string): Promise<CacheEntryData | null>;
  set(
    modelName: string,
    id: string,
    attributes: Record<string, unknown>,
    options?: {
      relationships?: Record<string, RelationshipRef>;
      ttl?: number;
    },
  ): Promise<void>;
  has(modelName: string, id: string): Promise<boolean>;
  invalidate(modelName: string, id: string): Promise<void>;
  invalidateAll(modelName?: string): Promise<void>;
}
