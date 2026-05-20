/**
 * Central registry for model classes and their schema metadata.
 *
 * `SchemaService` is a tsyringe singleton that acts as the authoritative
 * source of truth for every model registered with the store.  At registration
 * time it walks the full prototype chain (deepest ancestor first) and merges
 * all `@attr` / `@belongsTo` / `@hasMany` definitions so subclasses
 * transparently inherit parent schema.
 *
 * Consumers (Store, serializers, snapshot helpers) call `attributesDefinitionFor`
 * and `relationshipsDefinitionFor` rather than reading reflect-metadata directly.
 */

import 'reflect-metadata';
import { singleton } from 'tsyringe';
import {
  ATTRIBUTES_META_KEY,
  RELATIONSHIPS_META_KEY,
  type AttributeDef,
  type AttributeDefinitionsMap,
  type RelationshipDef,
  type RelationshipDefinitionsMap,
} from './types.js';

/** Minimal shape of a model constructor that SchemaService can register. */
export interface ModelClass {
  modelName?: string;
  prototype: unknown;
  new (...args: never[]): unknown;
}

/** Internal entry stored per registered model name. */
interface Entry {
  modelClass: ModelClass;
  /** Merged attribute definitions (ancestors → leaf, leaf wins). */
  attributes: AttributeDefinitionsMap;
  /** Merged relationship definitions (ancestors → leaf, leaf wins). */
  relationships: RelationshipDefinitionsMap;
}

/**
 * Walks the prototype chain from the class root down to the leaf, collecting
 * own-metadata from each level and merging into a single Map.  Later entries
 * (i.e. the subclass) override earlier ones so subclass declarations win.
 */
function walkPrototypeChain<V>(
  prototype: object | null,
  metadataKey: symbol,
): Map<string, V> {
  // Walk from Object root down to the leaf so subclass entries override parents.
  const chain: object[] = [];
  let current: object | null = prototype;
  while (current && current !== Object.prototype) {
    chain.push(current);
    current = Object.getPrototypeOf(current);
  }
  const merged = new Map<string, V>();
  for (const proto of chain.reverse()) {
    const local = Reflect.getOwnMetadata(metadataKey, proto) as
      | Map<string, V>
      | undefined;
    if (local) {
      for (const [key, value] of local) {
        merged.set(key, value);
      }
    }
  }
  return merged;
}

@singleton()
export class SchemaService {
  private entries = new Map<string, Entry>();

  /**
   * Registers a model class under `modelName`.
   *
   * Walks the prototype chain at registration time so lookups are O(1).
   * Calling this a second time for the same `modelName` replaces the entry.
   */
  registerModel(modelName: string, modelClass: ModelClass): void {
    const attributes = walkPrototypeChain<AttributeDef>(
      modelClass.prototype as object,
      ATTRIBUTES_META_KEY,
    );
    const relationships = walkPrototypeChain<RelationshipDef>(
      modelClass.prototype as object,
      RELATIONSHIPS_META_KEY,
    );
    this.entries.set(modelName, { modelClass, attributes, relationships });
  }

  /**
   * Returns the constructor for the given `modelName`.
   * @throws if the model has not been registered.
   */
  modelFor(modelName: string): ModelClass {
    const entry = this.entries.get(modelName);
    if (!entry) {
      throw new Error(`No model registered for type "${modelName}"`);
    }
    return entry.modelClass;
  }

  /** Returns `true` when a model class has been registered for `modelName`. */
  doesTypeExist(modelName: string): boolean {
    return this.entries.has(modelName);
  }

  /**
   * Returns the merged attribute definitions for `modelName`.
   * @throws if the model has not been registered.
   */
  attributesDefinitionFor(modelName: string): AttributeDefinitionsMap {
    const entry = this.entries.get(modelName);
    if (!entry) {
      throw new Error(`No model registered for type "${modelName}"`);
    }
    return entry.attributes;
  }

  /**
   * Returns the merged relationship definitions for `modelName`.
   * @throws if the model has not been registered.
   */
  relationshipsDefinitionFor(modelName: string): RelationshipDefinitionsMap {
    const entry = this.entries.get(modelName);
    if (!entry) {
      throw new Error(`No model registered for type "${modelName}"`);
    }
    return entry.relationships;
  }

  /**
   * Iterates over every attribute definition for `modelName`, invoking
   * `callback` with the attribute name and its `AttributeDef`.
   */
  eachAttribute(
    modelName: string,
    callback: (name: string, meta: AttributeDef) => void,
  ): void {
    const attributes = this.attributesDefinitionFor(modelName);
    for (const [name, meta] of attributes) {
      callback(name, meta);
    }
  }

  /**
   * Iterates over every relationship definition for `modelName`, invoking
   * `callback` with the relationship name and its `RelationshipDef`.
   */
  eachRelationship(
    modelName: string,
    callback: (name: string, meta: RelationshipDef) => void,
  ): void {
    const relationships = this.relationshipsDefinitionFor(modelName);
    for (const [name, meta] of relationships) {
      callback(name, meta);
    }
  }
}
