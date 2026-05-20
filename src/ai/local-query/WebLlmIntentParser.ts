import type {
  LocalAiIntent,
  LocalAiIntentParser,
  GenericIntent,
} from './LocalAiTypes.js';

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

const DEFAULT_MODEL_ID = 'Qwen3.5-2B-q4f16_1-MLC';
const DEFAULT_TEMPERATURE = 0.1;
const DEFAULT_MAX_TOKENS = 128;

const VALID_INTENTS: ReadonlySet<string> = new Set([
  'get_posts_by_user',
  'get_user_profile',
  'get_comments_by_post',
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
  '"dame los posts de julian" → {"intent":"get_posts_by_user","arguments":{"userName":"julian"},"confidence":0.95}',
  '"perfil del usuario maria" → {"intent":"get_user_profile","arguments":{"userName":"maria"},"confidence":0.9}',
  '"comments for post 123" → {"intent":"get_comments_by_post","arguments":{"postId":"123"},"confidence":0.95}',
  '"buscar posts sobre timeout" → {"intent":"search_posts","arguments":{"text":"timeout"},"confidence":0.9}',
  '"show posts by alice" → {"intent":"get_posts_by_user","arguments":{"userName":"alice"},"confidence":0.95}',
  '"recent posts" → {"intent":"get_recent_posts","arguments":{},"confidence":0.95}',
  '"últimos 10 posts" → {"intent":"get_recent_posts","arguments":{"limit":10},"confidence":0.9}',
  '"posts recientes" → {"intent":"get_recent_posts","arguments":{},"confidence":0.9}',
  '"what is the weather" → {"intent":"unsupported","arguments":{},"confidence":0.8}',
  '',
  'Output ONLY the JSON object. No explanation.',
].join('\n');

const INTENT_JSON_SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    intent: {
      type: 'string',
      enum: [...VALID_INTENTS, 'unsupported'],
    },
    arguments: {
      type: 'object',
    },
    confidence: {
      type: 'number',
    },
  },
  required: ['intent', 'arguments', 'confidence'],
});

interface WebLlmModule {
  CreateMLCEngine(
    modelId: string,
    config?: { initProgressCallback?: (report: WebLlmProgressReport) => void },
  ): Promise<WebLlmEngine>;
}

interface WebLlmEngine {
  chat: {
    completions: {
      create(request: Record<string, unknown>): Promise<WebLlmChatCompletion>;
    };
  };
  unload(): Promise<void>;
}

interface WebLlmChatCompletion {
  choices: Array<{
    message: {
      content: string | null;
    };
    finish_reason: string;
  }>;
}

export class WebLlmIntentParser implements LocalAiIntentParser {
  private engine: WebLlmEngine | null = null;
  private initializationPromise: Promise<void> | null = null;
  private readonly modelId: string;
  private readonly onProgress?: (report: WebLlmProgressReport) => void;
  private readonly temperature: number;
  private readonly maxTokens: number;
  private readonly customSystemPrompt?: string;
  private readonly customJsonSchema?: string;
  private readonly validTargets?: ReadonlySet<string>;

  public constructor(options: WebLlmIntentParserOptions = {}) {
    this.modelId = options.modelId ?? DEFAULT_MODEL_ID;
    this.onProgress = options.onProgress;
    this.temperature = options.temperature ?? DEFAULT_TEMPERATURE;
    this.maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
    this.customSystemPrompt = options.systemPrompt;
    this.customJsonSchema = options.jsonSchema;
    this.validTargets = options.validTargets;
  }

  public async initialize(): Promise<void> {
    if (this.engine) {
      return;
    }
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    this.initializationPromise = this.loadEngine();
    try {
      await this.initializationPromise;
    } catch (error) {
      this.initializationPromise = null;
      throw error;
    }
  }

  public async dispose(): Promise<void> {
    if (this.engine) {
      await this.engine.unload();
      this.engine = null;
      this.initializationPromise = null;
    }
  }

  public get isLoaded(): boolean {
    return this.engine !== null;
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

    const systemPrompt = this.customSystemPrompt ?? SYSTEM_PROMPT;
    const jsonSchema = this.customJsonSchema ?? INTENT_JSON_SCHEMA;

    const request: Record<string, unknown> = {
      stream: false,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: trimmed },
      ],
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      response_format: {
        type: 'json_object',
        schema: jsonSchema,
      },
    };

    if (this.modelId.startsWith('Qwen3-')) {
      request.extra_body = { enable_thinking: false };
    }

    const response = await this.engine!.chat.completions.create(request);

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return null;
    }

    if (this.isGenericMode) {
      return this.parseGenericResponse(content, trimmed);
    }

    return this.parseLegacyResponse(content, trimmed);
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

  private async loadEngine(): Promise<void> {
    let webllm: WebLlmModule;
    try {
      webllm = await import('@mlc-ai/web-llm') as unknown as WebLlmModule;
    } catch {
      throw new Error(
        '@mlc-ai/web-llm is required for WebLlmIntentParser. '
        + 'Install it with: pnpm add @mlc-ai/web-llm',
      );
    }

    this.engine = await webllm.CreateMLCEngine(this.modelId, {
      initProgressCallback: this.onProgress,
    });
  }
}
