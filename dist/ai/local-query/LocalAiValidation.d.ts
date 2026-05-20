import type { LocalAiQueryResult, GetPostsByUserArguments, GetUserProfileArguments, GetCommentsByPostArguments, SearchPostsArguments, GetRecentPostsArguments } from './LocalAiTypes.js';
export declare function validateUserArguments(arguments_: GetPostsByUserArguments | GetUserProfileArguments): LocalAiQueryResult | null;
export declare function validatePostArguments(arguments_: GetCommentsByPostArguments): LocalAiQueryResult | null;
export declare function validateSearchArguments(arguments_: SearchPostsArguments): LocalAiQueryResult | null;
export declare function normalizeLimit(arguments_: GetRecentPostsArguments): number;
//# sourceMappingURL=LocalAiValidation.d.ts.map