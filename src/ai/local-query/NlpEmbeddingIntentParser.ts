import type {
  GenericIntent,
  LocalAiIntent,
  LocalAiIntentParser,
  SchemaIntrospectionResult,
} from './LocalAiTypes.js';

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

const DEFAULT_MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
const DEFAULT_SIMILARITY_THRESHOLD = 0.25;

interface IntentTemplate {
  text: string;
  category: string;
  target: string;
  filterType: string | null;
  filterAttribute: string | null;
  throughType: string | null;
  extractName: boolean;
  extractTitle: boolean;
  extractSearch: boolean;
  extractLimit: boolean;
  embedding?: number[];
}

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

interface CompromiseDocument {
  people(): CompromiseView;
  possessives(): CompromiseView;
  numbers(): CompromiseNumbers;
  match(pattern: string): CompromiseView;
}

interface CompromiseView {
  text(): string;
  out(format: string): string[];
}

interface CompromiseNumbers extends CompromiseView {
  get(): number | number[];
}

type CompromiseFactory = (text: string) => CompromiseDocument;

function pluralize(typeName: string): string {
  if (typeName.endsWith('s')) { return typeName; }
  if (typeName.endsWith('y')) { return `${typeName.slice(0, -1)}ies`; }
  return `${typeName}s`;
}

export class NlpEmbeddingIntentParser implements LocalAiIntentParser {
  private pipeline: FeatureExtractionPipeline | null = null;
  private initializationPromise: Promise<void> | null = null;
  private templates: IntentTemplate[] = [];
  private readonly introspection: SchemaIntrospectionResult;
  private readonly modelId: string;
  private readonly onProgress?: (report: NlpEmbeddingProgressReport) => void;
  private readonly similarityThreshold: number;
  private nlp: CompromiseFactory | null = null;

