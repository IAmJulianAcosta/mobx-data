import type { Store } from '@mobx-data/store';
import type { Model } from '@mobx-data/model';
import type { LocalAiTool, LocalAiQueryResult, GetRecentPostsArguments } from '../LocalAiTypes.js';
export declare class GetRecentPostsTool implements LocalAiTool<GetRecentPostsArguments, Model[]> {
    readonly name: "get_recent_posts";
    execute(arguments_: GetRecentPostsArguments, store: Store): Promise<LocalAiQueryResult<Model[]>>;
}
//# sourceMappingURL=GetRecentPostsTool.d.ts.map