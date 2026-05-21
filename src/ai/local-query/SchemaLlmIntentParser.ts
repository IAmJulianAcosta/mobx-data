import type {
  GenericIntent,
  LocalAiIntent,
  LocalAiIntentParser,
  SchemaIntrospectionResult,
} from './LocalAiTypes.js';

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

const DEFAULT_MODEL_ID = 'onnx-community/Qwen2.5-0.5B-Instruct';
const DEFAULT_TEMPERATURE = 0.1;
const DEFAULT_MAX_TOKENS = 200;

interface TransformersModule {
  pipeline(
    task: string,
    model: string,
    options?: Record<string, unknown>,
  ): Promise<TextGenerationPipeline>;
}

interface TextGenerationPipeline {
  (
    messages: Array<{ role: string; content: string }>,
    options?: Record<string, unknown>,
  ): Promise<GenerationOutput>;
  dispose(): Promise<void>;
}

type GenerationOutput = Array<{ generated_text: Array<{ role: string; content: string }> }>;

export class SchemaLlmIntentParser implements LocalAiIntentParser {
  private generator: TextGenerationPipeline | null = null;
  private initializationPromise: Promise<void> | null = null;
  private readonly introspection: SchemaIntrospectionResult;
  private readonly modelId: string;
  private readonly device: string | null;
  private readonly dtype: string;
  private readonly onProgress?: (report: SchemaLlmProgressReport) => void;
  private readonly temperature: number;
  private readonly maxTokens: number;

  public constructor(
    introspection: SchemaIntrospectionResult,
    options: SchemaLlmIntentParserOptions = {},
  ) {
    this.introspection = introspection;
    this.modelId = options.modelId ?? DEFAULT_MODEL_ID;
    this.device = options.device ?? null;
    this.dtype = options.dtype ?? 'q4f16';
    this.onProgress = options.onProgress;
    this.temperature = options.temperature ?? DEFAULT_TEMPERATURE;
    this.maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  }

  public async initialize(): Promise<void> {
    if (this.generator) { return; }
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    this.initializationPromise = this.loadPipeline();
    try {
      await this.initializationPromise;
    } catch (error) {
      this.initializationPromise = null;
      throw error;
    }
  }

  public async dispose(): Promise<void> {
    if (this.generator) {
      await this.generator.dispose();
      this.generator = null;
      this.initializationPromise = null;
    }
  }

  public get isLoaded(): boolean {
    return this.generator !== null;
  }

  public async parse(query: string): Promise<LocalAiIntent<GenericIntent> | null> {
    const trimmed = query.trim();
    if (trimmed.length === 0) { return null; }

    await this.initialize();

    const messages = [
      { role: 'system', content: this.introspection.systemPrompt },
      { role: 'user', content: trimmed },
    ];

    const output = await this.generator!(messages, {
      max_new_tokens: this.maxTokens,
      temperature: this.temperature,
      do_sample: this.temperature > 0,
      return_full_text: false,
    });

    const content = this.extractContent(output);
    if (!content) { return null; }

    return this.parseResponse(content, trimmed);
  }

  private extractContent(output: GenerationOutput): string | null {
    if (!Array.isArray(output) || output.length === 0) { return null; }

    const generatedText = output[0]?.generated_text;
    if (!Array.isArray(generatedText) || generatedText.length === 0) { return null; }

    const assistantMessage = generatedText.find(
      (message) => message.role === 'assistant',
    );
    if (!assistantMessage?.content) { return null; }

    return this.cleanJsonResponse(assistantMessage.content);
  }

  private cleanJsonResponse(content: string): string | null {
    let text = content.trim();

    const thinkEnd = text.indexOf('</think>');
    if (thinkEnd !== -1) {
      text = text.slice(thinkEnd + '</think>'.length).trim();
    }

    const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
      text = jsonBlockMatch[1]!.trim();
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) { return null; }

    return jsonMatch[0];
  }

  private parseResponse(content: string, originalQuery: string): LocalAiIntent<GenericIntent> | null {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content);
    } catch {
      return null;
    }

    const { target } = parsed;
    if (typeof target !== 'string') { return null; }

    if (target === 'unsupported') {
      return {
        intent: 'unsupported',
        arguments: {
          target: 'unsupported',
          filterType: null,
          filterAttribute: null,
          filterValue: null,
          throughType: null,
          search: null,
          limit: null,
          confidence: 0.8,
        },
        originalQuery,
        confidence: 0.8,
      };
    }

    const validTargets = new Set(this.introspection.typeNames);
    if (!validTargets.has(target)) { return null; }

    const confidence = typeof parsed.confidence === 'number'
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0.7;

    const genericIntent: GenericIntent = {
      target,
      filterType: this.parseNullableString(parsed.filter_type),
      filterAttribute: this.parseNullableString(parsed.filter_attribute),
      filterValue: this.parseNullableString(parsed.filter_value),
      throughType: this.parseNullableString(parsed.through_type),
      search: this.parseNullableString(parsed.search),
      limit: this.parseNullableNumber(parsed.limit),
      confidence,
    };

    return {
      intent: `generic:${target}`,
      arguments: genericIntent,
      originalQuery,
      confidence,
    };
  }

  private parseNullableString(value: unknown): string | null {
    if (typeof value !== 'string') { return null; }
    if (value === 'none' || value === 'null' || value === '') { return null; }
    return value;
  }

  private parseNullableNumber(value: unknown): number | null {
    if (typeof value === 'number') { return Math.max(1, Math.min(100, value)); }
    if (typeof value !== 'string') { return null; }
    if (value === 'none' || value === 'null' || value === '') { return null; }
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : Math.max(1, Math.min(100, parsed));
  }

  private async loadPipeline(): Promise<void> {
    let transformers: TransformersModule;
    try {
      transformers = await import('@huggingface/transformers') as unknown as TransformersModule;
    } catch {
      throw new Error(
        '@huggingface/transformers is required for SchemaLlmIntentParser. '
        + 'Install it with: pnpm add @huggingface/transformers',
      );
    }

    const pipelineOptions: Record<string, unknown> = {
      dtype: this.dtype,
    };

    if (this.device !== null) {
      pipelineOptions.device = this.device;
    }

    if (this.onProgress) {
      pipelineOptions.progress_callback = (event: Record<string, unknown>) => {
        this.onProgress!({
          progress: typeof event.progress === 'number' ? event.progress : 0,
          status: typeof event.status === 'string' ? event.status : 'unknown',
          file: typeof event.file === 'string' ? event.file : undefined,
        });
      };
    }

    this.generator = await transformers.pipeline(
      'text-generation',
      this.modelId,
      pipelineOptions,
    );
  }
}
