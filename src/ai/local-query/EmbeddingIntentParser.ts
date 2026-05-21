import type {
  GenericIntent,
  LocalAiIntent,
  LocalAiIntentParser,
  SchemaIntrospectionResult,
  SchemaTypeDescriptor,
} from './LocalAiTypes.js';

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

const DEFAULT_MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
const DEFAULT_SIMILARITY_THRESHOLD = 0.3;

interface IntentCategory {
  name: string;
  description: string;
  embedding?: number[];
}

const INTENT_CATEGORIES: Array<Omit<IntentCategory, 'embedding'>> = [
  { name: 'filter_by_name', description: 'find or show records created by a specific person, filtered by author name' },
  { name: 'filter_by_title', description: 'find records related to something identified by its title or name' },
  { name: 'who_created', description: 'identify who wrote, created, or authored something' },
  { name: 'who_interacted', description: 'identify who commented on, reviewed, or interacted with something' },
  { name: 'multi_hop', description: 'find records through a chain of relationships, like comments on posts by someone' },
  { name: 'search', description: 'search or find records containing specific text, keywords, or a topic' },
  { name: 'list_recent', description: 'list, show, or get recent, latest, newest, or last records' },
  { name: 'profile', description: 'get profile, details, or information about a specific person' },
  { name: 'unsupported', description: 'general conversation, weather, jokes, math, translations, or anything unrelated to stored data' },
];

interface TransformersModule {
  pipeline(
    task: string,
    model: string,
    options?: Record<string, unknown>,
  ): Promise<FeatureExtractionPipeline>;
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

interface TypeMatch {
  typeName: string;
  position: number;
}

function pluralize(typeName: string): string {
  if (typeName.endsWith('s')) { return typeName; }
  if (typeName.endsWith('y')) { return `${typeName.slice(0, -1)}ies`; }
  return `${typeName}s`;
}

export class EmbeddingIntentParser implements LocalAiIntentParser {
  private pipeline: FeatureExtractionPipeline | null = null;
  private initializationPromise: Promise<void> | null = null;
  private categories: IntentCategory[] = [];
  private readonly introspection: SchemaIntrospectionResult;
  private readonly modelId: string;
  private readonly onProgress?: (report: EmbeddingProgressReport) => void;
  private readonly similarityThreshold: number;

  public constructor(
    introspection: SchemaIntrospectionResult,
    options: EmbeddingIntentParserOptions = {},
  ) {
    this.introspection = introspection;
    this.modelId = options.modelId ?? DEFAULT_MODEL_ID;
    this.onProgress = options.onProgress;
    this.similarityThreshold = options.similarityThreshold ?? DEFAULT_SIMILARITY_THRESHOLD;
  }

  public async initialize(): Promise<void> {
    if (this.pipeline) { return; }
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    this.initializationPromise = this.loadAndEmbed();
    try {
      await this.initializationPromise;
    } catch (error) {
      this.initializationPromise = null;
      throw error;
    }
  }

  public async dispose(): Promise<void> {
    if (this.pipeline) {
      await this.pipeline.dispose();
      this.pipeline = null;
      this.initializationPromise = null;
      this.categories = [];
    }
  }

  public get isLoaded(): boolean {
    return this.pipeline !== null;
  }

  public async parse(query: string): Promise<LocalAiIntent<GenericIntent> | null> {
    const trimmed = query.trim();
    if (trimmed.length === 0) { return null; }

    await this.initialize();

    const queryEmbedding = await this.embed(trimmed);
    const category = this.classifyIntent(queryEmbedding);

    if (!category || category.score < this.similarityThreshold) {
      return null;
    }

    if (category.name === 'unsupported') {
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
          confidence: category.score,
        },
        originalQuery: trimmed,
        confidence: category.score,
      };
    }

    const genericIntent = this.resolveIntent(trimmed, category.name);
    if (!genericIntent) { return null; }

    genericIntent.confidence = category.score;

