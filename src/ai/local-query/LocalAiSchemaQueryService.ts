import type { Store } from '@mobx-data/store';
import type {
  DataSourceMode,
  LocalAiIntentParser,
  LocalAiQueryResult,
} from './LocalAiTypes.js';
import { SchemaIntrospector } from './SchemaIntrospector.js';
import { GenericQueryExecutor } from './GenericQueryExecutor.js';
import { DeterministicSchemaIntentParser } from './DeterministicSchemaIntentParser.js';
import {
  WebLlmIntentParser,
  type WebLlmIntentParserOptions,
} from './WebLlmIntentParser.js';
import {
  TransformersJsIntentParser,
  type TransformersJsIntentParserOptions,
} from './TransformersJsIntentParser.js';
import {
  EmbeddingIntentParser,
  type EmbeddingIntentParserOptions,
} from './EmbeddingIntentParser.js';
import { CascadeLocalAiIntentParser } from './CascadeLocalAiIntentParser.js';
import { LocalAiQueryService } from './LocalAiQueryService.js';
import { LocalAiResultFormatter } from './LocalAiResultFormatter.js';

export type SchemaParserMode = 'deterministic' | 'webllm' | 'transformers' | 'embedding' | 'cascade' | 'cascade-transformers' | 'cascade-embedding';

export interface LocalAiSchemaQueryServiceOptions {
  parserMode?: SchemaParserMode;
  dataSourceMode?: DataSourceMode;
  webLlmOptions?: Partial<WebLlmIntentParserOptions>;
  transformersOptions?: Partial<TransformersJsIntentParserOptions>;
  embeddingOptions?: Partial<EmbeddingIntentParserOptions>;
}

export class LocalAiSchemaQueryService {
  private readonly service: LocalAiQueryService;
  private readonly webLlmParser: WebLlmIntentParser | null;
  private readonly transformersParser: TransformersJsIntentParser | null;
  private readonly embeddingParser: EmbeddingIntentParser | null;

  constructor(store: Store, options: LocalAiSchemaQueryServiceOptions = {}) {
    const introspector = new SchemaIntrospector(store.schema);
    const introspection = introspector.introspect();

    const executor = new GenericQueryExecutor(
      introspection,
      options.dataSourceMode ?? 'local',
    );
    const formatter = new LocalAiResultFormatter();

    const deterministicParser = new DeterministicSchemaIntentParser(introspection);
    const validTargets = new Set(introspection.typeNames);

    let parser: LocalAiIntentParser;
    let webLlmParser: WebLlmIntentParser | null = null;
    let transformersParser: TransformersJsIntentParser | null = null;
    let embeddingParser: EmbeddingIntentParser | null = null;

    const webLlmParserOptions: WebLlmIntentParserOptions = {
      ...options.webLlmOptions,
      systemPrompt: introspection.systemPrompt,
      jsonSchema: introspection.jsonSchema,
      validTargets,
    };

    const transformersParserOptions: TransformersJsIntentParserOptions = {
      ...options.transformersOptions,
      systemPrompt: introspection.systemPrompt,
      jsonSchema: introspection.jsonSchema,
      validTargets,
    };

    if (options.parserMode === 'webllm') {
      webLlmParser = new WebLlmIntentParser(webLlmParserOptions);
      parser = webLlmParser;
    } else if (options.parserMode === 'transformers') {
      transformersParser = new TransformersJsIntentParser(transformersParserOptions);
      parser = transformersParser;
    } else if (options.parserMode === 'embedding') {
      embeddingParser = new EmbeddingIntentParser(introspection, options.embeddingOptions);
      parser = embeddingParser;
    } else if (options.parserMode === 'cascade') {
      webLlmParser = new WebLlmIntentParser(webLlmParserOptions);
      parser = new CascadeLocalAiIntentParser([deterministicParser, webLlmParser]);
    } else if (options.parserMode === 'cascade-transformers') {
      transformersParser = new TransformersJsIntentParser(transformersParserOptions);
      parser = new CascadeLocalAiIntentParser([deterministicParser, transformersParser]);
    } else if (options.parserMode === 'cascade-embedding') {
      embeddingParser = new EmbeddingIntentParser(introspection, options.embeddingOptions);
      parser = new CascadeLocalAiIntentParser([deterministicParser, embeddingParser]);
    } else {
      parser = deterministicParser;
    }

    this.webLlmParser = webLlmParser;
    this.transformersParser = transformersParser;
    this.embeddingParser = embeddingParser;
    this.service = LocalAiQueryService.createGeneric(parser, executor, formatter, store);
  }

  public async query(query: string): Promise<LocalAiQueryResult> {
    return this.service.query(query);
  }

  public async queryFormatted(query: string): Promise<{ result: LocalAiQueryResult; formatted: string }> {
    return this.service.queryFormatted(query);
  }

  public async initializeWebLlm(): Promise<void> {
    if (this.webLlmParser) {
      await this.webLlmParser.initialize();
    }
  }

  public async initializeTransformers(): Promise<void> {
    if (this.transformersParser) {
      await this.transformersParser.initialize();
    }
  }

  public async initializeEmbedding(): Promise<void> {
    if (this.embeddingParser) {
      await this.embeddingParser.initialize();
    }
  }

  public async initializeModel(): Promise<void> {
    if (this.embeddingParser) {
      await this.embeddingParser.initialize();
    } else if (this.transformersParser) {
      await this.transformersParser.initialize();
    } else if (this.webLlmParser) {
      await this.webLlmParser.initialize();
    }
  }

  public get isWebLlmLoaded(): boolean {
    return this.webLlmParser?.isLoaded ?? false;
  }

  public get isTransformersLoaded(): boolean {
    return this.transformersParser?.isLoaded ?? false;
  }

  public get isEmbeddingLoaded(): boolean {
    return this.embeddingParser?.isLoaded ?? false;
  }

  public get isModelLoaded(): boolean {
    return this.isEmbeddingLoaded || this.isTransformersLoaded || this.isWebLlmLoaded;
  }

  public async dispose(): Promise<void> {
    if (this.webLlmParser) {
      await this.webLlmParser.dispose();
    }
    if (this.transformersParser) {
      await this.transformersParser.dispose();
    }
    if (this.embeddingParser) {
      await this.embeddingParser.dispose();
    }
  }
}
