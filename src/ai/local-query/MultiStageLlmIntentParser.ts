import type {
  GenericIntent,
  LocalAiIntent,
  LocalAiIntentParser,
  SchemaIntrospectionResult,
} from './LocalAiTypes.js';

export interface MultiStageProgressReport {
  stage: 'embedding' | 'llm';
  progress: number;
  status: string;
  file?: string;
}

export interface MultiStageLlmIntentParserOptions {
  embeddingModelId?: string;
  llmModelId?: string;
  device?: string | null;
  dtype?: string;
  onProgress?: (report: MultiStageProgressReport) => void;
  temperature?: number;
  maxTokens?: number;
  focusedThreshold?: number;
  fallbackThreshold?: number;
}

const DEFAULT_EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const DEFAULT_LLM_MODEL = 'onnx-community/Qwen2.5-1.5B-Instruct';
const DEFAULT_TEMPERATURE = 0.1;
const DEFAULT_MAX_TOKENS = 200;
const DEFAULT_FOCUSED_THRESHOLD = 0.55;
const DEFAULT_FALLBACK_THRESHOLD = 0.25;

interface CategoryDefinition {
  name: string;
  description: string;
  embedding?: number[];
}

const INTENT_CATEGORIES: Array<Omit<CategoryDefinition, 'embedding'>> = [
  { name: 'filter_by_name', description: 'find, show, or get records by a specific person or author name, what someone wrote or posted' },
  { name: 'filter_by_title', description: 'find records about or on a specific titled item, like comments on a specific post' },
  { name: 'who_created', description: 'identify who wrote, created, authored, or made something' },
  { name: 'who_interacted', description: 'identify who commented on, reviewed, replied to, or interacted with something' },
  { name: 'multi_hop', description: 'find records through a chain of relationships, like comments on posts by someone' },
  { name: 'compound', description: 'find records by a specific person about a specific topic, combining author filter with text search' },
  { name: 'search', description: 'search or find records containing specific text, keywords, or about a topic' },
  { name: 'list_recent', description: 'list, show, or get recent, latest, newest, or last records' },
  { name: 'profile', description: 'get profile, details, or information about a specific person or user' },
  { name: 'unsupported', description: 'general conversation, weather, jokes, math, translations, or anything unrelated to stored data' },
];

interface TransformersModule {
  pipeline(
    task: string,
    model: string,
    options?: Record<string, unknown>,
  ): Promise<unknown>;
}

interface FeatureExtractionPipeline {
  (
    text: string | string[],
    options?: Record<string, unknown>,
  ): Promise<EmbeddingOutput>;
  dispose(): Promise<void>;
}

interface EmbeddingOutput {
  tolist(): number[][];
}

interface TextGenerationPipeline {
  (
    messages: Array<{ role: string; content: string }>,
    options?: Record<string, unknown>,
  ): Promise<GenerationOutput>;
  dispose(): Promise<void>;
}

type GenerationOutput = Array<{ generated_text: Array<{ role: string; content: string }> }>;

function pluralize(typeName: string): string {
  if (typeName.endsWith('s')) return typeName;
  if (typeName.endsWith('y')) return `${typeName.slice(0, -1)}ies`;
  return `${typeName}s`;
}

export class MultiStageLlmIntentParser implements LocalAiIntentParser {
  private embeddingPipeline: FeatureExtractionPipeline | null = null;
  private llmPipeline: TextGenerationPipeline | null = null;
  private initializationPromise: Promise<void> | null = null;
  private categories: CategoryDefinition[] = [];
  private readonly introspection: SchemaIntrospectionResult;
  private readonly embeddingModelId: string;
  private readonly llmModelId: string;
  private readonly device: string | null;
  private readonly dtype: string;
  private readonly onProgress?: (report: MultiStageProgressReport) => void;
  private readonly temperature: number;
  private readonly maxTokens: number;
  private readonly focusedThreshold: number;
  private readonly fallbackThreshold: number;