  public constructor(
    introspection: SchemaIntrospectionResult,
    options: NlpEmbeddingIntentParserOptions = {},
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
    this.initializationPromise = this.loadModelsAndTemplates();
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
      this.templates = [];
      this.nlp = null;
    }
  }

  public get isLoaded(): boolean {
    return this.pipeline !== null;
  }

  public async parse(query: string): Promise<LocalAiIntent<GenericIntent> | null> {
    const trimmed = query.trim();
    if (trimmed.length === 0) { return null; }

    await this.initialize();

    const corrected = this.correctTypos(trimmed);
    const queryEmbedding = await this.embed(corrected);
    const match = this.findBestTemplate(queryEmbedding);

    if (!match || match.score < this.similarityThreshold) {
      return null;
    }

    const { template } = match;

    if (template.category === 'unsupported') {
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
          confidence: match.score,
        },
        originalQuery: trimmed,
        confidence: match.score,
      };
    }

    const genericIntent = this.buildIntent(trimmed, template);
    genericIntent.confidence = match.score;

    return {
      intent: `generic:${genericIntent.target}`,
      arguments: genericIntent,
      originalQuery: trimmed,
      confidence: match.score,
    };
  }

  // ─── Initialization ──────────────────────────────────────────

  private async loadModelsAndTemplates(): Promise<void> {
    let transformers: TransformersModule;
    try {
      transformers = await import('@huggingface/transformers') as unknown as TransformersModule;
    } catch {
      throw new Error(
        '@huggingface/transformers is required. Install: pnpm add @huggingface/transformers',
      );
    }

    try {
      const nlpModule = await import('compromise') as { default: CompromiseFactory };
      this.nlp = nlpModule.default;
    } catch {
      throw new Error(
        'compromise is required. Install: pnpm add compromise',
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

    const rawTemplates = this.generateTemplates();

    this.templates = [];
    for (const template of rawTemplates) {
      const embedding = await this.embed(template.text);
      this.templates.push({ ...template, embedding });
    }
  }

  // ─── Template Generation (auto from schema) ──────────────────

  private generateTemplates(): IntentTemplate[] {
    const templates: IntentTemplate[] = [];

    for (const [typeName, descriptor] of this.introspection.types) {
      const plural = pluralize(typeName);

      templates.push(...this.makeListRecentTemplates(typeName, plural));

      const hasStringAttributes = descriptor.attributes.some(
        (attribute) => attribute.type === 'string' || attribute.type === null,
      );
      const isContentType = descriptor.attributes.some(
        (attribute) => attribute.name === 'title' || attribute.name === 'body'
          || attribute.name === 'description' || attribute.name === 'content',
      );
      if (hasStringAttributes) {
        templates.push(...this.makeSearchTemplates(typeName, plural, isContentType));
      }

      const hasName = descriptor.attributes.some((attribute) => attribute.name === 'name');
      if (hasName) {
        templates.push(...this.makeProfileTemplates(typeName));
      }

      for (const relationship of descriptor.relationships) {
        if (relationship.kind !== 'belongsTo') { continue; }

        const relatedDescriptor = this.introspection.types.get(relationship.relatedType);
        if (!relatedDescriptor) { continue; }

        const relatedHasName = relatedDescriptor.attributes.some(
          (attribute) => attribute.name === 'name',
        );
        const relatedHasTitle = relatedDescriptor.attributes.some(
          (attribute) => attribute.name === 'title',
        );

        if (relatedHasName) {
          templates.push(...this.makeFilterByNameTemplates(typeName, plural, relationship.relatedType, isContentType));
          templates.push(...this.makeCompoundTemplates(typeName, plural, relationship.relatedType));
        }

        if (relatedHasTitle) {
          templates.push(...this.makeOnAboutTemplates(typeName, plural, relationship.relatedType));
        }
      }
    }

    templates.push(...this.makeMultiHopTemplates());
    templates.push(...this.makeWhoCreatedTemplates());
    templates.push(...this.makeWhoInteractedTemplates());
    templates.push(...this.makeUnsupportedTemplates());

    return templates;
  }

  private makeFilterByNameTemplates(
    target: string,
    targetPlural: string,
    filterType: string,
    isContentType: boolean,
  ): IntentTemplate[] {
    const base = {
      category: 'filter_by_name',
      target,
      filterType,
      filterAttribute: 'name',
      throughType: null,
      extractName: true,
      extractTitle: false,
      extractSearch: false,
      extractLimit: false,
    };

    const templates = [
      { text: `${targetPlural} by someone`, ...base },
      { text: `show me ${targetPlural} from someone`, ...base },
      { text: `someone's ${targetPlural}`, ...base },
      { text: `${targetPlural} written by someone`, ...base },
      { text: `find ${targetPlural} from someone`, ...base },
      { text: 'everything someone posted', ...base },
      { text: 'what did someone write', ...base },
      { text: 'what someone has been writing lately', ...base },
      { text: `someone ${targetPlural}`, ...base },
      { text: 'show me what someone wrote', ...base },
      { text: 'content from someone', ...base },
      { text: 'let me know what someone wrote', ...base },
      { text: 'got anything from someone', ...base },
      { text: 'everything written by someone', ...base },
      { text: 'what has someone contributed', ...base },
    ];

    if (isContentType) {
      templates.push(
        { text: 'articles by someone', ...base },
        { text: 'entries by someone', ...base },
        { text: 'writings by someone', ...base },
        { text: 'pieces by someone', ...base },
      );
    }

    return templates;
  }

  private makeOnAboutTemplates(
    target: string,
    targetPlural: string,
    filterType: string,
  ): IntentTemplate[] {
    const base = {
      category: 'on_about',
      target,
      filterType,
      filterAttribute: 'title',
      throughType: null,
      extractName: false,
      extractTitle: true,
      extractSearch: false,
      extractLimit: false,
    };

    return [
      { text: `${targetPlural} on a specific ${filterType}`, ...base },
      { text: `${targetPlural} about a ${filterType}`, ...base },
      { text: `${targetPlural} for the ${filterType}`, ...base },
      { text: `show ${targetPlural} on a ${filterType}`, ...base },
      { text: `reactions to a ${filterType}`, ...base },
      { text: `feedback on a ${filterType}`, ...base },
      { text: `responses to a ${filterType}`, ...base },
      { text: `replies on a ${filterType}`, ...base },
      { text: `${targetPlural} on something specific`, ...base },
      { text: `${targetPlural} on the thing`, ...base },
      { text: `show me ${targetPlural} on this`, ...base },
      { text: `what ${targetPlural} are there on the item`, ...base },
      { text: `I would like to see ${targetPlural} on something`, ...base },
      { text: `${targetPlural} on the named item`, ...base },
      { text: `${targetPlural} on the titled item`, ...base },
      { text: `${targetPlural} on a titled thing`, ...base },
      { text: `the ${targetPlural} left on a thing`, ...base },
    ];
  }

  private makeCompoundTemplates(
    target: string,
    targetPlural: string,
    filterType: string,
  ): IntentTemplate[] {
    const base = {
      category: 'compound',
      target,
      filterType,
      filterAttribute: 'name',
      throughType: null,
      extractName: true,
      extractTitle: false,
      extractSearch: true,
      extractLimit: false,
    };

    return [
      { text: `${targetPlural} by someone about something`, ...base },
      { text: `someone's ${targetPlural} about a topic`, ...base },
      { text: `${targetPlural} from someone about something`, ...base },
      { text: `show me ${targetPlural} from someone about a topic`, ...base },
      { text: `${targetPlural} about a topic by someone`, ...base },
    ];
  }

  private makeSearchTemplates(
    target: string,
    targetPlural: string,
    isContentType: boolean,
  ): IntentTemplate[] {
    const base = {
      category: 'search',
      target,
      filterType: null,
      filterAttribute: null,
      throughType: null,
      extractName: false,
      extractTitle: false,
      extractSearch: true,
      extractLimit: false,
    };

    const templates = [
      { text: `search ${targetPlural} about something`, ...base },
      { text: `find ${targetPlural} about something`, ...base },
      { text: `${targetPlural} about a topic`, ...base },
      { text: `${targetPlural} related to something`, ...base },
      { text: `${targetPlural} mentioning something`, ...base },
      { text: `look for ${targetPlural} discussing something`, ...base },
      { text: `${targetPlural} that discuss a topic`, ...base },
      { text: `${targetPlural} where the topic is something`, ...base },
      { text: `looking for ${targetPlural} about a subject`, ...base },
    ];

    if (isContentType) {
      templates.push(
        { text: 'content about a subject', ...base },
        { text: 'any discussions about something', ...base },
        { text: 'articles about a topic', ...base },
        { text: 'writings related to something', ...base },
        { text: 'entries about a subject', ...base },
        { text: 'anything about a topic', ...base },
        { text: 'content related to something specific', ...base },
      );
    }

    return templates;
  }

  private makeListRecentTemplates(target: string, targetPlural: string): IntentTemplate[] {
    const base = {
      category: 'list_recent',
      target,
      filterType: null,
      filterAttribute: null,
      throughType: null,
      extractName: false,
      extractTitle: false,
      extractSearch: false,
      extractLimit: true,
    };

    return [
      { text: `recent ${targetPlural}`, ...base },
      { text: `latest ${targetPlural}`, ...base },
      { text: `newest ${targetPlural}`, ...base },
      { text: `show me the latest ${targetPlural}`, ...base },
      { text: `last few ${targetPlural}`, ...base },
      { text: `could you show me the latest ${targetPlural}`, ...base },
    ];
  }

  private makeProfileTemplates(target: string): IntentTemplate[] {
    const base = {
      category: 'profile',
      target,
      filterType: target,
      filterAttribute: 'name',
      throughType: null,
      extractName: true,
      extractTitle: false,
      extractSearch: false,
      extractLimit: false,
    };

    return [
      { text: 'profile of someone', ...base },
      { text: 'get profile for someone', ...base },
      { text: 'tell me about someone', ...base },
      { text: 'who is someone', ...base },
      { text: 'information about someone', ...base },
      { text: 'can someone tell me about a person', ...base },
      { text: `${target} someone`, ...base },
    ];
  }

  private makeMultiHopTemplates(): IntentTemplate[] {
    const templates: IntentTemplate[] = [];

    for (const [typeName, descriptor] of this.introspection.types) {
      const plural = pluralize(typeName);

      for (const relationship of descriptor.relationships) {
        if (relationship.kind !== 'belongsTo') { continue; }

        const intermediateType = relationship.relatedType;
        const intermediateDescriptor = this.introspection.types.get(intermediateType);
        if (!intermediateDescriptor) { continue; }

        const intermediatePlural = pluralize(intermediateType);

        for (const intermediateRelationship of intermediateDescriptor.relationships) {
          if (intermediateRelationship.kind !== 'belongsTo') { continue; }

          const finalType = intermediateRelationship.relatedType;
          if (finalType === typeName) { continue; }

          const finalDescriptor = this.introspection.types.get(finalType);
          if (!finalDescriptor) { continue; }

          const finalHasName = finalDescriptor.attributes.some(
            (attribute) => attribute.name === 'name',
          );
          if (!finalHasName) { continue; }

          const base = {
            category: 'multi_hop',
            target: typeName,
            filterType: finalType,
            filterAttribute: 'name',
            throughType: intermediateType,
            extractName: true,
            extractTitle: false,
            extractSearch: false,
            extractLimit: false,
          };

          templates.push(
            { text: `${plural} on ${intermediatePlural} by someone`, ...base },
            { text: `${plural} on someone's ${intermediatePlural}`, ...base },
            { text: `all ${plural} on ${intermediatePlural} from someone`, ...base },
            { text: `all the ${plural} people left on someone's ${intermediatePlural}`, ...base },
          );
        }
      }
    }

    return templates;
  }

  private makeWhoCreatedTemplates(): IntentTemplate[] {
    const templates: IntentTemplate[] = [];

    for (const [typeName, descriptor] of this.introspection.types) {
      const hasTitle = descriptor.attributes.some((attribute) => attribute.name === 'title');
      if (!hasTitle) { continue; }

      for (const relationship of descriptor.relationships) {
        if (relationship.kind !== 'belongsTo') { continue; }

        const relatedDescriptor = this.introspection.types.get(relationship.relatedType);
        if (!relatedDescriptor) { continue; }

        const relatedHasName = relatedDescriptor.attributes.some(
          (attribute) => attribute.name === 'name',
        );
        if (!relatedHasName) { continue; }

        const base = {
          category: 'who_created',
          target: relationship.relatedType,
          filterType: typeName,
          filterAttribute: 'title',
          throughType: null,
          extractName: false,
          extractTitle: true,
          extractSearch: false,
          extractLimit: false,
        };

        templates.push(
          { text: `who wrote the ${typeName}`, ...base },
          { text: `who created the ${typeName}`, ...base },
          { text: `who authored the ${typeName}`, ...base },
          { text: `author of the ${typeName}`, ...base },
          { text: `who is the author of the ${typeName}`, ...base },
          { text: `I wonder who wrote that ${typeName}`, ...base },
          { text: 'who wrote something', ...base },
          { text: 'who is the author of something', ...base },
          { text: 'who authored something', ...base },
        );

        break;
      }
    }

    return templates;
  }

  private makeWhoInteractedTemplates(): IntentTemplate[] {
    const templates: IntentTemplate[] = [];

    for (const [titledType, titledDescriptor] of this.introspection.types) {
      const hasTitle = titledDescriptor.attributes.some(
        (attribute) => attribute.name === 'title',
      );
      if (!hasTitle) { continue; }

      for (const [intermediateType, intermediateDescriptor] of this.introspection.types) {
        if (intermediateType === titledType) { continue; }

        const belongsToTitled = intermediateDescriptor.relationships.some(
          (relationship) => relationship.kind === 'belongsTo'
            && relationship.relatedType === titledType,
        );
        if (!belongsToTitled) { continue; }

        for (const intermediateRelationship of intermediateDescriptor.relationships) {
          if (intermediateRelationship.kind !== 'belongsTo') { continue; }
          if (intermediateRelationship.relatedType === titledType) { continue; }

          const namedDescriptor = this.introspection.types.get(
            intermediateRelationship.relatedType,
          );
          if (!namedDescriptor) { continue; }

          const hasName = namedDescriptor.attributes.some(
            (attribute) => attribute.name === 'name',
          );
          if (!hasName) { continue; }

          const intermediatePlural = pluralize(intermediateType);
          const base = {
            category: 'who_interacted',
            target: intermediateRelationship.relatedType,
            filterType: titledType,
            filterAttribute: 'title',
            throughType: intermediateType,
            extractName: false,
            extractTitle: true,
            extractSearch: false,
            extractLimit: false,
          };

          templates.push(
            { text: `who has ${intermediatePlural} on the ${titledType}`, ...base },
            { text: `who left ${intermediatePlural} on the ${titledType}`, ...base },
            { text: `who commented on the ${titledType}`, ...base },
            { text: `people who interacted with the ${titledType}`, ...base },
            { text: `who are the people commenting on the ${titledType}`, ...base },
          );

          break;
        }
      }
    }

    return templates;
  }

  private makeUnsupportedTemplates(): IntentTemplate[] {
    const base = {
      category: 'unsupported',
      target: 'unsupported',
      filterType: null,
      filterAttribute: null,
      throughType: null,
      extractName: false,
      extractTitle: false,
      extractSearch: false,
      extractLimit: false,
    };

    return [
      { text: 'what is the weather today', ...base },
      { text: 'tell me a joke', ...base },
      { text: 'translate this to Spanish', ...base },
      { text: 'what time is it', ...base },
      { text: 'how are you doing', ...base },
    ];
  }

  // ─── Template Matching ──────────────────────────────────────

  private findBestTemplate(
    queryEmbedding: number[],
  ): { template: IntentTemplate; score: number } | null {
    let bestTemplate: IntentTemplate | null = null;
    let bestScore = -1;

    for (const template of this.templates) {
      if (!template.embedding) { continue; }
      const score = this.dotProduct(queryEmbedding, template.embedding);
      if (score > bestScore) {
        bestScore = score;
        bestTemplate = template;
      }
    }

    if (!bestTemplate) { return null; }
    return { template: bestTemplate, score: bestScore };
  }

  // ─── Intent Building ────────────────────────────────────────

  private buildIntent(query: string, template: IntentTemplate): GenericIntent {
    const intent: GenericIntent = {
      target: template.target,
      filterType: template.filterType,
      filterAttribute: template.filterAttribute,
      filterValue: null,
      throughType: template.throughType,
      search: null,
      limit: null,
      confidence: 0,
    };

    if (template.extractName) {
      intent.filterValue = this.extractPersonName(query);
    }

    if (template.extractTitle) {
      intent.filterValue = this.extractTitleValue(query);
    }

    if (template.extractSearch) {
      intent.search = this.extractSearchTerms(query, intent.filterValue);
    }

    if (template.extractLimit) {
      intent.limit = this.extractLimit(query);
    }

    return intent;
  }

  // ─── NLP Value Extraction ────────────────────────────────────

  private extractPersonName(query: string): string | null {
    if (!this.nlp) { return this.extractProperNounFallback(query); }

    const document = this.nlp(query);

    const people = document.people().text();
    if (people && people.trim().length > 0) {
      return people.trim().replace(/'s$/i, '');
    }

    const possessiveText = document.possessives().text();
    if (possessiveText) {
      const cleaned = possessiveText.replace(/'s$/i, '').trim();
      if (cleaned.length > 0 && this.isLikelyName(cleaned)) {
        return cleaned;
      }
    }

    return this.extractProperNounFallback(query);
  }

  private extractTitleValue(query: string): string | null {
    const normalized = query.replace(/[?!.]+$/, '').trim();

    const quotedMatch = normalized.match(/["'](.+?)["']/);
    if (quotedMatch) { return quotedMatch[1]!.trim(); }

    const cleaned = this.stripTrailingTypeWords(normalized);

    // "who wrote On MobX" → need to capture "On MobX" not just "MobX"
    const verbMatch = cleaned.match(
      /(?:wrote|authored|created|made)\s+(?:the\s+)?(.+?)\s*$/i,
    );
    if (verbMatch) { return verbMatch[1]!.trim(); }

    // "author of Hello World" / "comments on Hello World"
    const prepositionMatch = cleaned.match(
      /(?:on|about|of)\s+(?:the\s+)?(.+?)\s*$/i,
    );
    if (prepositionMatch) { return prepositionMatch[1]!.trim(); }

    return null;
  }

  private extractSearchTerms(query: string, knownName?: string | null): string | null {
    const normalized = query.replace(/[?!.]+$/, '').trim();

    const patterns = [
      /(?:about|regarding|related to|on the topic of)\s+(.+?)$/i,
      /(?:discuss(?:ing)?|contain(?:ing)?|mentioning)\s+(.+?)$/i,
      /(?:topic|subject)\s+(?:is|of)\s+(.+?)$/i,
    ];

    for (const pattern of patterns) {
      const match = normalized.match(pattern);
      if (match) {
        let topic = match[1]!.trim();
        if (knownName) {
          topic = topic.replace(
            new RegExp(`\\s*by\\s+${this.escapeRegex(knownName)}\\s*$`, 'i'),
            '',
          ).trim();
        }
        topic = this.stripTrailingTypeWords(topic).trim();
        if (topic.length > 0) { return topic; }
      }
    }

    return null;
  }

  private extractLimit(query: string): number {
    if (this.nlp) {
      const document = this.nlp(query);
      const numbers = document.numbers().get();
      if (typeof numbers === 'number') {
        return Math.max(1, Math.min(100, numbers));
      }
      if (Array.isArray(numbers) && numbers.length > 0 && typeof numbers[0] === 'number') {
        return Math.max(1, Math.min(100, numbers[0]));
      }
    }

    const numberMatch = query.match(/(\d+)/);
    if (numberMatch) {
      return Math.max(1, Math.min(100, parseInt(numberMatch[1]!, 10)));
    }

    return 10;
  }

  // ─── Typo Correction ──────────────────────────────────────────

  private correctTypos(query: string): string {
    const vocabulary = this.buildTypeVocabulary();
    const words = query.split(/(\s+)/);

    for (let index = 0; index < words.length; index++) {
      const word = words[index]!;
      if (/^\s+$/.test(word)) { continue; }
      if (/^[A-Z]/.test(word)) { continue; }

      const lower = word.toLowerCase().replace(/[^a-z]/g, '');
      if (lower.length < 3) { continue; }
      if (vocabulary.has(lower)) { continue; }

      for (const candidate of vocabulary) {
        if (Math.abs(candidate.length - lower.length) > 1) { continue; }
        const distance = this.damerauLevenshteinDistance(lower, candidate);
        if (distance === 1) {
          words[index] = candidate;
          break;
        }
      }
    }

    return words.join('');
  }

  private buildTypeVocabulary(): Set<string> {
    const vocabulary = new Set<string>();

    for (const typeName of this.introspection.typeNames) {
      vocabulary.add(typeName.toLowerCase());
      vocabulary.add(pluralize(typeName).toLowerCase());
    }

    return vocabulary;
  }

  private damerauLevenshteinDistance(source: string, target: string): number {
    const sourceLength = source.length;
    const targetLength = target.length;

    if (sourceLength === 0) { return targetLength; }
    if (targetLength === 0) { return sourceLength; }

    const matrix: number[][] = [];

    for (let row = 0; row <= sourceLength; row++) {
      matrix[row] = [row];
    }
    for (let column = 0; column <= targetLength; column++) {
      matrix[0]![column] = column;
    }

    for (let row = 1; row <= sourceLength; row++) {
      for (let column = 1; column <= targetLength; column++) {
        const cost = source[row - 1] === target[column - 1] ? 0 : 1;
        matrix[row]![column] = Math.min(
          matrix[row - 1]![column]! + 1,
          matrix[row]![column - 1]! + 1,
          matrix[row - 1]![column - 1]! + cost,
        );

        if (
          row > 1
          && column > 1
          && source[row - 1] === target[column - 2]
          && source[row - 2] === target[column - 1]
        ) {
          matrix[row]![column] = Math.min(
            matrix[row]![column]!,
            matrix[row - 2]![column - 2]! + 1,
          );
        }
      }
    }

    return matrix[sourceLength]![targetLength]!;
  }

  // ─── Helpers ─────────────────────────────────────────────────

  private stripTrailingTypeWords(text: string): string {
    let result = text;
    for (const typeName of this.introspection.typeNames) {
      const plural = pluralize(typeName);
      const pattern = new RegExp(
        `\\s+(?:${typeName}|${plural})\\s*$`,
        'i',
      );
      result = result.replace(pattern, '');
    }
    result = result.replace(
      /\s+(?:article|articles|entry|entries|piece|pieces|item|items)\s*$/i,
      '',
    );
    return result;
  }

  private isLikelyName(word: string): boolean {
    const lower = word.toLowerCase();
    for (const typeName of this.introspection.typeNames) {
      if (lower === typeName.toLowerCase()) { return false; }
      if (lower === pluralize(typeName).toLowerCase()) { return false; }
    }

    const stopWords = new Set([
      'i', 'me', 'my', 'the', 'a', 'an', 'is', 'are', 'was', 'were',
      'what', 'who', 'which', 'where', 'when', 'how', 'did', 'do', 'does',
      'show', 'get', 'find', 'list', 'give', 'tell', 'want', 'see', 'has',
      'have', 'had', 'all', 'any', 'some', 'every', 'most', 'latest',
      'recent', 'last', 'new', 'everything', 'something',
    ]);
    return !stopWords.has(lower);
  }

  private extractProperNounFallback(query: string): string | null {
    const typeNamesLower = new Set<string>();
    for (const typeName of this.introspection.typeNames) {
      typeNamesLower.add(typeName.toLowerCase());
      typeNamesLower.add(pluralize(typeName).toLowerCase());
    }

    const stopWords = new Set([
      'i', 'me', 'my', 'the', 'a', 'an', 'is', 'are', 'was', 'were',
      'what', 'who', 'which', 'where', 'when', 'how', 'did', 'do', 'does',
      'show', 'get', 'find', 'list', 'give', 'tell', 'want', 'see', 'has',
      'have', 'had', 'all', 'any', 'some', 'every', 'most', 'latest',
      'recent', 'last', 'new', 'everything', 'something', 'about', 'to',
      'for', 'from', 'by', 'on', 'with', 'please', 'could', 'would',
      'should', 'need', 'like', 'hey', 'hi', 'im', 'lmk', 'let',
      'know', 'can', 'anyone', 'somebody', 'someone', 'got', 'been',
      'lately', 'also', 'just', 'really', 'very', 'much',
    ]);

    const words = query.split(/\s+/);
    for (const word of words) {
      const cleaned = word.replace(/[^a-zA-Z']/g, '').replace(/'s$/i, '');
      if (
        cleaned.length > 1
        && /^[A-Z]/.test(cleaned)
        && !stopWords.has(cleaned.toLowerCase())
        && !typeNamesLower.has(cleaned.toLowerCase())
      ) {
        return cleaned;
      }
    }
    return null;
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

  private dotProduct(vectorA: number[], vectorB: number[]): number {
    let sum = 0;
    for (let index = 0; index < vectorA.length; index++) {
      sum += (vectorA[index] ?? 0) * (vectorB[index] ?? 0);
    }
    return sum;
  }
}
