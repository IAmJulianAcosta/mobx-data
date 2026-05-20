/**
 * Transform that converts between arbitrary wire values and numbers.
 *
 * Deserialization / serialization coercions (identical in both directions):
 * - `null` / `undefined` / `''` → `null`
 * - finite `number` → passed through
 * - non-finite `number` (NaN, Infinity) → `null`
 * - `string` → trimmed and parsed; `null` when the result is not finite
 * - anything else → `null`
 */
import { BaseTransform } from './Transform.js';
export declare class NumberTransform extends BaseTransform<unknown, number | null> {
    static coerce(value: unknown): number | null;
    deserialize(serialized: unknown): number | null;
    serialize(deserialized: number | null): unknown;
}
//# sourceMappingURL=number.d.ts.map