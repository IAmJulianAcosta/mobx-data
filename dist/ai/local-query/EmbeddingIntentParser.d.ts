import type { GenericIntent, LocalAiIntent, LocalAiIntentParser, SchemaIntrospectionResult } from './LocalAiTypes.js';
export interface EmbeddingProgressReport {
    progress: number;
    status: string;
    file?: string;
}
export interface EmbeddingIntentParserOptions {
    modelId?: string;
    onProgress?: (report: EmbeddingProgressReport) => void;
    similarityThreshold?: number;
}
export declare class EmbeddingIntentParser implements LocalAiIntentParser {
    private pipeline;
    private initializationPromise;
    private categories;
    private readonly introspection;
    private readonly modelId;
    private readonly onProgress?;
    private readonly similarityThreshold;
    constructor(introspection: SchemaIntrospectionResult, options?: EmbeddingIntentParserOptions);
    initialize(): Promise<void>;
    dispose(): Promise<void>;
    get isLoaded(): boolean;
    parse(query: string): Promise<LocalAiIntent<GenericIntent> | null>;
    private loadAndEmbed;
    private embed;
    private classifyIntent;
    private dotProduct;
    private resolveIntent;
    private findTypeMentions;
    private findTypeWithAttribute;
    private findTypesWithTitleAttribute;
    private findTypesWithNameAttribute;
    private findBelongsToType;
    private findTypeWithBelongsTo;
    private resolveFilterByName;
    private resolveFilterByTitle;
    private resolveWhoCreated;
    private resolveWhoInteracted;
    private resolveMultiHop;
    private resolveSearch;
    private resolveListRecent;
    private resolveProfile;
    private extractValueAfterPreposition;
    private extractTitleValue;
    private extractCreatedValue;
    private extractSearchText;
    private extractLimit;
}
//# sourceMappingURL=EmbeddingIntentParser.d.ts.map