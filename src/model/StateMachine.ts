/**
 * Finite-state machine that tracks the lifecycle of a single model record.
 *
 * States are organised in a dot-separated hierarchy that mirrors Ember Data's
 * record state machine.  The transition table (`TABLE`) is the single source
 * of truth; illegal transitions throw immediately rather than silently
 * degrading into an unexpected state.
 *
 * State hierarchy overview:
 * ```
 * root.empty
 * root.loading
 * root.loaded
 *   .saved
 *   .created.uncommitted  ← new record, not yet sent to server
 *   .created.inFlight     ← POST in progress
 *   .updated.uncommitted  ← dirty record, not yet sent to server
 *   .updated.inFlight     ← PUT/PATCH in progress
 * root.deleted
 *   .uncommitted          ← deleteRecord() called locally
 *   .inFlight             ← DELETE in progress
 *   .saved                ← server confirmed deletion
 * root.error              ← adapter threw an unrecoverable error
 * ```
 *
 * `current` is MobX-observable so computed properties that depend on
 * `isNew`, `isDirty`, etc. react automatically.
 */

import { makeObservable, observable, action } from 'mobx';

/** All valid states the record can be in. */
export type RecordState =
  | 'root.empty'
  | 'root.loading'
  | 'root.loaded.saved'
  | 'root.loaded.created.uncommitted'
  | 'root.loaded.created.inFlight'
  | 'root.loaded.updated.uncommitted'
  | 'root.loaded.updated.inFlight'
  | 'root.deleted.uncommitted'
  | 'root.deleted.inFlight'
  | 'root.deleted.saved'
  | 'root.error';

/** Events that trigger state transitions. */
export type RecordEvent =
  | 'loadingData'
  | 'pushedData'
  | 'becameError'
  | 'didSetProperty'
  | 'willCommit'
  | 'didCommit'
  | 'becameInvalid'
  | 'deleteRecord'
  | 'rolledBack'
  | 'unloadRecord';

/** Per-state map of allowed events → destination states. */
type Transitions = Partial<Record<RecordEvent, RecordState>>;

/** Complete transition table.  A missing entry means the transition is invalid. */
const TABLE: Record<RecordState, Transitions> = {
  'root.empty': {
    loadingData: 'root.loading',
    pushedData: 'root.loaded.saved',
  },
  'root.loading': {
    pushedData: 'root.loaded.saved',
    becameError: 'root.error',
  },
  'root.loaded.saved': {
    didSetProperty: 'root.loaded.updated.uncommitted',
    deleteRecord: 'root.deleted.uncommitted',
    loadingData: 'root.loading',
    pushedData: 'root.loaded.saved',
    unloadRecord: 'root.empty',
  },
  'root.loaded.created.uncommitted': {
    willCommit: 'root.loaded.created.inFlight',
    rolledBack: 'root.empty',
    deleteRecord: 'root.deleted.uncommitted',
    didSetProperty: 'root.loaded.created.uncommitted',
    unloadRecord: 'root.empty',
  },
  'root.loaded.created.inFlight': {
    didCommit: 'root.loaded.saved',
    becameInvalid: 'root.loaded.created.uncommitted',
    becameError: 'root.error',
  },
  'root.loaded.updated.uncommitted': {
    willCommit: 'root.loaded.updated.inFlight',
    rolledBack: 'root.loaded.saved',
    didSetProperty: 'root.loaded.updated.uncommitted',
    deleteRecord: 'root.deleted.uncommitted',
    unloadRecord: 'root.empty',
  },
  'root.loaded.updated.inFlight': {
    didCommit: 'root.loaded.saved',
    becameInvalid: 'root.loaded.updated.uncommitted',
    becameError: 'root.error',
  },
  'root.deleted.uncommitted': {
    willCommit: 'root.deleted.inFlight',
    rolledBack: 'root.loaded.saved',
    unloadRecord: 'root.empty',
  },
  'root.deleted.inFlight': {
    didCommit: 'root.deleted.saved',
    becameError: 'root.error',
  },
  'root.deleted.saved': {
    unloadRecord: 'root.empty',
  },
  'root.error': {
    rolledBack: 'root.loaded.saved',
    unloadRecord: 'root.empty',
  },
};

export class StateMachine {
  /** The current state of the record.  Observable so computed props react. */
  current: RecordState;

  constructor(initial: RecordState = 'root.empty') {
    this.current = initial;
    makeObservable(this, {
      current: observable,
      transition: action,
    });
  }

  /**
   * Applies `event` to the current state, updates `current`, and returns the
   * new state.
   *
   * @throws `Error` when `event` is not permitted from the current state.
   */
  transition(event: RecordEvent): RecordState {
    const next = TABLE[this.current][event];
    if (!next) {
      throw new Error(
        `Invalid transition: event "${event}" not allowed from state "${this.current}"`,
      );
    }
    this.current = next;
    return next;
  }
}
