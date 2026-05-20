import type { Store } from '@mobx-data/store';
import type { Model } from '@mobx-data/model';
import type { LocalAiTool, LocalAiQueryResult, SearchPostsArguments } from '../LocalAiTypes.js';
export declare class SearchPostsTool implements LocalAiTool<SearchPostsArguments, Model[]> {
    readonly name: "search_posts";
    execute(arguments_: SearchPostsArguments, store: Store): Promise<LocalAiQueryResult<Model[]>>;
}
//# sourceMappingURL=SearchPostsTool.d.ts.map