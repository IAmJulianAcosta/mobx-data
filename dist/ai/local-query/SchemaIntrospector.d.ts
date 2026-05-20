import type { SchemaService } from '@mobx-data/schema';
import type { SchemaIntrospectionResult } from './LocalAiTypes.js';
export declare class SchemaIntrospector {
    private readonly schema;
    constructor(schema: SchemaService);
    introspect(): SchemaIntrospectionResult;
    private buildTypeDescriptors;
    private buildRelationshipGraph;
    private buildStringAttributesMap;
    private generateSystemPrompt;
    private generateExamples;
    private findMultiHopExample;
    private generateTitleFilterExamples;
    private generateJsonSchema;
}
//# sourceMappingURL=SchemaIntrospector.d.ts.map