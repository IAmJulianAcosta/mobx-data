import type { GenericIntent, LocalAiIntent, LocalAiIntentParser, SchemaIntrospectionResult } from './LocalAiTypes.js';
export interface SchemaLlmProgressReport {
    progress: number;
    status: string;
    file?: string;
}
export interface SchemaLlmIntentParserOptions {
    modelId?: string;
    device?: string | null;
    dtype?: string;
    onProgress?: (report: SchemaLlmProgressReport) => void;
    temperature?: number;
    maxTokens?: number;
}
export declare class SchemaLlmIntentParser implements LocalAiIntentParser {
    private generator;
    private initializationPromise;
    private readonly introspection;
    private readonly modelId;
    private readonly device;
    private readonly dtype;
    private readonly onProgress?;
    private readonly temperature;
    private readonly maxTokens;
    constructor(introspection: SchemaIntrospectionResult, options?: SchemaLlmIntentParserOptions);
    initialize(): Promise<void>;
    dispose(): Promise<void>;
    get isLoaded(): boolean;
    parse(query: string): Promise<LocalAiIntent<GenericIntent> | null>;
    private extractContent;
    private cleanJsonResponse;
    private parseResponse;
    private parseNullableString;
    private parseNullableNumber;
    private loadPipeline;
}
//# sourceMappingURL=SchemaLlmIntentParser.d.ts.map