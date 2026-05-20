import type { GenericIntent, LocalAiIntent, LocalAiIntentParser, SchemaIntrospectionResult } from './LocalAiTypes.js';
export declare class DeterministicSchemaIntentParser implements LocalAiIntentParser {
    private readonly rules;
    constructor(introspection: SchemaIntrospectionResult);
    parse(query: string): Promise<LocalAiIntent<GenericIntent> | null>;
    private buildRules;
    private buildSelfFilterRules;
    private buildSingleHopTraversalRules;
    private buildMultiHopTraversalRules;
    private buildWhoCreatedRules;
    private buildOnAboutTraversalRules;
    private buildWhoTraversalRules;
    private buildSearchRules;
    private buildListRules;
    private findNameAttribute;
}
//# sourceMappingURL=DeterministicSchemaIntentParser.d.ts.map