  public constructor(
    introspection: SchemaIntrospectionResult,
    options: MultiStageLlmIntentParserOptions = {},
  ) {
    this.introspection = introspection;
    this.embeddingModelId = options.embeddingModelId ?? DEFAULT_EMBEDDING_MODEL;
    this.llmModelId = options.llmModelId ?? DEFAULT_LLM_MODEL;
    this.device = options.device ?? null;
    this.dtype = options.dtype ?? 'q4';
    this.onProgress = options.onProgress;
    this.temperature = options.temperature ?? DEFAULT_TEMPERATURE;
    this.maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
    this.focusedThreshold = options.focusedThreshold ?? DEFAULT_FOCUSED_THRESHOLD;
    this.fallbackThreshold = options.fallbackThreshold ?? DEFAULT_FALLBACK_THRESHOLD;
  }

  public async initialize(): Promise<void> {
    if (this.embeddingPipeline && this.llmPipeline) return;
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    this.initializationPromise = this.loadPipelines();
    try {
      await this.initializationPromise;
    } catch (error) {
      this.initializationPromise = null;
      throw error;
    }
  }

  public async dispose(): Promise<void> {
    const disposals: Array<Promise<void>> = [];
    if (this.embeddingPipeline) {
      disposals.push(this.embeddingPipeline.dispose());
    }
    if (this.llmPipeline) {
      disposals.push(this.llmPipeline.dispose());
    }
    await Promise.all(disposals);
    this.embeddingPipeline = null;
    this.llmPipeline = null;
    this.initializationPromise = null;
    this.categories = [];
  }

  public get isLoaded(): boolean {
    return this.embeddingPipeline !== null && this.llmPipeline !== null;
  }

  public async parse(query: string): Promise<LocalAiIntent<GenericIntent> | null> {
    const trimmed = query.trim();
    if (trimmed.length === 0) return null;

    await this.initialize();

    // ─── Stage 1: Embedding Classification ──────────────────────
    const queryEmbedding = await this.embed(trimmed);
    const classification = this.classifyByEmbedding(queryEmbedding);

    if (!classification || classification.confidence < this.fallbackThreshold) {
      return null;
    }

    if (classification.category === 'unsupported') {
      return this.buildUnsupportedResult(trimmed, classification.confidence);
    }

    // ─── Stage 2: LLM (focused or full fallback) ────────────────
    let genericIntent: GenericIntent | null;

    if (classification.confidence >= this.focusedThreshold) {
      genericIntent = await this.focusedExtraction(
        classification.category,
        trimmed,
        classification.confidence,
      );
    } else {
      genericIntent = await this.fullLlmFallback(trimmed);
    }

    if (!genericIntent) return null;

    // ─── Stage 3: Schema Validation ─────────────────────────────
    const validated = this.validateAgainstSchema(genericIntent);
    if (!validated) return null;

    return {
      intent: validated.target === 'unsupported'
        ? 'unsupported'
        : `generic:${validated.target}`,
      arguments: validated,
      originalQuery: trimmed,
      confidence: validated.confidence,
    };
  }

  // ─── Stage 1: Embedding ──────────────────────────────────────

  private async embed(text: string): Promise<number[]> {
    const output = await this.embeddingPipeline!(text, {
      pooling: 'mean',
      normalize: true,
    });
    const vectors = output.tolist();
    const firstVector = vectors[0];
    if (!firstVector) {
      throw new Error('Embedding produced no output vectors');
    }
    return firstVector;
  }

  private classifyByEmbedding(
    queryEmbedding: number[],
  ): { category: string; confidence: number } | null {
    let bestCategory = '';
    let bestScore = -1;

    for (const category of this.categories) {
      if (!category.embedding) continue;
      const score = this.dotProduct(queryEmbedding, category.embedding);
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category.name;
      }
    }

