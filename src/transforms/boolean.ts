/**
 * Transform that converts between arbitrary wire values and booleans.
 *
 * Deserialization coercions:
 * - `null` / `undefined` → `false` (or `null` when `allowNull: true`)
 * - `boolean` → passed through
 * - `number` → `true` only when the value is exactly `1`
 * - `string` → `true` for `'true'`, `'t'`, or `'1'` (case-insensitive)
 * - anything else → `Boolean(value)`
 *
 * Serialization: `Boolean(value)` (preserves `null` when `allowNull: true`).
 */

import { injectable } from 'tsyringe';
import { BaseTransform } from './Transform.js';

/** Options accepted by `BooleanTransform`. */
export interface BooleanTransformOptions {
  /**
   * When `true`, `null` / `undefined` input is preserved as `null` rather
   * than coerced to `false`.
   */
  allowNull?: boolean;
}

@injectable()
export class BooleanTransform extends BaseTransform<unknown, boolean | null> {
  deserialize(
    serialized: unknown,
    options: BooleanTransformOptions = {},
  ): boolean | null {
    if (serialized === null || serialized === undefined) {
      return options.allowNull ? null : false;
    }
    if (typeof serialized === 'boolean') {
      return serialized;
    }
    if (typeof serialized === 'number') {
      return serialized === 1;
    }
    if (typeof serialized === 'string') {
      const normalized = serialized.toLowerCase();
      return normalized === 'true' || normalized === 't' || normalized === '1';
    }
    return Boolean(serialized);
  }

  serialize(
    deserialized: boolean | null,
    options: BooleanTransformOptions = {},
  ): unknown {
    if (deserialized === null || deserialized === undefined) {
      return options.allowNull ? null : false;
    }
    return Boolean(deserialized);
  }
}
