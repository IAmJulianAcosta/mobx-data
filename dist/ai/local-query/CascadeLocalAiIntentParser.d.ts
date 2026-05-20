import type { LocalAiIntent, LocalAiIntentParser } from './LocalAiTypes.js';
export declare class CascadeLocalAiIntentParser implements LocalAiIntentParser {
    private readonly parsers;
    constructor(parsers: LocalAiIntentParser[]);
    parse(query: string): Promise<LocalAiIntent | null>;
}
//# sourceMappingURL=CascadeLocalAiIntentParser.d.ts.map