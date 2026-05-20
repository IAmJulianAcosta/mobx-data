/**
 * Observable collection of validation error messages keyed by attribute name.
 *
 * `Errors` is attached to every `Model` instance as `record.errors`.  It
 * mirrors Ember Data's `DS.Errors` API: each attribute can hold multiple
 * `ErrorMessage` objects, and the map is MobX-observable so templates / computed
 * properties that read `isEmpty` or `length` react automatically when errors
 * are added or cleared.
 *
 * Typical lifecycle:
 *   1. Server returns a 422; the serializer calls `store.errors.add(…)`.
 *   2. The UI reads `record.errors.get('email')` to display messages.
 *   3. The user corrects the field; `record.errors.remove('email')` clears it.
 *   4. A successful save calls `record.errors.clear()` to wipe all messages.
 */
/** A single validation error for one attribute. */
export interface ErrorMessage {
    /** Attribute name the error belongs to. */
    attribute: string;
    /** Human-readable error message. */
    message: string;
}
export declare class Errors implements Iterable<[string, ErrorMessage[]]> {
    private _errors;
    constructor();
    /** `true` when there are no validation errors. */
    get isEmpty(): boolean;
    /** Total number of error messages across all attributes. */
    get length(): number;
    /** Returns all error messages for `attribute`, or an empty array. */
    get(attribute: string): ErrorMessage[];
    /** Returns `true` when `attribute` has at least one error message. */
    has(attribute: string): boolean;
    /**
     * Appends one or more error messages for `attribute`.
     * Existing messages are preserved — this is an additive operation.
     */
    add(attribute: string, message: string | string[]): void;
    /** Removes all error messages for `attribute`. */
    remove(attribute: string): void;
    /** Removes all error messages for every attribute. */
    clear(): void;
    /** Iterates `[attributeName, ErrorMessage[]]` pairs. */
    [Symbol.iterator](): Iterator<[string, ErrorMessage[]]>;
}
//# sourceMappingURL=Errors.d.ts.map