import type { Store } from '@mobx-data/store';
import type { LocalAiIntentParser, LocalAiQueryResult } from './LocalAiTypes.js';
import type { LocalAiToolRegistry } from './LocalAiToolRegistry.js';
import type { GenericQueryExecutor } from './GenericQueryExecutor.js';
import type { LocalAiResultFormatter } from './LocalAiResultFormatter.js';
export declare class LocalAiQueryService {
    private readonly parser;
    private readonly toolRegistry;
    private readonly executor;
    private readonly formatter;
    private readonly store;
    constructor(parser: LocalAiIntentParser, toolRegistry: LocalAiToolRegistry, formatter: LocalAiResultFormatter, store: Store);
    static createGeneric(parser: LocalAiIntentParser, executor: GenericQueryExecutor, formatter: LocalAiResultFormatter, store: Store): LocalAiQueryService;
    query(query: string): Promise<LocalAiQueryResult>;
    queryFormatted(query: string): Promise<{
        result: LocalAiQueryResult;
        formatted: string;
    }>;
}
//# sourceMappingURL=LocalAiQueryService.d.ts.map