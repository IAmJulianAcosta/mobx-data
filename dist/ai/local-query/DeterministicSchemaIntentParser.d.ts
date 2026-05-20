import type { GenericIntent, LocalAiIntent, LocalAiIntentParser, SchemaIntrospectionResult } from './LocalAiTypes.js';
export declare class DeterministicSchemaIntentParser implements LocalAiIntentParser {
    private readonly rules;
    private readonly defaultContentType;
    private readonly personType;
    private readonly commentLikeType;
    constructor(introspection: SchemaIntrospectionResult);
    parse(query: string): Promise<LocalAiIntent<GenericIntent> | null>;
    private buildRules;
    private buildSelfFilterRules;
    private buildSingleHopTraversalRules;
    private buildMultiHopTraversalRules;
    private buildWhoCreatedRules;
    private buildCompoundFilterSearchRules;
    private buildOnAboutTraversalRules;
    private buildWhoTraversalRules;
    private buildSearchRules;
    private buildListRules;
    private findNameAttribute;
    private buildCatchAllRules;
    private findDefaultContentType;
    private findPersonType;
    private findCommentLikeType;
}
//# sourceMappingURL=DeterministicSchemaIntentParser.d.ts.map