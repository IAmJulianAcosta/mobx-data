import type { Store } from '@mobx-data/store';
import type { DataSourceMode, LocalAiQueryResult } from './LocalAiTypes.js';
import { type WebLlmIntentParserOptions } from './WebLlmIntentParser.js';
import { type TransformersJsIntentParserOptions } from './TransformersJsIntentParser.js';
import { type EmbeddingIntentParserOptions } from './EmbeddingIntentParser.js';
export type SchemaParserMode = 'deterministic' | 'webllm' | 'transformers' | 'embedding' | 'cascade' | 'cascade-transformers';
export interface LocalAiSchemaQueryServiceOptions {
    parserMode?: SchemaParserMode;
    dataSourceMode?: DataSourceMode;
    webLlmOptions?: Partial<WebLlmIntentParserOptions>;
    transformersOptions?: Partial<TransformersJsIntentParserOptions>;
    embeddingOptions?: Partial<EmbeddingIntentParserOptions>;
}
export declare class LocalAiSchemaQueryService {
    private readonly service;
    private readonly webLlmParser;
    private readonly transformersParser;
    private readonly embeddingParser;
    constructor(store: Store, options?: LocalAiSchemaQueryServiceOptions);
    query(query: string): Promise<LocalAiQueryResult>;
    queryFormatted(query: string): Promise<{
        result: LocalAiQueryResult;
        formatted: string;
    }>;
    initializeWebLlm(): Promise<void>;
    initializeTransformers(): Promise<void>;
    initializeEmbedding(): Promise<void>;
    initializeModel(): Promise<void>;
    get isWebLlmLoaded(): boolean;
    get isTransformersLoaded(): boolean;
    get isEmbeddingLoaded(): boolean;
    get isModelLoaded(): boolean;
    dispose(): Promise<void>;
}
//# sourceMappingURL=LocalAiSchemaQueryService.d.ts.map