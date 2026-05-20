/**
 * Transform that converts between arbitrary wire values and strings.
 *
 * Deserialization:
 * - `null` / `undefined` → `null`
 * - `string` → passed through
 * - anything else → `String(value)`
 *
 * Serialization:
 * - `null` / `undefined` → `null`
 * - anything else → `String(value)`
 */
import { BaseTransform } from './Transform.js';
export declare class StringTransform extends BaseTransform<unknown, string | null> {
    deserialize(serialized: unknown): string | null;
    serialize(deserialized: string | null): unknown;
}
//# sourceMappingURL=string.d.ts.map