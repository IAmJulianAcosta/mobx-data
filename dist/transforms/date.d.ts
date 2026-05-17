/**
 * Transform that converts between ISO 8601 strings (or numeric timestamps)
 * and JavaScript `Date` objects.
 *
 * Deserialization:
 * - `null` / `undefined` / `''` → `null`
 * - `Date` instance → returned as-is (or `null` when invalid)
 * - `number` (Unix ms) or `string` (ISO 8601) → parsed via `new Date(value)`,
 *   returns `null` when parsing yields `NaN`
 * - anything else → `null`
 *
 * Serialization:
 * - `null` / `undefined` → `null`
 * - `Date` instance → ISO 8601 string via `.toISOString()` (or `null` when invalid)
 * - anything else → `null`
 */
import { BaseTransform } from './Transform.js';
export declare class DateTransform extends BaseTransform<unknown, Date | null> {
    deserialize(serialized: unknown): Date | null;
    serialize(deserialized: Date | null): unknown;
}
//# sourceMappingURL=date.d.ts.map