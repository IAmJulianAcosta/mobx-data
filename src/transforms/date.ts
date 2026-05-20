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

import { injectable } from 'tsyringe';
import { BaseTransform } from './Transform.js';

@injectable()
export class DateTransform extends BaseTransform<unknown, Date | null> {
  deserialize(serialized: unknown): Date | null {
    if (serialized === null || serialized === undefined || serialized === '') {
      return null;
    }
    if (serialized instanceof Date) {
      return Number.isNaN(serialized.getTime()) ? null : serialized;
    }
    if (typeof serialized === 'number' || typeof serialized === 'string') {
      const parsed = new Date(serialized);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }

  serialize(deserialized: Date | null): unknown {
    if (deserialized === null || deserialized === undefined) {
      return null;
    }
    if (deserialized instanceof Date) {
      return Number.isNaN(deserialized.getTime())
        ? null
        : deserialized.toISOString();
    }
    return null;
  }
}
