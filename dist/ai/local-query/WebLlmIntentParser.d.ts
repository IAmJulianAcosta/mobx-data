import type { LocalAiIntent, LocalAiIntentParser } from './LocalAiTypes.js';
export interface WebLlmProgressReport {
    progress: number;
    timeElapsed: number;
    text: string;
}
export interface WebLlmIntentParserOptions {
    modelId?: string;
    onProgress?: (report: WebLlmProgressReport) => void;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    jsonSchema?: string;
    validTargets?: ReadonlySet<string>;
}
export declare class WebLlmIntentParser implements LocalAiIntentParser {
    private engine;
    private initializationPromise;
    private readonly modelId;
    private readonly onProgress?;
    private readonly temperature;
    private readonly maxTokens;
    private readonly customSystemPrompt?;
    private readonly customJsonSchema?;
    private readonly validTargets?;
    constructor(options?: WebLlmIntentParserOptions);
    initialize(): Promise<void>;
    dispose(): Promise<void>;
    get isLoaded(): boolean;
    get isGenericMode(): boolean;
    parse(query: string): Promise<LocalAiIntent | null>;
    private parseGenericResponse;
    private parseLegacyResponse;
    private parseNullableString;
    private parseNullableNumber;
    private loadEngine;
}
//# sourceMappingURL=WebLlmIntentParser.d.ts.map