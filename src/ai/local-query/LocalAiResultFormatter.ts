import type { Model } from '@mobx-data/model';
import type { LocalAiQueryResult, LocalAiQueryStatus } from './LocalAiTypes.js';

export class LocalAiResultFormatter {
  public format(result: LocalAiQueryResult): string {
    const handler = this.handlers[result.status];
    if (handler) {
      return handler(result);
    }
    return result.message;
  }

  private readonly handlers: Record<LocalAiQueryStatus, (result: LocalAiQueryResult) => string> = {
    success: (result) => {
      if (Array.isArray(result.data)) {
        return this.formatArrayResult(result);
      }
      if (result.data && typeof result.data === 'object') {
        return this.formatSingleResult(result);
      }
      return result.message;
    },
    not_found: (result) => result.message,
    unsupported: () => 'I don\'t understand that query. Try something like "show posts by julian" or "recent posts".',
    validation_error: (result) => `Invalid query: ${result.message}`,
    error: (result) => (result.error
      ? `Something went wrong: ${result.error}`
      : 'Something went wrong while processing the query.'),
  };

  private formatArrayResult(result: LocalAiQueryResult): string {
    const items = result.data as Model[];
    if (items.length === 0) {
      return result.message;
    }

    const lines = [result.message, ''];
    for (const item of items) {
      const record = item as unknown as Record<string, unknown>;
      const label = record.title ?? record.name ?? record.body ?? `#${item.id}`;
      lines.push(`  - ${label}`);
    }
    return lines.join('\n');
  }

  private formatSingleResult(result: LocalAiQueryResult): string {
    const record = result.data as unknown as Record<string, unknown>;
    const entries: string[] = [result.message, ''];
    for (const [key, value] of Object.entries(record)) {
      if (key.startsWith('_') || typeof value === 'function' || value === undefined) {
        continue;
      }
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        continue;
      }
      entries.push(`  ${key}: ${String(value)}`);
    }
    return entries.join('\n');
  }
}
