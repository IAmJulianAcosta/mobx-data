/**
 * Property decorators for declaring model attributes and relationships.
 *
 * `@attr` marks a property as a data attribute that is serialized to/from the
 * server payload.  `@belongsTo` and `@hasMany` declare the two supported
 * association directions.
 *
 * All decorators write their metadata onto the class prototype via
 * `reflect-metadata` so `SchemaService` can walk the prototype chain and
 * merge inherited definitions.
 */

import 'reflect-metadata';
import {
  ATTRIBUTES_META_KEY,
  RELATIONSHIPS_META_KEY,
  MODEL_OPTIONS_META_KEY,
  type AttributeDef,
  type AttributeOptions,
  type ModelOptions,
  type RelationshipDef,
  type RelationshipOptions,
} from './types.js';

/**
 * Returns the own-prototype attribute map for `target`, creating one if it
 * doesn't exist yet.  We deliberately avoid inheriting the parent map so each
 * class level stores only its own declarations; `SchemaService.walkPrototypeChain`
 * handles merging.
 */
function getOwnAttrMap(target: object): Map<string, AttributeDef> {
  let map = Reflect.getOwnMetadata(ATTRIBUTES_META_KEY, target) as
    | Map<string, AttributeDef>
    | undefined;
  if (!map) {
    map = new Map();
    Reflect.defineMetadata(ATTRIBUTES_META_KEY, map, target);
  }
  return map;
}

/**
 * Returns the own-prototype relationship map for `target`, creating one if
 * it doesn't exist yet.
 */
function getOwnRelMap(target: object): Map<string, RelationshipDef> {
  let map = Reflect.getOwnMetadata(RELATIONSHIPS_META_KEY, target) as
    | Map<string, RelationshipDef>
    | undefined;
  if (!map) {
    map = new Map();
    Reflect.defineMetadata(RELATIONSHIPS_META_KEY, map, target);
  }
  return map;
}

/**
 * Marks a class property as a serializable attribute.
 *
 * @example
 * ```ts
 * @attr('string') name!: string;
 * @attr('number', { defaultValue: 0 }) age!: number;
 * @attr({ defaultValue: () => [] }) tags!: string[];
 * ```
 */
export function attr(
  type?: string | null,
  options?: AttributeOptions,
): PropertyDecorator;
export function attr(options: AttributeOptions): PropertyDecorator;
export function attr(
  typeOrOptions?: string | null | AttributeOptions,
  options?: AttributeOptions,
): PropertyDecorator {
  let resolvedType: string | null = null;
  let resolvedOptions: AttributeOptions = {};

  if (typeof typeOrOptions === 'string') {
    resolvedType = typeOrOptions;
    resolvedOptions = options ?? {};
  } else if (typeOrOptions === null) {
    resolvedType = null;
    resolvedOptions = options ?? {};
  } else if (typeof typeOrOptions === 'object' && typeOrOptions !== null) {
    resolvedOptions = typeOrOptions;
  }

  return (target, propertyKey) => {
    const map = getOwnAttrMap(target as object);
    map.set(propertyKey as string, {
      name: propertyKey as string,
      type: resolvedType,
      options: resolvedOptions,
      isAttribute: true,
    });
  };
}

/**
 * Builds and returns a `PropertyDecorator` that registers a relationship
 * definition on the class prototype.  Shared by `@belongsTo` and `@hasMany`.
 *
 * Options are normalised with sensible defaults so consumers can rely on
 * `async`, `inverse`, and `polymorphic` always being present.
 */
function makeRelationship(
  kind: 'belongsTo' | 'hasMany',
  type: string,
  options: RelationshipOptions = {},
): PropertyDecorator {
  const normalized: RelationshipOptions = {
    async: options.async ?? false,
    inverse: options.inverse === undefined ? null : options.inverse,
    polymorphic: options.polymorphic ?? false,
    ...options,
  };
  return (target, propertyKey) => {
    const map = getOwnRelMap(target as object);
    map.set(propertyKey as string, {
      name: propertyKey as string,
      kind,
      type,
      options: normalized,
      isRelationship: true,
    });
  };
}

/**
 * Declares a `belongsTo` (many-to-one) association.
 *
 * @param type    - `modelName` of the related model.
 * @param options - Optional relationship options (async, inverse, …).
 *
 * @example
 * ```ts
 * @belongsTo('user') author!: User;
 * ```
 */
export function belongsTo(
  type: string,
  options: RelationshipOptions = {},
): PropertyDecorator {
  return makeRelationship('belongsTo', type, options);
}

/**
 * Declares a `hasMany` (one-to-many) association.
 *
 * @param type    - `modelName` of the related model.
 * @param options - Optional relationship options (async, inverse, …).
 *
 * @example
 * ```ts
 * @hasMany('comment') comments!: Comment[];
 * ```
 */
export function hasMany(
  type: string,
  options: RelationshipOptions = {},
): PropertyDecorator {
  return makeRelationship('hasMany', type, options);
}

/**
 * Class decorator that attaches model options (name, abstract, discriminator)
 * as reflect-metadata on the constructor.  `SchemaService.registerModel` reads
 * this metadata at registration time.
 *
 * @example
 * ```ts
 * @model({
 *   name: 'vehicle',
 *   abstract: true,
 *   discriminator: {
 *     key: 'type',
 *     map: { car: () => Car, motorcycle: () => Motorcycle },
 *   },
 * })
 * abstract class Vehicle extends Model { … }
 * ```
 */
export function model(options: ModelOptions = {}): ClassDecorator {
  return (target) => {
    if (options.name) {
      (target as unknown as { modelName: string }).modelName = options.name;
    }
    Reflect.defineMetadata(MODEL_OPTIONS_META_KEY, options, target);
  };
}
