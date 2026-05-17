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
import { type AttributeDef, type AttributeDefinitionsMap, type RelationshipDef, type RelationshipDefinitionsMap } from './types.js';
/** Minimal shape of a model constructor that SchemaService can register. */
export interface ModelClass {
    modelName?: string;
    prototype: unknown;
    new (...args: never[]): unknown;
}
export declare class SchemaService {
    private entries;
    /**
     * Registers a model class under `modelName`.
     *
     * Walks the prototype chain at registration time so lookups are O(1).
     * Calling this a second time for the same `modelName` replaces the entry.
     */
    registerModel(modelName: string, modelClass: ModelClass): void;
    /**
     * Returns the constructor for the given `modelName`.
     * @throws if the model has not been registered.
     */
    modelFor(modelName: string): ModelClass;
    /** Returns `true` when a model class has been registered for `modelName`. */
    doesTypeExist(modelName: string): boolean;
    /**
     * Returns the merged attribute definitions for `modelName`.
     * @throws if the model has not been registered.
     */
    attributesDefinitionFor(modelName: string): AttributeDefinitionsMap;
    /**
     * Returns the merged relationship definitions for `modelName`.
     * @throws if the model has not been registered.
     */
    relationshipsDefinitionFor(modelName: string): RelationshipDefinitionsMap;
    /**
     * Iterates over every attribute definition for `modelName`, invoking
     * `callback` with the attribute name and its `AttributeDef`.
     */
    eachAttribute(modelName: string, callback: (name: string, meta: AttributeDef) => void): void;
    /**
     * Iterates over every relationship definition for `modelName`, invoking
     * `callback` with the relationship name and its `RelationshipDef`.
     */
    eachRelationship(modelName: string, callback: (name: string, meta: RelationshipDef) => void): void;
}
//# sourceMappingURL=SchemaService.d.ts.map