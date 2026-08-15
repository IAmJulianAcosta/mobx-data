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

import { injectable } from 'tsyringe';
import {
  makeObservable, computed, action,
} from 'mobx';
import { observableShallow } from '../mobxCompatibility.js';

/** A single validation error for one attribute. */
export interface ErrorMessage {
  /** Attribute name the error belongs to. */
  attribute: string;
  /** Human-readable error message. */
  message: string;
}

@injectable()
export class Errors implements Iterable<[string, ErrorMessage[]]> {
  private _errors: Map<string, ErrorMessage[]> = new Map();

  constructor() {
    makeObservable<this, '_errors'>(this, {
      _errors: observableShallow,
      isEmpty: computed,
      length: computed,
      add: action,
      remove: action,
      clear: action,
    });
  }

  /** `true` when there are no validation errors. */
  get isEmpty(): boolean {
    return this._errors.size === 0;
  }

  /** Total number of error messages across all attributes. */
  get length(): number {
    let total = 0;
    for (const messages of this._errors.values()) {
      total += messages.length;
    }
    return total;
  }

  /** Returns all error messages for `attribute`, or an empty array. */
  get(attribute: string): ErrorMessage[] {
    return this._errors.get(attribute) ?? [];
  }

  /** Returns `true` when `attribute` has at least one error message. */
  has(attribute: string): boolean {
    const messages = this._errors.get(attribute);
    return !!messages && messages.length > 0;
  }

  /**
   * Appends one or more error messages for `attribute`.
   * Existing messages are preserved — this is an additive operation.
   */
  add(attribute: string, message: string | string[]): void {
    const incoming = Array.isArray(message) ? message : [message];
    const existing = this._errors.get(attribute) ?? [];
    const next: ErrorMessage[] = [
      ...existing,
      ...incoming.map((msg) => ({ attribute, message: msg })),
    ];
    this._errors.set(attribute, next);
  }

  /** Removes all error messages for `attribute`. */
  remove(attribute: string): void {
    this._errors.delete(attribute);
  }

  /** Removes all error messages for every attribute. */
  clear(): void {
    this._errors.clear();
  }

  /** Iterates `[attributeName, ErrorMessage[]]` pairs. */
  * [Symbol.iterator](): Iterator<[string, ErrorMessage[]]> {
    for (const entry of this._errors.entries()) {
      yield entry;
    }
  }
}
