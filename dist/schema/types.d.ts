/** Shape of a single `@attr` decoration on a model class property. */
export interface AttributeDef {
    /** Property name on the model class. */
    name: string;
    /** Registered transform type (e.g. `'string'`, `'number'`), or `null` for pass-through. */
    type: string | null;
    /** Extra options passed by the decorator (default value, etc.). */
    options: AttributeOptions;
    /** Discriminant – always `true`; used to narrow union types. */
    isAttribute: true;
}
/** Options accepted by the `@attr` decorator. */
export interface AttributeOptions {
    /** Static value or factory function called when the attribute has no server value. */
    defaultValue?: unknown | (() => unknown);
    /** Arbitrary custom options forwarded to the transform. */
    [key: string]: unknown;
}
/** Identifies the direction of a relationship from the owning model's perspective. */
export type RelationshipKind = 'belongsTo' | 'hasMany';
/** Shape of a single `@belongsTo` / `@hasMany` decoration on a model class property. */
export interface RelationshipDef {
    /** Property name on the model class. */
    name: string;
    /** Direction from the owning model's perspective. */
    kind: RelationshipKind;
    /** `modelName` of the related model. */
    type: string;
    /** Normalised options (async, inverse, polymorphic, …). */
    options: RelationshipOptions;
    /** Discriminant – always `true`; used to narrow union types. */
    isRelationship: true;
}
/** Options accepted by `@belongsTo` and `@hasMany` decorators. */
export interface RelationshipOptions {
    /**
     * When `true` the relationship proxy returns an `AsyncBelongsTo` / `AsyncHasMany`
     * that must be awaited before the related record(s) are available.
     */
    async?: boolean;
    /**
     * Name of the inverse property on the related model.
     * Set to `null` to explicitly opt out of inverse tracking.
     */
    inverse?: string | null;
    /** When `true` the relationship can point to records of multiple model types. */
    polymorphic?: boolean;
    /** Arbitrary custom options. */
    [key: string]: unknown;
}
/** Attribute definitions keyed by property name. */
export type AttributeDefinitionsMap = Map<string, AttributeDef>;
/** Relationship definitions keyed by property name. */
export type RelationshipDefinitionsMap = Map<string, RelationshipDef>;
/** Constructor type accepted by the discriminator map. */
export interface ModelConstructor {
    new (...args: never[]): unknown;
    modelName?: string;
    prototype: unknown;
}
/** Discriminator configuration for polymorphic model hierarchies. */
export interface DiscriminatorDef {
    /** Payload field that identifies the concrete type (defaults to `"type"`). */
    key: string;
    /** Maps discriminator values to lazy model constructor references. */
    map: Record<string, () => ModelConstructor>;
}
/** Options accepted by the `@model` class decorator. */
export interface ModelOptions {
    /** Registered model name. */
    name?: string;
    /** When `true`, the model cannot be instantiated directly. */
    abstract?: boolean;
    /** Discriminator configuration for selecting concrete subclass at deserialization. */
    discriminator?: {
        /** Payload field that identifies the concrete type (defaults to `"type"`). */
        key?: string;
        /** Maps discriminator values to lazy model constructor references. */
        map: Record<string, () => ModelConstructor>;
    };
    /** When `true`, the client-generated `_clientId` is sent to the server as the record id on create. */
    clientGeneratedIds?: boolean;
}
/** Reflect-metadata key used to store attribute definitions on a prototype. */
export declare const ATTRIBUTES_META_KEY: unique symbol;
/** Reflect-metadata key used to store relationship definitions on a prototype. */
export declare const RELATIONSHIPS_META_KEY: unique symbol;
/** Reflect-metadata key used to store the registered model name on a class. */
export declare const MODEL_NAME_META_KEY: unique symbol;
/** Reflect-metadata key used to store `@model` options on a class constructor. */
export declare const MODEL_OPTIONS_META_KEY: unique symbol;
//# sourceMappingURL=types.d.ts.map