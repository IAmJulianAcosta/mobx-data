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
import { type AttributeOptions, type ModelOptions, type RelationshipOptions } from './types.js';
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
export declare function attr(type?: string | null, options?: AttributeOptions): PropertyDecorator;
export declare function attr(options: AttributeOptions): PropertyDecorator;
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
export declare function belongsTo(type: string, options?: RelationshipOptions): PropertyDecorator;
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
export declare function hasMany(type: string, options?: RelationshipOptions): PropertyDecorator;
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
export declare function model(options?: ModelOptions): ClassDecorator;
//# sourceMappingURL=decorators.d.ts.map