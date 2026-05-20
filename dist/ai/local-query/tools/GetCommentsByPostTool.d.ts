import type { Store } from '@mobx-data/store';
import type { Model } from '@mobx-data/model';
import type { LocalAiTool, LocalAiQueryResult, GetCommentsByPostArguments } from '../LocalAiTypes.js';
export declare class GetCommentsByPostTool implements LocalAiTool<GetCommentsByPostArguments, Model[]> {
    readonly name: "get_comments_by_post";
    execute(arguments_: GetCommentsByPostArguments, store: Store): Promise<LocalAiQueryResult<Model[]>>;
}
//# sourceMappingURL=GetCommentsByPostTool.d.ts.map