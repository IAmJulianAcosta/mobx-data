import type { Store } from '@mobx-data/store';
import type { Model } from '@mobx-data/model';
import type { LocalAiTool, LocalAiQueryResult, GetCommentsByUserArguments } from '../LocalAiTypes.js';
export declare class GetCommentsByUserTool implements LocalAiTool<GetCommentsByUserArguments, Model[]> {
    readonly name: "get_comments_by_user";
    execute(arguments_: GetCommentsByUserArguments, store: Store): Promise<LocalAiQueryResult<Model[]>>;
}
//# sourceMappingURL=GetCommentsByUserTool.d.ts.map