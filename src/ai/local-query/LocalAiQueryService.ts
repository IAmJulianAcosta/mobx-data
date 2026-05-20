import type { Store } from '@mobx-data/store';
import type {
  LocalAiIntentParser,
  LocalAiQueryResult,
  GenericIntent,
} from './LocalAiTypes.js';
import { NotADataQueryError } from './LocalAiTypes.js';
import type { LocalAiToolRegistry } from './LocalAiToolRegistry.js';
import type { GenericQueryExecutor } from './GenericQueryExecutor.js';
import type { LocalAiResultFormatter } from './LocalAiResultFormatter.js';

export class LocalAiQueryService {
  private readonly parser: LocalAiIntentParser;
  private readonly toolRegistry: LocalAiToolRegistry | null;
  private readonly executor: GenericQueryExecutor | null;
  private readonly formatter: LocalAiResultFormatter;
  private readonly store: Store;

  public constructor(
    parser: LocalAiIntentParser,
    toolRegistry: LocalAiToolRegistry,
    formatter: LocalAiResultFormatter,
    store: Store,
  ) {
    this.parser = parser;
    this.toolRegistry = toolRegistry;
    this.executor = null;
    this.formatter = formatter;
    this.store = store;
  }

  public static createGeneric(
    parser: LocalAiIntentParser,
    executor: GenericQueryExecutor,
    formatter: LocalAiResultFormatter,
    store: Store,
  ): LocalAiQueryService {
    const service = Object.create(LocalAiQueryService.prototype) as LocalAiQueryService;
    Object.assign(service, {
      parser,
      toolRegistry: null,
      executor,
      formatter,
      store,
    });
    return service;
  }

  public async query(query: string): Promise<LocalAiQueryResult> {
    if (!query || query.trim().length === 0) {
      return {
        status: 'validation_error',
        message: 'Query cannot be empty.',
      };
    }

    const intent = await this.parser.parse(query);
    if (!intent) {
      return {
        status: 'unsupported',
        message: 'I could not understand your query.',
      };
    }

    if (this.executor) {
      const genericIntent = intent.arguments as GenericIntent;
      if (genericIntent.target === 'unsupported') {
        throw new NotADataQueryError(query);
      }
      const result = await this.executor.execute(genericIntent, this.store);
      return { ...result, intent: intent.intent, parsedIntent: genericIntent as unknown };
    }

    const result = await this.toolRegistry!.execute(intent, this.store);
    return { ...result, intent: intent.intent };
  }

  public async queryFormatted(query: string): Promise<{ result: LocalAiQueryResult; formatted: string }> {
    const result = await this.query(query);
    const formatted = this.formatter.format(result);
    return { result, formatted };
  }
}
