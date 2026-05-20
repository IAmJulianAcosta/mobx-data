import type {
  LocalAiIntent,
  LocalAiIntentParser,
  LocalAiIntentName,
} from './LocalAiTypes.js';

interface PatternRule {
  intent: LocalAiIntentName;
  patterns: RegExp[];
  extractArguments: (match: RegExpMatchArray) => Record<string, unknown>;
  confidence: number;
}

const RULES: PatternRule[] = [
  {
    intent: 'get_posts_by_user',
    patterns: [
      /(?:dame|muestra|show|get|find|list)\s+(?:todos?\s+)?(?:los?\s+)?posts?\s+(?:del?\s+|de\s+|from\s+|by\s+|for\s+)(?:usuario?\s+|user\s+)?(\S+)/i,
      /posts?\s+(?:del?\s+|de\s+|from\s+|by\s+|for\s+)(?:usuario?\s+|user\s+)?(\S+)/i,
    ],
    extractArguments: (match: RegExpMatchArray) => ({ userName: match[1] }),
    confidence: 0.9,
  },
  {
    intent: 'get_user_profile',
    patterns: [
      /(?:dame|muestra|show|get|find)\s+(?:el\s+)?(?:perfil|profile)\s+(?:del?\s+|de\s+|for\s+|of\s+)(?:usuario?\s+|user\s+)?(\S+)/i,
      /(?:perfil|profile)\s+(?:del?\s+|de\s+|for\s+|of\s+)(?:usuario?\s+|user\s+)?(\S+)/i,
      /(?:dame|muestra|show|get|find)\s+(?:usuario?\s+|user\s+)(\S+)/i,
    ],
    extractArguments: (match: RegExpMatchArray) => ({ userName: match[1] }),
    confidence: 0.85,
  },
  {
    intent: 'get_comments_by_post',
    patterns: [
      /(?:dame|muestra|show|get|find|list)\s+(?:todos?\s+)?(?:los?\s+)?(?:comentarios|comments)\s+(?:del?\s+|de\s+|for\s+|of\s+|from\s+)(?:post\s+)?(\S+)/i,
      /(?:comentarios|comments)\s+(?:del?\s+|de\s+|for\s+|of\s+|from\s+)(?:post\s+)?(\S+)/i,
    ],
    extractArguments: (match: RegExpMatchArray) => {
      const value = match[1]!;
      if (/^\d+$/.test(value)) {
        return { postId: value };
      }
      return { postTitle: value };
    },
    confidence: 0.9,
  },
  {
    intent: 'search_posts',
    patterns: [
      /(?:buscar?|search|find)\s+posts?\s+(?:sobre|about|with|containing)\s+(.+)/i,
      /(?:buscar?|search)\s+(.+)\s+(?:en|in)\s+posts?/i,
    ],
    extractArguments: (match: RegExpMatchArray) => ({ text: match[1]!.trim() }),
    confidence: 0.8,
  },
  {
    intent: 'get_recent_posts',
    patterns: [
      /(?:dame|muestra|show|get|list)\s+(?:los?\s+)?(?:\d+\s+)?(?:posts?\s+)?(?:recientes|recent)/i,
      /(?:posts?\s+recientes|recent\s+posts?)/i,
      /(?:últimos?|latest|last)\s+(?:(\d+)\s+)?posts?/i,
    ],
    extractArguments: (match: RegExpMatchArray) => {
      const limitCapture = match[1];
      if (limitCapture && /^\d+$/.test(limitCapture)) {
        return { limit: parseInt(limitCapture, 10) };
      }
      return {};
    },
    confidence: 0.85,
  },
];

export class DeterministicLocalAiIntentParser implements LocalAiIntentParser {
  public async parse(query: string): Promise<LocalAiIntent | null> {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      return null;
    }

    for (const rule of RULES) {
      for (const pattern of rule.patterns) {
        const match = trimmed.match(pattern);
        if (match) {
          return {
            intent: rule.intent,
            arguments: rule.extractArguments(match),
            originalQuery: trimmed,
            confidence: rule.confidence,
          };
        }
      }
    }

    return null;
  }
}