    if (!bestCategory) return null;
    return { category: bestCategory, confidence: bestScore };
  }

  private dotProduct(vectorA: number[], vectorB: number[]): number {
    let sum = 0;
    for (let index = 0; index < vectorA.length; index++) {
      sum += (vectorA[index] ?? 0) * (vectorB[index] ?? 0);
    }
    return sum;
  }

  // ─── Stage 2A: Focused Extraction ────────────────────────────

  private async focusedExtraction(
    category: string,
    query: string,
    confidence: number,
  ): Promise<GenericIntent | null> {
    const systemPrompt = this.buildExtractionPrompt(category);
    const extracted = await this.callLlm(systemPrompt, query);
    if (!extracted) return null;

    return this.assembleFromCategory(category, extracted, confidence);
  }

  private buildExtractionPrompt(category: string): string {
    const typeSummary = this.buildTypeSummary();
    const typeNames = this.introspection.typeNames.join(', ');

    switch (category) {
      case 'filter_by_name':
        return this.promptForFilterByName(typeSummary, typeNames);
      case 'filter_by_title':
        return this.promptForFilterByTitle(typeSummary, typeNames);
      case 'who_created':
        return this.promptForWhoCreated(typeSummary);
      case 'who_interacted':
        return this.promptForWhoInteracted(typeSummary);
      case 'multi_hop':
        return this.promptForMultiHop(typeSummary, typeNames);
      case 'compound':
        return this.promptForCompound(typeSummary, typeNames);
      case 'search':
        return this.promptForSearch(typeSummary, typeNames);
      case 'list_recent':
        return this.promptForListRecent(typeSummary, typeNames);
      case 'profile':
        return this.promptForProfile(typeSummary);
      default:
        return this.introspection.systemPrompt;
    }
  }

  private buildTypeSummary(): string {
    const lines: string[] = [];
    for (const typeName of this.introspection.typeNames) {
      const descriptor = this.introspection.types.get(typeName)!;
      const attributes = descriptor.attributes.map((attribute) => attribute.name).join(', ');
      const relationships = descriptor.relationships
        .map((relationship) => `${relationship.name}(${relationship.kind})→${relationship.relatedType}`)
        .join(', ');
      lines.push(`${typeName}: attrs[${attributes}] rels[${relationships}]`);
    }
    return lines.join('\n');
  }

  private promptForFilterByName(typeSummary: string, typeNames: string): string {
    return [
      'Extract the record type and person\'s name from a query about data.',
      typeSummary,
      `target must be one of: ${typeNames}`,
      'Output ONLY JSON: {"target":"<type>","name":"<person name>"}',
      '"posts by Alice" → {"target":"post","name":"Alice"}',
      '"what has Bob written" → {"target":"post","name":"Bob"}',
      '"Bob comments" → {"target":"comment","name":"Bob"}',
      '"lmk what Carol wrote" → {"target":"post","name":"Carol"}',
      '"anything from Alice?" → {"target":"post","name":"Alice"}',
    ].join('\n');
  }

  private promptForFilterByTitle(typeSummary: string, typeNames: string): string {
    return [
      'Extract the record type and title of the referenced item from a data query.',
      typeSummary,
      `target must be one of: ${typeNames}`,
      'Output ONLY JSON: {"target":"<type>","title":"<title text>"}',
      '"comments on Hello World" → {"target":"comment","title":"Hello World"}',
      '"replies on the Weekend post" → {"target":"comment","title":"Weekend"}',
      '"feedback on On MobX" → {"target":"comment","title":"On MobX"}',
    ].join('\n');
  }

  private promptForWhoCreated(typeSummary: string): string {
    return [
      'Extract the title of the thing whose creator/author the user wants to identify.',
      typeSummary,
      'Output ONLY JSON: {"title":"<title value>"}',
      '"who wrote On MobX?" → {"title":"On MobX"}',
      '"who authored the Weekend post?" → {"title":"Weekend"}',
      '"who is the author of Hello World" → {"title":"Hello World"}',
      '"I wonder who wrote the Weekend post" → {"title":"Weekend"}',
    ].join('\n');
  }

  private promptForWhoInteracted(typeSummary: string): string {
    return [
      'Extract the title of the thing whose commenters/interactors the user wants to know.',
      typeSummary,
      'Output ONLY JSON: {"title":"<title value>"}',
      '"who commented on Hello World?" → {"title":"Hello World"}',
      '"who are the users that commented on Weekend" → {"title":"Weekend"}',
    ].join('\n');
  }

  private promptForMultiHop(typeSummary: string, typeNames: string): string {
    return [
      'Extract the target type, person\'s name, and intermediate type from a chained query.',
      typeSummary,
      `Types: ${typeNames}`,
      'Output ONLY JSON: {"target":"<type>","name":"<person name>","through":"<intermediate type>"}',
      '"comments on posts by Alice" → {"target":"comment","name":"Alice","through":"post"}',
      '"all comments people left on Alice posts" → {"target":"comment","name":"Alice","through":"post"}',
    ].join('\n');
  }

  private promptForCompound(typeSummary: string, typeNames: string): string {
    return [
      'Extract the target type, person\'s name, and search topic from a combined query.',
      typeSummary,
      `target must be one of: ${typeNames}`,
      'Output ONLY JSON: {"target":"<type>","name":"<person name>","search":"<topic>"}',
      '"posts by Alice about reactive" → {"target":"post","name":"Alice","search":"reactive"}',
      '"show me posts from Bob about MobX" → {"target":"post","name":"Bob","search":"MobX"}',
    ].join('\n');
  }

  private promptForSearch(typeSummary: string, typeNames: string): string {
    return [
      'Extract the record type and search keywords from a data query.',
      typeSummary,
      `target must be one of: ${typeNames}`,
      'Output ONLY JSON: {"target":"<type>","search":"<keywords>"}',
      '"search posts about TypeScript" → {"target":"post","search":"TypeScript"}',
      '"articles about state management" → {"target":"post","search":"state management"}',
      '"any discussions about observables" → {"target":"post","search":"observables"}',
    ].join('\n');
  }

  private promptForListRecent(typeSummary: string, typeNames: string): string {
    return [
      'Extract the record type and optional limit from a query about recent records.',
      typeSummary,
      `target must be one of: ${typeNames}`,
      'Output ONLY JSON: {"target":"<type>","limit":"<number or 10>"}',
      '"recent posts" → {"target":"post","limit":"10"}',
      '"latest 5 comments" → {"target":"comment","limit":"5"}',
      '"could you show me the latest posts?" → {"target":"post","limit":"10"}',
    ].join('\n');
  }

  private promptForProfile(typeSummary: string): string {
    return [
      'Extract the person\'s name from a profile/details query.',
      typeSummary,
      'Output ONLY JSON: {"name":"<person name>"}',
      '"profile of Alice" → {"name":"Alice"}',
      '"tell me about Carol" → {"name":"Carol"}',
      '"user Carol" → {"name":"Carol"}',
      '"can someone tell me about Alice" → {"name":"Alice"}',
    ].join('\n');
  }

  // ─── Stage 2B: Full LLM Fallback ────────────────────────────

  private async fullLlmFallback(query: string): Promise<GenericIntent | null> {
    const extracted = await this.callLlm(this.introspection.systemPrompt, query);
    if (!extracted) return null;

    return this.parseFullLlmResponse(extracted);
  }

  private parseFullLlmResponse(
    parsed: Record<string, unknown>,
  ): GenericIntent | null {
    const target = parsed.target;
    if (typeof target !== 'string') return null;

    if (target === 'unsupported') {
      return {
        target: 'unsupported',
        filterType: null,
        filterAttribute: null,
        filterValue: null,
        throughType: null,
        search: null,
        limit: null,
        confidence: 0.8,
      };
    }

    const validTargets = new Set(this.introspection.typeNames);
    const resolvedTarget = this.resolveTypeName(target);
    if (!resolvedTarget) return null;

    const confidence = typeof parsed.confidence === 'number'
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0.7;

    return {
      target: resolvedTarget,
      filterType: this.resolveNullableType(parsed.filter_type),
      filterAttribute: this.parseNullableString(parsed.filter_attribute),
      filterValue: this.parseNullableString(parsed.filter_value),
      throughType: this.resolveNullableType(parsed.through_type),
      search: this.parseNullableString(parsed.search),
      limit: this.parseNullableNumber(parsed.limit),
      confidence,
    };
  }

  private resolveNullableType(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    return this.resolveTypeName(value);
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

  // ─── Shared LLM Call ─────────────────────────────────────────

  private async callLlm(
    systemPrompt: string,
    query: string,
  ): Promise<Record<string, unknown> | null> {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query },
    ];

    const output = await this.llmPipeline!(messages, {
      max_new_tokens: this.maxTokens,
      temperature: this.temperature,
      do_sample: this.temperature > 0,
      return_full_text: false,
    });

    const content = this.extractLlmContent(output);
    if (!content) return null;

    try {
      const parsed = JSON.parse(content);
      if (typeof parsed !== 'object' || parsed === null) return null;
      return parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private extractLlmContent(output: GenerationOutput): string | null {
    if (!Array.isArray(output) || output.length === 0) return null;

    const generatedText = output[0]?.generated_text;
    if (!Array.isArray(generatedText) || generatedText.length === 0) return null;

    const assistantMessage = generatedText.find(
      (message) => message.role === 'assistant',
    );
    if (!assistantMessage?.content) return null;

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

    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) return null;

    return jsonMatch[0];
  }

  // ─── Stage 3: Assembly from Category ─────────────────────────

  private assembleFromCategory(
    category: string,
    extracted: Record<string, unknown>,
    confidence: number,
  ): GenericIntent | null {
    switch (category) {
      case 'filter_by_name':
        return this.assembleFilterByName(extracted, confidence);
      case 'filter_by_title':
        return this.assembleFilterByTitle(extracted, confidence);
      case 'who_created':
        return this.assembleWhoCreated(extracted, confidence);
      case 'who_interacted':
        return this.assembleWhoInteracted(extracted, confidence);
      case 'multi_hop':
        return this.assembleMultiHop(extracted, confidence);
      case 'compound':
        return this.assembleCompound(extracted, confidence);
      case 'search':
        return this.assembleSearch(extracted, confidence);
      case 'list_recent':
        return this.assembleListRecent(extracted, confidence);
      case 'profile':
        return this.assembleProfile(extracted, confidence);
      default:
        return null;
    }
  }

  private assembleFilterByName(
    extracted: Record<string, unknown>,
    confidence: number,
  ): GenericIntent | null {
    const target = this.resolveTypeName(String(extracted.target ?? ''));
    const nameType = this.findTypeWithAttribute('name');
    if (!nameType) return null;

    return {
      target: target ?? this.defaultTargetExcluding(nameType),
      filterType: nameType,
      filterAttribute: 'name',
      filterValue: this.parseNullableString(extracted.name),
      throughType: null,
      search: null,
      limit: null,
      confidence,
    };
  }

  private assembleFilterByTitle(
    extracted: Record<string, unknown>,
    confidence: number,
  ): GenericIntent | null {
    const target = this.resolveTypeName(String(extracted.target ?? ''));
    const titleType = this.findTypeWithAttribute('title');
    if (!titleType) return null;

    return {
      target: target ?? this.defaultTargetExcluding(titleType),
      filterType: titleType,
      filterAttribute: 'title',
      filterValue: this.parseNullableString(extracted.title),
      throughType: null,
      search: null,
      limit: null,
      confidence,
    };
  }

  private assembleWhoCreated(
    extracted: Record<string, unknown>,
    confidence: number,
  ): GenericIntent | null {
    const nameType = this.findTypeWithAttribute('name');
    const titleType = this.findTypeWithAttribute('title');
    if (!nameType || !titleType) return null;

    return {
      target: nameType,
      filterType: titleType,
      filterAttribute: 'title',
      filterValue: this.parseNullableString(extracted.title),
      throughType: null,
      search: null,
      limit: null,
      confidence,
    };
  }

  private assembleWhoInteracted(
    extracted: Record<string, unknown>,
    confidence: number,
  ): GenericIntent | null {
    const nameType = this.findTypeWithAttribute('name');
    const titleType = this.findTypeWithAttribute('title');
    if (!nameType || !titleType) return null;

    const throughType = this.findThroughType(nameType, titleType);

    return {
      target: nameType,
      filterType: titleType,
      filterAttribute: 'title',
      filterValue: this.parseNullableString(extracted.title),
      throughType,
      search: null,
      limit: null,
      confidence,
    };
  }

  private assembleMultiHop(
    extracted: Record<string, unknown>,
    confidence: number,
  ): GenericIntent | null {
    const target = this.resolveTypeName(String(extracted.target ?? ''));
    if (!target) return null;

    const nameType = this.findTypeWithAttribute('name');
    if (!nameType) return null;

    const throughType = this.resolveTypeName(String(extracted.through ?? ''));

    return {
      target,
      filterType: nameType,
      filterAttribute: 'name',
      filterValue: this.parseNullableString(extracted.name),
      throughType,
      search: null,
      limit: null,
      confidence,
    };
  }

  private assembleCompound(
    extracted: Record<string, unknown>,
    confidence: number,
  ): GenericIntent | null {
    const target = this.resolveTypeName(String(extracted.target ?? ''));
    const nameType = this.findTypeWithAttribute('name');
    if (!nameType) return null;

    return {
      target: target ?? this.defaultTargetExcluding(nameType),
      filterType: nameType,
      filterAttribute: 'name',
      filterValue: this.parseNullableString(extracted.name),
      throughType: null,
      search: this.parseNullableString(extracted.search),
      limit: null,
      confidence,
    };
  }

  private assembleSearch(
    extracted: Record<string, unknown>,
    confidence: number,
  ): GenericIntent | null {
    const target = this.resolveTypeName(String(extracted.target ?? ''));

    return {
      target: target ?? this.introspection.typeNames[0] ?? 'unknown',
      filterType: null,
      filterAttribute: null,
      filterValue: null,
      throughType: null,
      search: this.parseNullableString(extracted.search),
      limit: null,
      confidence,
    };
  }

  private assembleListRecent(
    extracted: Record<string, unknown>,
    confidence: number,
  ): GenericIntent | null {
    const target = this.resolveTypeName(String(extracted.target ?? ''));
    const limit = this.parseNullableNumber(extracted.limit) ?? 10;

    return {
      target: target ?? this.introspection.typeNames[0] ?? 'unknown',
      filterType: null,
      filterAttribute: null,
      filterValue: null,
      throughType: null,
      search: null,
      limit,
      confidence,
    };
  }

  private assembleProfile(
    extracted: Record<string, unknown>,
    confidence: number,
  ): GenericIntent | null {
    const nameType = this.findTypeWithAttribute('name');
    if (!nameType) return null;

    return {
      target: nameType,
      filterType: nameType,
      filterAttribute: 'name',
      filterValue: this.parseNullableString(extracted.name),
      throughType: null,
      search: null,
      limit: null,
      confidence,
    };
  }

  // ─── Stage 3: Schema Validation ──────────────────────────────

  private validateAgainstSchema(intent: GenericIntent): GenericIntent | null {
    if (intent.target === 'unsupported') return intent;

    if (!this.introspection.typeNames.includes(intent.target)) {
      const resolved = this.resolveTypeName(intent.target);
      if (!resolved) return null;
      intent.target = resolved;
    }

    if (intent.filterType && !this.introspection.typeNames.includes(intent.filterType)) {
      const resolved = this.resolveTypeName(intent.filterType);
      intent.filterType = resolved;
      if (!resolved) {
        intent.filterAttribute = null;
        intent.filterValue = null;
      }
    }

    if (intent.throughType && !this.introspection.typeNames.includes(intent.throughType)) {
      const resolved = this.resolveTypeName(intent.throughType);
      intent.throughType = resolved;
    }

    return intent;
  }

  // ─── Schema Helpers ──────────────────────────────────────────

  private findTypeWithAttribute(attributeName: string): string | null {
    for (const [typeName, descriptor] of this.introspection.types) {
      if (descriptor.attributes.some((attribute) => attribute.name === attributeName)) {
        return typeName;
      }
    }
    return null;
  }

  private findThroughType(targetType: string, filterType: string): string | null {
    for (const [typeName, descriptor] of this.introspection.types) {
      if (typeName === targetType || typeName === filterType) continue;
      const belongsToTarget = descriptor.relationships.some(
        (relationship) => relationship.kind === 'belongsTo' && relationship.relatedType === targetType,
      );
      const belongsToFilter = descriptor.relationships.some(
        (relationship) => relationship.kind === 'belongsTo' && relationship.relatedType === filterType,
      );
      if (belongsToTarget && belongsToFilter) {
        return typeName;
      }
    }
    return null;
  }

  private defaultTargetExcluding(excludeType: string): string {
    for (const typeName of this.introspection.typeNames) {
      if (typeName === excludeType) continue;
      const descriptor = this.introspection.types.get(typeName)!;
      if (descriptor.relationships.some(
        (relationship) => relationship.kind === 'belongsTo' && relationship.relatedType === excludeType,
      )) {
        return typeName;
      }
    }
    return this.introspection.typeNames[0] ?? 'unknown';
  }

  private resolveTypeName(value: string | undefined): string | null {
    if (!value || value === 'none' || value === 'null' || value === '') return null;

    const normalized = value.toLowerCase().trim();

    for (const typeName of this.introspection.typeNames) {
      if (typeName.toLowerCase() === normalized) return typeName;
    }

    for (const typeName of this.introspection.typeNames) {
      const plural = pluralize(typeName).toLowerCase();
      if (plural === normalized || `${typeName.toLowerCase()}s` === normalized) {
        return typeName;
      }
    }

    for (const typeName of this.introspection.typeNames) {
      if (normalized.includes(typeName.toLowerCase())) return typeName;
    }

    return null;
  }

  private buildUnsupportedResult(
    query: string,
    confidence: number,
  ): LocalAiIntent<GenericIntent> {
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
        confidence,
      },
      originalQuery: query,
      confidence,
    };
  }

  // ─── Pipeline Loading ────────────────────────────────────────

  private async loadPipelines(): Promise<void> {
    let transformers: TransformersModule;
    try {
      transformers = await import('@huggingface/transformers') as unknown as TransformersModule;
    } catch {
      throw new Error(
        '@huggingface/transformers is required for MultiStageLlmIntentParser. '
        + 'Install it with: pnpm add @huggingface/transformers',
      );
    }

    const embeddingOptions: Record<string, unknown> = {};
    const llmOptions: Record<string, unknown> = { dtype: this.dtype };

    if (this.device !== null) {
      llmOptions.device = this.device;
    }

    if (this.onProgress) {
      embeddingOptions.progress_callback = (event: Record<string, unknown>) => {
        this.onProgress!({
          stage: 'embedding',
          progress: typeof event.progress === 'number' ? event.progress : 0,
          status: typeof event.status === 'string' ? event.status : 'unknown',
          file: typeof event.file === 'string' ? event.file : undefined,
        });
      };

      llmOptions.progress_callback = (event: Record<string, unknown>) => {
        this.onProgress!({
          stage: 'llm',
          progress: typeof event.progress === 'number' ? event.progress : 0,
          status: typeof event.status === 'string' ? event.status : 'unknown',
          file: typeof event.file === 'string' ? event.file : undefined,
        });
      };
    }

    const [embeddingPipeline, llmPipeline] = await Promise.all([
      transformers.pipeline('feature-extraction', this.embeddingModelId, embeddingOptions),
      transformers.pipeline('text-generation', this.llmModelId, llmOptions),
    ]);

    this.embeddingPipeline = embeddingPipeline as FeatureExtractionPipeline;
    this.llmPipeline = llmPipeline as TextGenerationPipeline;

    this.categories = [];
    for (const category of INTENT_CATEGORIES) {
      const embedding = await this.embed(category.description);
      this.categories.push({ ...category, embedding });
    }
  }
}