    return {
      intent: genericIntent.target === 'unsupported' ? 'unsupported' : `generic:${genericIntent.target}`,
      arguments: genericIntent,
      originalQuery: trimmed,
      confidence: category.score,
    };
  }

  // ─── Initialization ──────────────────────────────────────────

  private async loadAndEmbed(): Promise<void> {
    let transformers: TransformersModule;
    try {
      transformers = await import('@huggingface/transformers') as unknown as TransformersModule;
    } catch {
      throw new Error(
        '@huggingface/transformers is required for EmbeddingIntentParser. '
        + 'Install it with: pnpm add @huggingface/transformers',
      );
    }

    const pipelineOptions: Record<string, unknown> = {};

    if (this.onProgress) {
      pipelineOptions.progress_callback = (event: Record<string, unknown>) => {
        this.onProgress!({
          progress: typeof event.progress === 'number' ? event.progress : 0,
          status: typeof event.status === 'string' ? event.status : 'unknown',
          file: typeof event.file === 'string' ? event.file : undefined,
        });
      };
    }

    this.pipeline = await transformers.pipeline(
      'feature-extraction',
      this.modelId,
      pipelineOptions,
    );

    this.categories = [];
    for (const category of INTENT_CATEGORIES) {
      const embedding = await this.embed(category.description);
      this.categories.push({ ...category, embedding });
    }
  }

  private async embed(text: string): Promise<number[]> {
    const output = await this.pipeline!(text, {
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

  // ─── Phase 1: Intent Classification ─────────────────────────

  private classifyIntent(queryEmbedding: number[]): { name: string; score: number } | null {
    let bestName = '';
    let bestScore = -1;

    for (const category of this.categories) {
      if (!category.embedding) { continue; }
      const score = this.dotProduct(queryEmbedding, category.embedding);
      if (score > bestScore) {
        bestScore = score;
        bestName = category.name;
      }
    }

    if (!bestName) { return null; }
    return { name: bestName, score: bestScore };
  }

  private dotProduct(vectorA: number[], vectorB: number[]): number {
    let sum = 0;
    for (let index = 0; index < vectorA.length; index++) {
      sum += (vectorA[index] ?? 0) * (vectorB[index] ?? 0);
    }
    return sum;
  }

  // ─── Phase 2: Type Resolution + Intent Building ─────────────

  private resolveIntent(query: string, categoryName: string): GenericIntent | null {
    const typeMentions = this.findTypeMentions(query);

    switch (categoryName) {
      case 'filter_by_name':
        return this.resolveFilterByName(query, typeMentions);
      case 'filter_by_title':
        return this.resolveFilterByTitle(query, typeMentions);
      case 'who_created':
        return this.resolveWhoCreated(query, typeMentions);
      case 'who_interacted':
        return this.resolveWhoInteracted(query, typeMentions);
      case 'multi_hop':
        return this.resolveMultiHop(query, typeMentions);
      case 'search':
        return this.resolveSearch(query, typeMentions);
      case 'list_recent':
        return this.resolveListRecent(query, typeMentions);
      case 'profile':
        return this.resolveProfile(query, typeMentions);
      default:
        return null;
    }
  }

  private findTypeMentions(query: string): TypeMatch[] {
    const lower = query.toLowerCase();
    const matches: TypeMatch[] = [];

    for (const typeName of this.introspection.typeNames) {
      const plural = pluralize(typeName);
      const pluralIndex = lower.indexOf(plural.toLowerCase());
      if (pluralIndex !== -1) {
        matches.push({ typeName, position: pluralIndex });
        continue;
      }
      const singularIndex = lower.indexOf(typeName.toLowerCase());
      if (singularIndex !== -1) {
        matches.push({ typeName, position: singularIndex });
      }
    }

    matches.sort((a, b) => a.position - b.position);
    return matches;
  }

  private findTypeWithAttribute(attributeName: string): string | null {
    for (const [typeName, descriptor] of this.introspection.types) {
      if (descriptor.attributes.some((attribute) => attribute.name === attributeName)) {
        return typeName;
      }
    }
    return null;
  }

  private findTypesWithTitleAttribute(): string[] {
    const types: string[] = [];
    for (const [typeName, descriptor] of this.introspection.types) {
      if (descriptor.attributes.some((attribute) => attribute.name === 'title')) {
        types.push(typeName);
      }
    }
    return types;
  }

  private findTypesWithNameAttribute(): string[] {
    const types: string[] = [];
    for (const [typeName, descriptor] of this.introspection.types) {
      if (descriptor.attributes.some((attribute) => attribute.name === 'name')) {
        types.push(typeName);
      }
    }
    return types;
  }

  private findBelongsToType(fromType: string, toType: string): boolean {
    const descriptor = this.introspection.types.get(fromType);
    if (!descriptor) { return false; }
    return descriptor.relationships.some(
      (relationship) => relationship.kind === 'belongsTo' && relationship.relatedType === toType,
    );
  }

  private findTypeWithBelongsTo(toType: string): string | null {
    for (const [typeName, descriptor] of this.introspection.types) {
      if (typeName === toType) { continue; }
      for (const relationship of descriptor.relationships) {
        if (relationship.kind === 'belongsTo' && relationship.relatedType === toType) {
          return typeName;
        }
      }
    }
    return null;
  }

  // ─── Intent Resolvers ───────────────────────────────────────

  private resolveFilterByName(query: string, typeMentions: TypeMatch[]): GenericIntent | null {
    const nameTypes = this.findTypesWithNameAttribute();
    if (nameTypes.length === 0) { return null; }

    const filterType = nameTypes[0]!;
    let target: string | null = null;

    for (const mention of typeMentions) {
      if (mention.typeName !== filterType) {
        target = mention.typeName;
        break;
      }
    }

    if (!target) {
      const linked = this.findTypeWithBelongsTo(filterType);
      target = linked ?? this.introspection.typeNames[0] ?? null;
    }

    if (!target) { return null; }

    const filterValue = this.extractValueAfterPreposition(query);

    return {
      target,
      filterType,
      filterAttribute: 'name',
      filterValue,
      throughType: null,
      search: null,
      limit: null,
      confidence: 0,
    };
  }

  private resolveFilterByTitle(query: string, typeMentions: TypeMatch[]): GenericIntent | null {
    const titleTypes = this.findTypesWithTitleAttribute();
    if (titleTypes.length === 0) { return null; }

    const filterType = titleTypes[0]!;
    let target: string | null = null;

    for (const mention of typeMentions) {
      if (mention.typeName !== filterType) {
        target = mention.typeName;
        break;
      }
    }

    if (!target) {
      const linked = this.findTypeWithBelongsTo(filterType);
      target = linked ?? this.introspection.typeNames[0] ?? null;
    }

    if (!target) { return null; }

    const filterValue = this.extractTitleValue(query, filterType);

    return {
      target,
      filterType,
      filterAttribute: 'title',
      filterValue,
      throughType: null,
      search: null,
      limit: null,
      confidence: 0,
    };
  }

  private resolveWhoCreated(query: string, _typeMentions: TypeMatch[]): GenericIntent | null {
    const titleTypes = this.findTypesWithTitleAttribute();
    const nameTypes = this.findTypesWithNameAttribute();

    if (titleTypes.length === 0 || nameTypes.length === 0) { return null; }

    const filterType = titleTypes[0]!;
    const target = nameTypes[0]!;

    const filterValue = this.extractCreatedValue(query, filterType);

    return {
      target,
      filterType,
      filterAttribute: 'title',
      filterValue,
      throughType: null,
      search: null,
      limit: null,
      confidence: 0,
    };
  }

  private resolveWhoInteracted(query: string, _typeMentions: TypeMatch[]): GenericIntent | null {
    const titleTypes = this.findTypesWithTitleAttribute();
    const nameTypes = this.findTypesWithNameAttribute();

    if (titleTypes.length === 0 || nameTypes.length === 0) { return null; }

    const filterType = titleTypes[0]!;
    const target = nameTypes[0]!;

    let throughType: string | null = null;
    for (const [typeName, descriptor] of this.introspection.types) {
      if (typeName === target || typeName === filterType) { continue; }
      const belongsToTarget = descriptor.relationships.some(
        (relationship) => relationship.kind === 'belongsTo' && relationship.relatedType === target,
      );
      const belongsToFilter = descriptor.relationships.some(
        (relationship) => relationship.kind === 'belongsTo' && relationship.relatedType === filterType,
      );
      if (belongsToTarget && belongsToFilter) {
        throughType = typeName;
        break;
      }
    }

    const filterValue = this.extractTitleValue(query, filterType);

    return {
      target,
      filterType,
      filterAttribute: 'title',
      filterValue,
      throughType,
      search: null,
      limit: null,
      confidence: 0,
    };
  }

  private resolveMultiHop(query: string, typeMentions: TypeMatch[]): GenericIntent | null {
    const nameTypes = this.findTypesWithNameAttribute();
    if (nameTypes.length === 0) { return null; }

    const filterType = nameTypes[0]!;
    let target: string | null = null;
    let throughType: string | null = null;

    const firstMention = typeMentions[0];
    const secondMention = typeMentions[1];

    if (typeMentions.length >= 2 && firstMention && secondMention) {
      target = firstMention.typeName;
      throughType = secondMention.typeName !== target ? secondMention.typeName : null;
    } else if (firstMention) {
      target = firstMention.typeName;
    }

    if (!target) {
      target = this.introspection.typeNames.find((typeName) => typeName !== filterType)
        ?? this.introspection.typeNames[0] ?? null;
    }

    if (!target) { return null; }

    const filterValue = this.extractValueAfterPreposition(query);

    return {
      target,
      filterType,
      filterAttribute: 'name',
      filterValue,
      throughType,
      search: null,
      limit: null,
      confidence: 0,
    };
  }

  private resolveSearch(query: string, typeMentions: TypeMatch[]): GenericIntent | null {
    const firstMention = typeMentions[0];
    const target = firstMention
      ? firstMention.typeName
      : this.introspection.typeNames[0];

    if (!target) { return null; }

    const searchText = this.extractSearchText(query);

    return {
      target,
      filterType: null,
      filterAttribute: null,
      filterValue: null,
      throughType: null,
      search: searchText,
      limit: null,
      confidence: 0,
    };
  }

  private resolveListRecent(query: string, typeMentions: TypeMatch[]): GenericIntent | null {
    const firstMention = typeMentions[0];
    const target = firstMention
      ? firstMention.typeName
      : this.introspection.typeNames[0];

    if (!target) { return null; }

    const limit = this.extractLimit(query);

    return {
      target,
      filterType: null,
      filterAttribute: null,
      filterValue: null,
      throughType: null,
      search: null,
      limit,
      confidence: 0,
    };
  }

  private resolveProfile(query: string, typeMentions: TypeMatch[]): GenericIntent | null {
    const nameTypes = this.findTypesWithNameAttribute();
    if (nameTypes.length === 0) { return null; }

    const firstMention = typeMentions[0];
    const target = firstMention && nameTypes.includes(firstMention.typeName)
      ? firstMention.typeName
      : nameTypes[0]!;

    const filterValue = this.extractValueAfterPreposition(query);

    return {
      target,
      filterType: target,
      filterAttribute: 'name',
      filterValue,
      throughType: null,
      search: null,
      limit: null,
      confidence: 0,
    };
  }

  // ─── Phase 3: Value Extraction ──────────────────────────────

  private extractValueAfterPreposition(query: string): string | null {
    const normalized = query.replace(/[?!.]+$/, '').trim();

    const possessivePattern = /(.+?)'s\s+/i;
    const possessiveMatch = normalized.match(possessivePattern);
    if (possessiveMatch) { return possessiveMatch[1]!.trim(); }

    const prepositionPattern = /(?:by|from|for|of|on|about|de|del|por)\s+(?:the\s+)?(?:(?:user|post|comment|usuario)\s+)?(.+?)\s*$/i;
    const match = normalized.match(prepositionPattern);
    if (match) { return match[1]!.trim(); }

    return this.extractProperNoun(normalized);
  }

  private extractProperNoun(text: string): string | null {
    const typeNames = new Set<string>();
    for (const typeName of this.introspection.typeNames) {
      typeNames.add(typeName.toLowerCase());
      typeNames.add(pluralize(typeName).toLowerCase());
    }

    const stopWords = new Set([
      'i', 'me', 'my', 'the', 'a', 'an', 'is', 'are', 'was', 'were',
      'what', 'who', 'which', 'where', 'when', 'how', 'did', 'do', 'does',
      'show', 'get', 'find', 'list', 'give', 'tell', 'want', 'see', 'has',
      'have', 'had', 'all', 'any', 'some', 'every', 'most', 'latest',
      'recent', 'last', 'new', 'everything', 'something', 'about', 'to',
    ]);

    const words = text.split(/\s+/);
    for (const word of words) {
      const cleaned = word.replace(/[^a-zA-Z]/g, '');
      if (
        cleaned.length > 1
        && /^[A-Z]/.test(cleaned)
        && !stopWords.has(cleaned.toLowerCase())
        && !typeNames.has(cleaned.toLowerCase())
      ) {
        return cleaned;
      }
    }
    return null;
  }

  private extractTitleValue(query: string, filterType: string): string | null {
    const normalized = query.replace(/[?!.]+$/, '').trim();
    const filterPlural = pluralize(filterType);

    const trailingTypePattern = new RegExp(
      `(?:on|about|of)\\s+(?:the\\s+)?(.+?)\\s+(?:${filterType}|${filterPlural})\\s*$`,
      'i',
    );
    const trailingMatch = normalized.match(trailingTypePattern);
    if (trailingMatch) { return trailingMatch[1]!.trim(); }

    const prepositionPattern = /(?:on|about|of|for)\s+(?:the\s+)?(.+?)\s*$/i;
    const match = normalized.match(prepositionPattern);
    return match ? match[1]!.trim() : null;
  }

  private extractCreatedValue(query: string, filterType: string): string | null {
    const normalized = query.replace(/[?!.]+$/, '').trim();
    const filterPlural = pluralize(filterType);

    const trailingTypePattern = new RegExp(
      `(?:wrote|created|authored|made)\\s+(?:the\\s+)?(.+?)\\s+(?:${filterType}|${filterPlural})\\s*$`,
      'i',
    );
    const trailingMatch = normalized.match(trailingTypePattern);
    if (trailingMatch) { return trailingMatch[1]!.trim(); }

    const verbPattern = /(?:wrote|created|authored|made|escribió)\s+(.+?)\s*$/i;
    const match = normalized.match(verbPattern);
    return match ? match[1]!.trim() : null;
  }

  private extractSearchText(query: string): string | null {
    const searchPattern = /(?:about|for|with|containing|sobre|con)\s+(.+?)\s*$/i;
    const match = query.match(searchPattern);
    if (match) { return match[1]!.trim(); }

    const afterTypePattern = /(?:search|find|buscar?)\s+\S+\s+(.+?)\s*$/i;
    const afterTypeMatch = query.match(afterTypePattern);
    return afterTypeMatch ? afterTypeMatch[1]!.trim() : null;
  }

  private extractLimit(query: string): number {
    const limitPattern = /(\d+)/;
    const match = query.match(limitPattern);
    if (match) { return Math.max(1, Math.min(100, parseInt(match[1]!, 10))); }
    return 10;
  }
}
