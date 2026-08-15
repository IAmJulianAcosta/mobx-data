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
import { type AttributeDef, type AttributeDefinitionsMap, type DiscriminatorDef, type RelationshipDef, type RelationshipDefinitionsMap } from './types.js';
/**
 * Schema view of a registered model, decoupled from its constructor.
 *
 * This is the shape serializers consume (`ModelClassMeta` in the serializer
 * package is structurally identical).  Model constructors do not carry
 * `attributes` / `relationships` themselves — the definitions live in
 * reflect-metadata on the prototype chain and are merged here at registration
 * time — so anything handing a model to a serializer must pass this view.
 */
export interface ModelMeta {
    /** Registered model name. */
    modelName: string;
    /** Merged attribute definitions (ancestors → leaf, leaf wins). */
    attributes: AttributeDefinitionsMap;
    /** Merged relationship definitions (ancestors → leaf, leaf wins). */
    relationships: RelationshipDefinitionsMap;
}
/** Minimal shape of a model constructor that SchemaService can register. */
export interface ModelClass {
    modelName?: string;
    prototype: unknown;
    new (...args: never[]): unknown;
}
export declare class SchemaService {
    private entries;
    /** Memoized `ModelMeta` views, invalidated whenever a model is re-registered. */
    private metaViews;
    /**
     * Registers a model class under `modelName`.
     *
     * Walks the prototype chain at registration time so lookups are O(1).
     * Calling this a second time for the same `modelName` replaces the entry.
     */
    registerModel(modelName: string, modelClass: ModelClass): void;
    /**
     * After registering a model, checks whether any already-registered
     * polymorphic parent lists this model in its discriminator map and, if so,
     * stores the `polymorphicRoot` back-link.
     */
    private linkPolymorphicChild;
    /**
     * Returns the constructor for the given `modelName`.
     * @throws if the model has not been registered.
     */
    modelFor(modelName: string): ModelClass;
    /**
     * Returns the serializer-facing schema view for `modelName`.
     *
     * Serializers are handed a `ModelMeta`, never the constructor: they iterate
     * `attributes` / `relationships`, which exist only on this view.  The result
     * is memoized per model name and reused across calls.
     *
     * `@model` options are mirrored onto the view via reflect-metadata so
     * serializers that read them (e.g. `JsonSerializer` checking for a
     * polymorphic discriminator) behave the same as when given the constructor.
     *
     * @throws if the model has not been registered.
     */
    metaFor(modelName: string): ModelMeta;
    /** Returns all registered model names. */
    registeredNames(): string[];
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
    /**
     * Returns the discriminator definition for `modelName`, or `undefined`
     * when the model is not polymorphic.
     */
    discriminatorFor(modelName: string): DiscriminatorDef | undefined;
    /**
     * Returns the polymorphic root model name for a concrete child, or `null`
     * when `modelName` is not part of a polymorphic hierarchy.
     */
    polymorphicRootFor(modelName: string): string | null;
    /**
     * Returns `true` when `modelName` is declared abstract.
     */
    isAbstract(modelName: string): boolean;
    /** Returns `true` when the model uses client-generated ids. */
    hasClientGeneratedIds(modelName: string): boolean;
    /**
     * Resolves the concrete model class for a polymorphic parent given a raw
     * payload.  Reads the discriminator key from the payload and returns the
     * resolved model name and class.
     *
     * @throws when the discriminator key is missing from the payload.
     * @throws when the discriminator value is not in the map.
     * @returns `null` when `modelName` has no discriminator (not polymorphic).
     */
    resolveConcreteModel(modelName: string, payload: Record<string, unknown>): {
        modelName: string;
        modelClass: ModelClass;
    } | null;
}
//# sourceMappingURL=SchemaService.d.ts.map