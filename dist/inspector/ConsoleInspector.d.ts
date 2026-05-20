import type { Model } from '@mobx-data/model';
import type { Store } from '@mobx-data/store';
import { StoreInspector } from './StoreInspector.js';
import type { RecordSummary, RecordDetail, StoreSummary, SchemaInfo } from './types.js';
export type RecordResult = Model & {
    show(): void;
    toJSON(): Record<string, unknown>;
    inspect(): RecordDetail;
    summary(): RecordSummary;
};
export type ResultSet = RecordResult[] & {
    show(): void;
    toJSON(): Array<Record<string, unknown>>;
};
interface Showable {
    show(): void;
}
export declare class ConsoleInspector {
    private readonly inspector;
    private readonly storeName;
    constructor(store: Store, name?: string);
    summary(): StoreSummary & Showable;
    records(modelName: string): ResultSet;
    record(modelName: string, id: string): RecordResult | null;
    query(text: string): ResultSet;
    dirty(): ResultSet;
    newRecords(): ResultSet;
    saving(): ResultSet;
    errored(): ResultSet;
    private collectModels;
    schema(modelName: string): SchemaInfo & Showable;
    types(): string[] & Showable;
    snapshot(): unknown;
    observe(): () => void;
    raw(): StoreInspector;
    command(input: string): unknown;
    help(): void;
    private isQueryCommand;
    private resolveModelCommand;
    private wrapModel;
    private createResultSet;
    private renderSummary;
    private renderRecords;
    private renderRecordDetail;
    private renderSchema;
    private renderFilteredRecords;
}
export {};
//# sourceMappingURL=ConsoleInspector.d.ts.map