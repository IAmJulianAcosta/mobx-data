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
/** All valid states the record can be in. */
export type RecordState = 'root.empty' | 'root.loading' | 'root.loaded.saved' | 'root.loaded.created.uncommitted' | 'root.loaded.created.inFlight' | 'root.loaded.updated.uncommitted' | 'root.loaded.updated.inFlight' | 'root.deleted.uncommitted' | 'root.deleted.inFlight' | 'root.deleted.saved' | 'root.error';
/** Events that trigger state transitions. */
export type RecordEvent = 'loadingData' | 'pushedData' | 'becameError' | 'didSetProperty' | 'willCommit' | 'didCommit' | 'becameInvalid' | 'deleteRecord' | 'rolledBack' | 'unloadRecord';
export declare class StateMachine {
    /** The current state of the record.  Observable so computed props react. */
    current: RecordState;
    constructor(initial?: RecordState);
    /**
     * Applies `event` to the current state, updates `current`, and returns the
     * new state.
     *
     * @throws `Error` when `event` is not permitted from the current state.
     */
    transition(event: RecordEvent): RecordState;
}
//# sourceMappingURL=StateMachine.d.ts.map