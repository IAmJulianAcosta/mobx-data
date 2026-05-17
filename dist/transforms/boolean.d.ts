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
import { BaseTransform } from './Transform.js';
/** Options accepted by `BooleanTransform`. */
export interface BooleanTransformOptions {
    /**
     * When `true`, `null` / `undefined` input is preserved as `null` rather
     * than coerced to `false`.
     */
    allowNull?: boolean;
}
export declare class BooleanTransform extends BaseTransform<unknown, boolean | null> {
    deserialize(serialized: unknown, options?: BooleanTransformOptions): boolean | null;
    serialize(deserialized: boolean | null, options?: BooleanTransformOptions): unknown;
}
//# sourceMappingURL=boolean.d.ts.map