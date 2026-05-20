import type { LocalAiIntent, LocalAiIntentParser } from './LocalAiTypes.js';
export interface TransformersJsProgressReport {
    progress: number;
    status: string;
    file?: string;
}
export interface TransformersJsIntentParserOptions {
    modelId?: string;
    onProgress?: (report: TransformersJsProgressReport) => void;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    jsonSchema?: string;
    validTargets?: ReadonlySet<string>;
}
export declare class TransformersJsIntentParser implements LocalAiIntentParser {
    private generator;
    private initializationPromise;
    private readonly modelId;
    private readonly onProgress?;
    private readonly temperature;
    private readonly maxTokens;
    private readonly customSystemPrompt?;
    private readonly customJsonSchema?;
    private readonly validTargets?;
    constructor(options?: TransformersJsIntentParserOptions);
    initialize(): Promise<void>;
    dispose(): Promise<void>;
    get isLoaded(): boolean;
    get isGenericMode(): boolean;
    parse(query: string): Promise<LocalAiIntent | null>;
    private buildSystemPrompt;
    private extractContent;
    private cleanJsonResponse;
    private parseGenericResponse;
    private parseLegacyResponse;
    private parseNullableString;
    private parseNullableNumber;
    private loadPipeline;
}
//# sourceMappingURL=TransformersJsIntentParser.d.ts.map