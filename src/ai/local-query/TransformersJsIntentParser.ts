import type {
  LocalAiIntent,
  LocalAiIntentParser,
  GenericIntent,
} from './LocalAiTypes.js';

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

const DEFAULT_MODEL_ID = 'HuggingFaceTB/SmolLM3-3B-ONNX';
const DEFAULT_TEMPERATURE = 0.1;
const DEFAULT_MAX_TOKENS = 128;
const NO_THINK_SUFFIX = '/no_think';

const VALID_INTENTS: ReadonlySet<string> = new Set([
  'get_posts_by_user',
  'get_user_profile',
  'get_comments_by_post',
  'get_comments_by_user',
  'search_posts',
  'get_recent_posts',
]);

const SYSTEM_PROMPT = [
  'You are an intent classifier. Given a user query in English or Spanish, output a JSON object with the intent, arguments, and confidence.',
  '',
  'Intents:',
  '- get_posts_by_user: {userName?: string, userId?: string}',
  '- get_user_profile: {userName?: string, userId?: string}',
  '- get_comments_by_post: {postId?: string, postTitle?: string}',
  '- search_posts: {text: string}',
  '- get_recent_posts: {limit?: number}',
  '- unsupported: {}',
  '',
  'Examples:',
  '"dame los posts de julian" -> {"intent":"get_posts_by_user","arguments":{"userName":"julian"},"confidence":0.95}',
  '"perfil del usuario maria" -> {"intent":"get_user_profile","arguments":{"userName":"maria"},"confidence":0.9}',
  '"comments for post 123" -> {"intent":"get_comments_by_post","arguments":{"postId":"123"},"confidence":0.95}',
  '"buscar posts sobre timeout" -> {"intent":"search_posts","arguments":{"text":"timeout"},"confidence":0.9}',
  '"show posts by alice" -> {"intent":"get_posts_by_user","arguments":{"userName":"alice"},"confidence":0.95}',
  '"recent posts" -> {"intent":"get_recent_posts","arguments":{},"confidence":0.95}',
  '"ultimos 10 posts" -> {"intent":"get_recent_posts","arguments":{"limit":10},"confidence":0.9}',
  '"posts recientes" -> {"intent":"get_recent_posts","arguments":{},"confidence":0.9}',
  '"what is the weather" -> {"intent":"unsupported","arguments":{},"confidence":0.8}',
  '',
  'Output ONLY the JSON object. No explanation.',
].join('\n');

interface TransformersJsModule {
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
  tokenizer: unknown;
  dispose(): Promise<void>;
}

type GenerationOutput = Array<{ generated_text: Array<{ role: string; content: string }> }>;

export class TransformersJsIntentParser implements LocalAiIntentParser {
  private generator: TextGenerationPipeline | null = null;
  private initializationPromise: Promise<void> | null = null;
  private readonly modelId: string;
  private readonly onProgress?: (report: TransformersJsProgressReport) => void;
  private readonly temperature: number;
  private readonly maxTokens: number;
  private readonly customSystemPrompt?: string;
  private readonly customJsonSchema?: string;
  private readonly validTargets?: ReadonlySet<string>;

  public constructor(options: TransformersJsIntentParserOptions = {}) {
    this.modelId = options.modelId ?? DEFAULT_MODEL_ID;
    this.onProgress = options.onProgress;
    this.temperature = options.temperature ?? DEFAULT_TEMPERATURE;
    this.maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
    this.customSystemPrompt = options.systemPrompt;
    this.customJsonSchema = options.jsonSchema;
    this.validTargets = options.validTargets;
  }

  public async initialize(): Promise<void> {
    if (this.generator) {
      return;
    }
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

  public get isGenericMode(): boolean {
    return this.validTargets !== undefined;
  }

  public async parse(query: string): Promise<LocalAiIntent | null> {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      return null;
    }

    await this.initialize();

    const systemPrompt = this.buildSystemPrompt();
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: trimmed },
    ];

    const output = await this.generator!(messages, {
      max_new_tokens: this.maxTokens,
      temperature: this.temperature,
      do_sample: this.temperature > 0,
      return_full_text: false,
    });

    const content = this.extractContent(output);
    if (!content) {
      return null;
    }

    if (this.isGenericMode) {
      return this.parseGenericResponse(content, trimmed);
    }

    return this.parseLegacyResponse(content, trimmed);
  }

  private buildSystemPrompt(): string {
    const basePrompt = this.customSystemPrompt ?? SYSTEM_PROMPT;
    return `${basePrompt}${NO_THINK_SUFFIX}`;
  }

  private extractContent(output: GenerationOutput): string | null {
    if (!Array.isArray(output) || output.length === 0) {
      return null;
    }

    const generatedText = output[0]?.generated_text;
    if (!Array.isArray(generatedText) || generatedText.length === 0) {
      return null;
    }

    const assistantMessage = generatedText.find(
      (message) => message.role === 'assistant',
    );
    if (!assistantMessage?.content) {
      return null;
    }

    return this.cleanJsonResponse(assistantMessage.content);
  }

  private cleanJsonResponse(content: string): string | null {
    let text = content.trim();

    const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
      text = jsonBlockMatch[1]!.trim();
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    return jsonMatch[0];
  }

  private parseGenericResponse(content: string, originalQuery: string): LocalAiIntent<GenericIntent> | null {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content);
    } catch {
      return null;
    }

    const target = parsed.target;
    if (typeof target !== 'string') {
      return null;
    }

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

    if (!this.validTargets!.has(target)) {
      return null;
    }

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

  private parseLegacyResponse(content: string, originalQuery: string): LocalAiIntent | null {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content);
    } catch {
      return null;
    }

    const intent = parsed.intent;
    if (typeof intent !== 'string') {
      return null;
    }

    if (intent === 'unsupported') {
      return null;
    }

    if (!VALID_INTENTS.has(intent)) {
      return null;
    }

    const arguments_ = typeof parsed.arguments === 'object' && parsed.arguments !== null
      ? parsed.arguments as Record<string, unknown>
      : {};

    const confidence = typeof parsed.confidence === 'number'
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0.7;

    return {
      intent,
      arguments: arguments_,
      originalQuery,
      confidence,
    };
  }

  private parseNullableString(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    if (value === 'none' || value === 'null' || value === '') return null;
    return value;
  }

  private parseNullableNumber(value: unknown): number | null {
    if (typeof value === 'number') return Math.max(1, Math.min(100, value));
    if (typeof value !== 'string') return null;
    if (value === 'none' || value === 'null' || value === '') return null;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : Math.max(1, Math.min(100, parsed));
  }

  private async loadPipeline(): Promise<void> {
    let transformers: TransformersJsModule;
    try {
      transformers = await import('@huggingface/transformers') as unknown as TransformersJsModule;
    } catch {
      throw new Error(
        '@huggingface/transformers is required for TransformersJsIntentParser. '
        + 'Install it with: pnpm add @huggingface/transformers',
      );
    }

    const pipelineOptions: Record<string, unknown> = {
      dtype: 'q4f16',
      device: 'webgpu',
    };

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
