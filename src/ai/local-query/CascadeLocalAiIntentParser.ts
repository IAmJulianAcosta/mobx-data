import type { LocalAiIntent, LocalAiIntentParser } from './LocalAiTypes.js';

export class CascadeLocalAiIntentParser implements LocalAiIntentParser {
  private readonly parsers: LocalAiIntentParser[];

  public constructor(parsers: LocalAiIntentParser[]) {
    this.parsers = parsers;
  }

  public async parse(query: string): Promise<LocalAiIntent | null> {
    for (const parser of this.parsers) {
      try {
        const result = await parser.parse(query);
        if (result) {
          return result;
        }
      } catch {
        continue;
      }
    }
    return null;
  }
}
