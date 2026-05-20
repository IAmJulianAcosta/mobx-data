import type { Store } from '@mobx-data/store';
import type { Model } from '@mobx-data/model';
import type { LocalAiTool, LocalAiQueryResult, GetPostsByUserArguments } from '../LocalAiTypes.js';
export declare class GetPostsByUserTool implements LocalAiTool<GetPostsByUserArguments, Model[]> {
    readonly name: "get_posts_by_user";
    execute(arguments_: GetPostsByUserArguments, store: Store): Promise<LocalAiQueryResult<Model[]>>;
}
//# sourceMappingURL=GetPostsByUserTool.d.ts.map