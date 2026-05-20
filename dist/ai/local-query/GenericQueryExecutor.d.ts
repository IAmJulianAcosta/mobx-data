import type { Store } from '@mobx-data/store';
import { type DataSourceMode, type GenericIntent, type LocalAiQueryResult, type SchemaIntrospectionResult } from './LocalAiTypes.js';
export declare class GenericQueryExecutor {
    private readonly introspection;
    private readonly dataSourceMode;
    constructor(introspection: SchemaIntrospectionResult, dataSourceMode?: DataSourceMode);
    execute(intent: GenericIntent, store: Store): Promise<LocalAiQueryResult>;
    private executeSearch;
    private executeList;
    private executeSelfFilter;
    private executeTraversal;
    private findByAttribute;
    private followRelationship;
    private findPath;
    private deduplicateRecords;
    private resolveRecords;
}
//# sourceMappingURL=GenericQueryExecutor.d.ts.map