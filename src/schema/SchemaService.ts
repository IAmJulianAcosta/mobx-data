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
  MODEL_OPTIONS_META_KEY,
  type AttributeDef,
  type AttributeDefinitionsMap,
  type DiscriminatorDef,
  type ModelOptions,
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
  /** When `true`, the model is abstract and cannot be instantiated directly. */
  abstract?: boolean;
  /** Discriminator configuration for polymorphic hierarchies. */
  discriminator?: DiscriminatorDef;
  /** Model name of the polymorphic root when this is a concrete child. */
  polymorphicRoot?: string;
  /** When `true`, the client-generated id is sent to the server on create. */
  clientGeneratedIds?: boolean;
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
    const entry: Entry = { modelClass, attributes, relationships };

    const options = Reflect.getOwnMetadata(MODEL_OPTIONS_META_KEY, modelClass) as
      | ModelOptions
      | undefined;
    if (options?.abstract) {
      entry.abstract = true;
    }
    if (options?.discriminator) {
      entry.discriminator = {
        key: options.discriminator.key ?? 'type',
        map: options.discriminator.map,
      };
    }
    if (options?.clientGeneratedIds) {
      entry.clientGeneratedIds = true;
    }

    this.entries.set(modelName, entry);
    this.linkPolymorphicChild(modelName, modelClass);
  }

  /**
   * After registering a model, checks whether any already-registered
   * polymorphic parent lists this model in its discriminator map and, if so,
   * stores the `polymorphicRoot` back-link.
   */
  private linkPolymorphicChild(childName: string, childClass: ModelClass): void {
    for (const [parentName, parentEntry] of this.entries) {
      if (!parentEntry.discriminator || parentName === childName) continue;
      for (const factory of Object.values(parentEntry.discriminator.map)) {
        if (factory() === childClass) {
          const childEntry = this.entries.get(childName);
          if (childEntry) {
            childEntry.polymorphicRoot = parentName;
          }
          return;
        }
      }
    }
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

  /** Returns all registered model names. */
  registeredNames(): string[] {
    return Array.from(this.entries.keys());
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

  /**
   * Returns the discriminator definition for `modelName`, or `undefined`
   * when the model is not polymorphic.
   */
  discriminatorFor(modelName: string): DiscriminatorDef | undefined {
    return this.entries.get(modelName)?.discriminator;
  }

  /**
   * Returns the polymorphic root model name for a concrete child, or `null`
   * when `modelName` is not part of a polymorphic hierarchy.
   */
  polymorphicRootFor(modelName: string): string | null {
    return this.entries.get(modelName)?.polymorphicRoot ?? null;
  }

  /**
   * Returns `true` when `modelName` is declared abstract.
   */
  isAbstract(modelName: string): boolean {
    return this.entries.get(modelName)?.abstract === true;
  }

  /** Returns `true` when the model uses client-generated ids. */
  hasClientGeneratedIds(modelName: string): boolean {
    return this.entries.get(modelName)?.clientGeneratedIds === true;
  }

  /**
   * Resolves the concrete model class for a polymorphic parent given a raw
   * payload.  Reads the discriminator key from the payload and returns the
   * resolved model name and class.
   *
   * @throws when the discriminator key is missing from the payload.
   * @throws when the discriminator value is not in the map.
   * @returns `null` when `modelName` has no discriminator (not polymorphic).
   */
  resolveConcreteModel(
    modelName: string,
    payload: Record<string, unknown>,
  ): { modelName: string; modelClass: ModelClass } | null {
    const entry = this.entries.get(modelName);
    if (!entry?.discriminator) return null;

    const { key, map } = entry.discriminator;
    const discriminatorValue = payload[key];
    if (discriminatorValue === undefined || discriminatorValue === null) {
      throw new Error(
        `Missing discriminator key "${key}" in payload for polymorphic model "${modelName}".`,
      );
    }

    const valueString = String(discriminatorValue);
    const factory = map[valueString];
    if (!factory) {
      const knownValues = Object.keys(map).join(', ');
      throw new Error(
        `Unknown discriminator value "${valueString}" for model "${modelName}" `
        + `(key: "${key}"). Known values: ${knownValues}.`,
      );
    }

    const concreteClass = factory() as ModelClass;
    const concreteName = concreteClass.modelName ?? valueString;
    return { modelName: concreteName, modelClass: concreteClass };
  }
}
