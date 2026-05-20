import type { Store } from '@mobx-data/store';
import type { LocalAiIntentName, LocalAiIntent, LocalAiQueryResult, LocalAiTool } from './LocalAiTypes.js';
export declare class LocalAiToolRegistry {
    private readonly tools;
    register(tool: LocalAiTool): void;
    get(intent: LocalAiIntentName): LocalAiTool | undefined;
    execute(intent: LocalAiIntent, store: Store): Promise<LocalAiQueryResult>;
}
//# sourceMappingURL=LocalAiToolRegistry.d.ts.map