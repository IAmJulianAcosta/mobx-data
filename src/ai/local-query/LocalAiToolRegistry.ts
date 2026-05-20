import type { Store } from '@mobx-data/store';
import type {
  LocalAiIntentName,
  LocalAiIntent,
  LocalAiQueryResult,
  LocalAiTool,
} from './LocalAiTypes.js';

export class LocalAiToolRegistry {
  private readonly tools: Map<LocalAiIntentName, LocalAiTool> = new Map();

  public register(tool: LocalAiTool): void {
    this.tools.set(tool.name, tool);
  }

  public get(intent: LocalAiIntentName): LocalAiTool | undefined {
    return this.tools.get(intent);
  }

  public async execute(intent: LocalAiIntent, store: Store): Promise<LocalAiQueryResult> {
    const tool = this.tools.get(intent.intent as LocalAiIntentName);
    if (!tool) {
      return {
        status: 'error',
        intent: intent.intent,
        message: `No tool registered for intent "${intent.intent}".`,
      };
    }

    try {
      return await tool.execute(intent.arguments, store);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        status: 'error',
        intent: intent.intent,
        message: 'An unexpected error occurred while executing the query.',
        error: errorMessage,
      };
    }
  }
}
