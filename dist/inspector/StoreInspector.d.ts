import type { Model } from '@mobx-data/model';
import type { Store } from '@mobx-data/store';
import type { StoreSummary, RecordSummary, RecordDetail, SchemaInfo, InspectorChangeEvent } from './types.js';
export declare class StoreInspector {
    private readonly store;
    constructor(store: Store);
    summary(): StoreSummary;
    records(modelName: string): RecordSummary[];
    record(modelName: string, id: string): RecordDetail | null;
    dirty(): RecordSummary[];
    newRecords(): RecordSummary[];
    errored(): RecordSummary[];
    saving(): RecordSummary[];
    schema(modelName: string): SchemaInfo;
    types(): string[];
    query(text: string): Model[];
    queryWithMeta(text: string): {
        modelName: string;
        results: Model[];
    };
    liveModels(modelName: string): Model[];
    liveModel(modelName: string, id: string): Model | null;
    snapshot(): {
        records: Record<string, unknown[]>;
    };
    observe(callback: (event: InspectorChangeEvent) => void): () => void;
    private allRecordsWhere;
    private captureState;
    private diffAndEmit;
}
//# sourceMappingURL=StoreInspector.d.ts.map