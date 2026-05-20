import type { LocalAiIntent, LocalAiIntentParser } from './LocalAiTypes.js';
/**
 * Abstract placeholder for model-backed intent parsing.
 *
 * For a working implementation, use WebLlmIntentParser (powered by Qwen3-0.6B via WebLLM).
 *
 * Other possible backends:
 * - Chrome Prompt API (built-in browser model)
 * - Transformers.js (classification pipeline)
 * - Remote LLM if explicitly configured
 *
 * Any model-backed parser must only output structured intents — it must not execute tools directly.
 */
export declare class ModelBackedLocalAiIntentParser implements LocalAiIntentParser {
    parse(_query: string): Promise<LocalAiIntent | null>;
}
//# sourceMappingURL=ModelBackedLocalAiIntentParser.d.ts.map