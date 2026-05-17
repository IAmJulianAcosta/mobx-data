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

import { injectable } from 'tsyringe';
import { BaseTransform } from './Transform.js';

@injectable()
export class NumberTransform extends BaseTransform<unknown, number | null> {
  static coerce(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') {
        return null;
      }
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  deserialize(serialized: unknown): number | null {
    return NumberTransform.coerce(serialized);
  }

  serialize(deserialized: number | null): unknown {
    return NumberTransform.coerce(deserialized);
  }
}
