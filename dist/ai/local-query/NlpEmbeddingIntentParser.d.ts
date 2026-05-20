import type { GenericIntent, LocalAiIntent, LocalAiIntentParser, SchemaIntrospectionResult } from './LocalAiTypes.js';
export interface NlpEmbeddingProgressReport {
    progress: number;
    status: string;
    file?: string;
}
export interface NlpEmbeddingIntentParserOptions {
    modelId?: string;
    onProgress?: (report: NlpEmbeddingProgressReport) => void;
    similarityThreshold?: number;
}
export declare class NlpEmbeddingIntentParser implements LocalAiIntentParser {
    private pipeline;
    private initializationPromise;
    private templates;
    private readonly introspection;
    private readonly modelId;
    private readonly onProgress?;
    private readonly similarityThreshold;
    private nlp;
    constructor(introspection: SchemaIntrospectionResult, options?: NlpEmbeddingIntentParserOptions);
    initialize(): Promise<void>;
    dispose(): Promise<void>;
    get isLoaded(): boolean;
    parse(query: string): Promise<LocalAiIntent<GenericIntent> | null>;
    private loadModelsAndTemplates;
    private generateTemplates;
    private makeFilterByNameTemplates;
    private makeOnAboutTemplates;
    private makeCompoundTemplates;
    private makeSearchTemplates;
    private makeListRecentTemplates;
    private makeProfileTemplates;
    private makeMultiHopTemplates;
    private makeWhoCreatedTemplates;
    private makeWhoInteractedTemplates;
    private makeUnsupportedTemplates;
    private findBestTemplate;
    private buildIntent;
    private extractPersonName;
    private extractTitleValue;
    private extractSearchTerms;
    private extractLimit;
    private correctTypos;
    private buildTypeVocabulary;
    private damerauLevenshteinDistance;
    private stripTrailingTypeWords;
    private isLikelyName;
    private extractProperNounFallback;
    private escapeRegex;
    private embed;
    private dotProduct;
}
//# sourceMappingURL=NlpEmbeddingIntentParser.d.ts.map