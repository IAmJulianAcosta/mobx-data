import type { Store } from '@mobx-data/store';
import type { Model } from '@mobx-data/model';
import type { LocalAiTool, LocalAiQueryResult, GetUserProfileArguments } from '../LocalAiTypes.js';
export declare class GetUserProfileTool implements LocalAiTool<GetUserProfileArguments, Model> {
    readonly name: "get_user_profile";
    execute(arguments_: GetUserProfileArguments, store: Store): Promise<LocalAiQueryResult<Model>>;
}
//# sourceMappingURL=GetUserProfileTool.d.ts.map