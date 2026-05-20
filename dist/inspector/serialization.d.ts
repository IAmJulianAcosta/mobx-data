import type { Model } from '@mobx-data/model';
import type { Store } from '@mobx-data/store';
import type { RecordSummary, RecordDetail, SchemaInfo } from './types.js';
export declare function summarizeRecord(record: Model): RecordSummary;
export declare function detailRecord(record: Model): RecordDetail;
export declare function extractSchemaInfo(store: Store, modelName: string): SchemaInfo;
//# sourceMappingURL=serialization.d.ts.map