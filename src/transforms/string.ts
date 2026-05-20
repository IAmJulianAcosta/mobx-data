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

import { injectable } from 'tsyringe';
import { BaseTransform } from './Transform.js';

@injectable()
export class StringTransform extends BaseTransform<unknown, string | null> {
  deserialize(serialized: unknown): string | null {
    if (serialized === null || serialized === undefined) {
      return null;
    }
    if (typeof serialized === 'string') {
      return serialized;
    }
    return String(serialized);
  }

  serialize(deserialized: string | null): unknown {
    if (deserialized === null || deserialized === undefined) {
      return null;
    }
    return String(deserialized);
  }
}
