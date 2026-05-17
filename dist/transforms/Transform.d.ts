/**
 * Interface and abstract base class for data transforms.
 *
 * A transform converts attribute values between the wire format used by the
 * server (External) and the in-memory format used by the application
 * (Internal).
 *
 * - `deserialize` — called when the store receives data from the server
 *   (normalize direction, server → app).
 * - `serialize` — called when the store sends data to the server
 *   (serialize direction, app → server).
 *
 * Built-in transforms: `StringTransform`, `NumberTransform`,
 * `BooleanTransform`, `DateTransform`.
 *
 * Custom transforms can be implemented by extending `BaseTransform`:
 *
 * ```ts
 * @injectable()
 * class UpperCaseTransform extends BaseTransform<string, string> {
 *   deserialize(value: string) { return value.toUpperCase(); }
 *   serialize(value: string)   { return value.toLowerCase(); }
 * }
 * ```
 */
/** Bidirectional value converter for a single attribute type. */
export interface Transform<External = unknown, Internal = unknown> {
    /**
     * Converts a raw server value to the application-side type.
     * @param serialized - Raw value as it arrived from the server.
     * @param options    - Extra options forwarded from the `@attr` decorator.
     */
    deserialize(serialized: External, options?: Record<string, unknown>): Internal;
    /**
     * Converts an application-side value back to the wire format.
     * @param deserialized - Current in-memory value.
     * @param options      - Extra options forwarded from the `@attr` decorator.
     */
    serialize(deserialized: Internal, options?: Record<string, unknown>): External;
}
/**
 * Convenience abstract class that implements `Transform` and can be extended
 * to create custom transforms without repeating the interface declaration.
 */
export declare abstract class BaseTransform<External = unknown, Internal = unknown> implements Transform<External, Internal> {
    abstract deserialize(serialized: External, options?: Record<string, unknown>): Internal;
    abstract serialize(deserialized: Internal, options?: Record<string, unknown>): External;
}
//# sourceMappingURL=Transform.d.ts.map