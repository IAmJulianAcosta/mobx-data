import type {
  GenericIntent,
  LocalAiIntent,
  LocalAiIntentParser,
  SchemaIntrospectionResult,
  SchemaTypeDescriptor,
} from './LocalAiTypes.js';

interface PatternRule {
  patterns: RegExp[];
  buildIntent: (match: RegExpMatchArray) => GenericIntent;
}

function pluralize(typeName: string): string {
  if (typeName.endsWith('s')) { return typeName; }
  if (typeName.endsWith('y')) { return `${typeName.slice(0, -1)}ies`; }
  return `${typeName}s`;
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const SPANISH_TYPE_ALIASES: Record<string, string[]> = {
  comment: ['comentario', 'comentarios'],
  post: ['publicación', 'publicacion', 'publicaciones'],
  user: ['usuario', 'usuarios'],
};

function typePatternFor(typeName: string): string {
  const typePlural = pluralize(typeName);
  const aliases = SPANISH_TYPE_ALIASES[typeName.toLowerCase()] ?? [];
  return [typeName, typePlural, ...aliases].map(escapeRegex).join('|');
}

export class DeterministicSchemaIntentParser implements LocalAiIntentParser {
  private readonly rules: PatternRule[];
  private readonly defaultContentType: string | null;
  private readonly personType: string | null;
  private readonly commentLikeType: string | null;

  constructor(introspection: SchemaIntrospectionResult) {
    this.defaultContentType = this.findDefaultContentType(introspection);
    this.personType = this.findPersonType(introspection);
    this.commentLikeType = this.findCommentLikeType(introspection);
    this.rules = this.buildRules(introspection);
  }

  public async parse(query: string): Promise<LocalAiIntent<GenericIntent> | null> {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      return null;
    }

    for (const rule of this.rules) {
      for (const pattern of rule.patterns) {
        const match = trimmed.match(pattern);
        if (match) {
          const intent = rule.buildIntent(match);
          return {
            intent: intent.target === 'unsupported' ? 'unsupported' : `generic:${intent.target}`,
            arguments: intent,
            originalQuery: trimmed,
            confidence: intent.confidence,
          };
        }
      }
    }

    return null;
  }

  private buildRules(introspection: SchemaIntrospectionResult): PatternRule[] {
    const rules: PatternRule[] = [];

    rules.push(...this.buildListRules(introspection));
    rules.push(...this.buildMultiHopTraversalRules(introspection));
    rules.push(...this.buildWhoTraversalRules(introspection));
    rules.push(...this.buildWhoCreatedRules(introspection));
    rules.push(...this.buildCompoundFilterSearchRules(introspection));
    rules.push(...this.buildSearchRules(introspection));
    rules.push(...this.buildOnAboutTraversalRules(introspection));
    rules.push(...this.buildSelfFilterRules(introspection));
    rules.push(...this.buildSingleHopTraversalRules(introspection));
    rules.push(...this.buildCatchAllRules(introspection));

    return rules;
  }

  private buildSelfFilterRules(introspection: SchemaIntrospectionResult): PatternRule[] {
    const rules: PatternRule[] = [];

    for (const [typeName, descriptor] of introspection.types) {
      const nameAttribute = this.findNameAttribute(descriptor);
      if (!nameAttribute) { continue; }

      const typePattern = escapeRegex(typeName);
      rules.push({
        patterns: [
          new RegExp(
            `(?:show|get|find|dame|muestra)\\s+(?:el\\s+)?(?:perfil|profile)\\s+(?:of|for|de|del)\\s+(?:${typePattern}\\s+)?(.+)`,
            'i',
          ),
          new RegExp(
            `(?:perfil|profile)\\s+(?:of|for|de|del)\\s+(?:${typePattern}\\s+)?(.+)`,
            'i',
          ),
          new RegExp(
            `(?:show|get|find|dame|muestra)\\s+(?:${typePattern})\\s+(\\S+)`,
            'i',
          ),
          new RegExp(
            'tell\\s+me\\s+about\\s+(.+?)\\s*$',
            'i',
          ),
          new RegExp(
            '(?:get|show|find)\\s+(?:me\\s+)?(.+?)\\s+(?:profile|perfil)\\s*$',
            'i',
          ),
          new RegExp(
            '(\\w+)\'s\\s+(?:profile|perfil)\\s*$',
            'i',
          ),
        ],
        buildIntent: (match: RegExpMatchArray): GenericIntent => ({
          target: typeName,
          filterType: typeName,
          filterAttribute: nameAttribute,
          filterValue: match[1]!.trim(),
          throughType: null,
          search: null,
          limit: null,
          confidence: 0.85,
        }),
      });
    }

    return rules;
  }

  private buildSingleHopTraversalRules(introspection: SchemaIntrospectionResult): PatternRule[] {
    const rules: PatternRule[] = [];

    for (const [typeName, descriptor] of introspection.types) {
      const typePatterns = typePatternFor(typeName);

      for (const relationship of descriptor.relationships) {
        if (relationship.kind !== 'belongsTo') { continue; }

        const relatedDescriptor = introspection.types.get(relationship.relatedType);
        if (!relatedDescriptor) { continue; }

        const relatedNameAttribute = this.findNameAttribute(relatedDescriptor);
        if (!relatedNameAttribute) { continue; }

        const { relatedType } = relationship;
        const relatedPatterns = typePatternFor(relatedType);

        rules.push({
          patterns: [
            new RegExp(
              `(?:show|get|find|list|dame|muestra)\\s+(?:todos?\\s+)?(?:los?\\s+)?(?:${typePatterns})\\s+(?:by|from|for|of|de|del|por)\\s+(?:(?:${relatedPatterns})\\s+)?(.+)`,
              'i',
            ),
            new RegExp(
              `(?:${typePatterns})\\s+(?:by|from|for|of|de|del|por)\\s+(?:(?:${relatedPatterns})\\s+)?(.+)`,
              'i',
            ),
            new RegExp(
              `(?:${typePatterns})\\s+(?:written|made|created|posted)\\s+(?:by|from)\\s+(.+)`,
              'i',
            ),
            new RegExp(
              `(\\w+)'s\\s+(?:${typePatterns})`,
              'i',
            ),
            new RegExp(
              `(?:show|get|find)\\s+(?:me\\s+)?(?:what\\s+)?(.+?)\\s+(?:${typePatterns}|posted|wrote|created)`,
              'i',
            ),
            new RegExp(
              `how\\s+many\\s+(?:${typePatterns})\\s+(?:does|do|did)\\s+(\\w+)\\s+have\\s*\\??\\s*$`,
              'i',
            ),
            new RegExp(
              `(?:latest|newest|recent|last)\\s+(?:${typePatterns})\\s+(?:by|from)\\s+(.+?)\\s*$`,
              'i',
            ),
          ],
          buildIntent: (match: RegExpMatchArray): GenericIntent => ({
            target: typeName,
            filterType: relatedType,
            filterAttribute: relatedNameAttribute,
            filterValue: match[1]!.trim(),
            throughType: null,
            search: null,
            limit: null,
            confidence: 0.9,
          }),
        });
      }
    }

    return rules;
  }

  private buildMultiHopTraversalRules(introspection: SchemaIntrospectionResult): PatternRule[] {
    const rules: PatternRule[] = [];

    for (const [targetType, targetDescriptor] of introspection.types) {
      const targetPatterns = typePatternFor(targetType);

      for (const relationship of targetDescriptor.relationships) {
        if (relationship.kind !== 'belongsTo') { continue; }

        const intermediateType = relationship.relatedType;
        const intermediateDescriptor = introspection.types.get(intermediateType);
        if (!intermediateDescriptor) { continue; }

        const intermediatePatterns = typePatternFor(intermediateType);

        for (const intermediateRelationship of intermediateDescriptor.relationships) {
          if (intermediateRelationship.kind !== 'belongsTo') { continue; }

          const filterType = intermediateRelationship.relatedType;
          if (filterType === targetType) { continue; }

          const filterDescriptor = introspection.types.get(filterType);
          if (!filterDescriptor) { continue; }

          const filterNameAttribute = this.findNameAttribute(filterDescriptor);
          if (!filterNameAttribute) { continue; }

          rules.push({
            patterns: [
              new RegExp(
                `(?:show|get|find|list|dame|muestra)\\s+(?:todos?\\s+)?(?:los?\\s+)?(?:${targetPatterns})\\s+(?:on|in|en|de|del)\\s+(?:los?\\s+)?(?:${intermediatePatterns})\\s+(?:by|from|of|de|del|por|hechos?\\s+por)\\s+(.+)`,
                'i',
              ),
              new RegExp(
                `(?:all\\s+)?(?:${targetPatterns})\\s+(?:on|in|en|de|del)\\s+(?:los?\\s+)?(?:${intermediatePatterns})\\s+(?:by|from|of|de|del|por|hechos?\\s+por)\\s+(.+)`,
                'i',
              ),
              new RegExp(
                `(?:${targetPatterns})\\s+(?:on|about)\\s+(?:the\\s+)?.+\\s+(?:by|from)\\s+(.+?)\\s*$`,
                'i',
              ),
              new RegExp(
                `^(?:${targetPatterns})\\s+(?:by|from)\\s+(\\w+)\\s+(?:on|about)\\s+(?:the\\s+)?.+\\s*$`,
                'i',
              ),
            ],
            buildIntent: (match: RegExpMatchArray): GenericIntent => ({
              target: targetType,
              filterType,
              filterAttribute: filterNameAttribute,
              filterValue: match[1]!.trim(),
              throughType: intermediateType,
              search: null,
              limit: null,
              confidence: 0.85,
            }),
          });
        }
      }
    }

    return rules;
  }

  private buildWhoCreatedRules(introspection: SchemaIntrospectionResult): PatternRule[] {
    const rules: PatternRule[] = [];

    for (const [typeName, descriptor] of introspection.types) {
      const titleAttribute = descriptor.attributes.find(
        (attribute) => attribute.name === 'title',
      );
      if (!titleAttribute) { continue; }

      const typePatterns = typePatternFor(typeName);

      for (const relationship of descriptor.relationships) {
        if (relationship.kind !== 'belongsTo') { continue; }

        const relatedDescriptor = introspection.types.get(relationship.relatedType);
        if (!relatedDescriptor) { continue; }

        const nameAttribute = relatedDescriptor.attributes.find(
          (attribute) => attribute.name === 'name',
        );
        if (!nameAttribute) { continue; }

        rules.push({
          patterns: [
            new RegExp(
              `who\\s+(?:wrote|created|authored|made)\\s+(?:the\\s+)?(.+?)\\s+(?:${typePatterns})\\s*\\??\\s*$`,
              'i',
            ),
            new RegExp(
              'who\\s+(?:wrote|created|authored|made)\\s+(.+?)\\s*\\??\\s*$',
              'i',
            ),
            new RegExp(
              `(?:author|creator)\\s+(?:of|de|del)\\s+(?:the\\s+)?(.+?)\\s+(?:${typePatterns})\\s*\\??\\s*$`,
              'i',
            ),
            new RegExp(
              '(?:author|creator)\\s+(?:of|de|del)\\s+(?:the\\s+)?(.+?)\\s*\\??\\s*$',
              'i',
            ),
            new RegExp(
              'quién\\s+(?:escribió|creó|hizo)\\s+(.+?)\\s*\\??\\s*$',
              'i',
            ),
          ],
          buildIntent: (match: RegExpMatchArray): GenericIntent => ({
            target: relationship.relatedType,
            filterType: typeName,
            filterAttribute: 'title',
            filterValue: match[1]!.trim(),
            throughType: null,
            search: null,
            limit: null,
            confidence: 0.85,
          }),
        });
      }
    }

    return rules;
  }

  private buildCompoundFilterSearchRules(introspection: SchemaIntrospectionResult): PatternRule[] {
    const rules: PatternRule[] = [];

    for (const [typeName, descriptor] of introspection.types) {
      const typePatterns = typePatternFor(typeName);
      const stringAttributes = introspection.stringAttributes.get(typeName) ?? [];
      if (stringAttributes.length === 0) { continue; }

      for (const relationship of descriptor.relationships) {
        if (relationship.kind !== 'belongsTo') { continue; }

        const relatedDescriptor = introspection.types.get(relationship.relatedType);
        if (!relatedDescriptor) { continue; }

        const relatedNameAttribute = this.findNameAttribute(relatedDescriptor);
        if (!relatedNameAttribute) { continue; }

        const { relatedType } = relationship;

        rules.push({
          patterns: [
            new RegExp(
              `(?:show|find|get)\\s+(?:me\\s+)?(?:${typePatterns})\\s+(?:from|by)\\s+(\\w+)\\s+(?:about|on|containing|regarding)\\s+(.+?)\\s*$`,
              'i',
            ),
          ],
          buildIntent: (match: RegExpMatchArray): GenericIntent => ({
            target: typeName,
            filterType: relatedType,
            filterAttribute: relatedNameAttribute,
            filterValue: match[1]!.trim(),
            throughType: null,
            search: match[2]!.trim(),
            limit: null,
            confidence: 0.8,
          }),
        });

        rules.push({
          patterns: [
            new RegExp(
              `(?:${typePatterns})\\s+(?:about|on|containing)\\s+(.+?)\\s+(?:by|from)\\s+(\\w+)\\s*$`,
              'i',
            ),
          ],
          buildIntent: (match: RegExpMatchArray): GenericIntent => ({
            target: typeName,
            filterType: relatedType,
            filterAttribute: relatedNameAttribute,
            filterValue: match[2]!.trim(),
            throughType: null,
            search: match[1]!.trim(),
            limit: null,
            confidence: 0.8,
          }),
        });
      }
    }

    return rules;
  }

  private buildOnAboutTraversalRules(introspection: SchemaIntrospectionResult): PatternRule[] {
    const rules: PatternRule[] = [];

    for (const [typeName, descriptor] of introspection.types) {
      const typePatterns = typePatternFor(typeName);

      for (const relationship of descriptor.relationships) {
        if (relationship.kind !== 'belongsTo') { continue; }

        const relatedDescriptor = introspection.types.get(relationship.relatedType);
        if (!relatedDescriptor) { continue; }

        const titleAttribute = relatedDescriptor.attributes.find(
          (attribute) => attribute.name === 'title',
        );
        if (!titleAttribute) { continue; }

        const { relatedType } = relationship;
        const relatedPatterns = typePatternFor(relatedType);

        rules.push({
          patterns: [
            new RegExp(
              `(?:all\\s+)?(?:${typePatterns})\\s+(?:on|about)\\s+(?:the\\s+)?(.+?)\\s+(?:${relatedPatterns})\\s*\\??\\s*$`,
              'i',
            ),
            new RegExp(
              `(?:all\\s+)?(?:${typePatterns})\\s+(?:on|about|for|in)\\s+(?:the\\s+)?(?:(?:${relatedPatterns})\\s+)?(.+?)\\s*\\??\\s*$`,
              'i',
            ),
            new RegExp(
              `(?:muéstrame|dame|show me)\\s+(?:los?\\s+)?(?:${typePatterns}|comentarios|publicaciones)\\s+(?:del?|on|about)\\s+(?:(?:${relatedPatterns}|post|posts)\\s+)?(.+?)\\s*\\??\\s*$`,
              'i',
            ),
            new RegExp(
              '(?:any\\s+)?(?:feedback|responses|reactions)\\s+(?:on|about)\\s+(?:the\\s+)?(.+?)\\s+(?:article|post|entry|blog|piece)\\s*\\??\\s*$',
              'i',
            ),
            new RegExp(
              '(?:any\\s+)?(?:feedback|responses|reactions)\\s+(?:on|about)\\s+(?:the\\s+)?(.+?)\\s*\\??\\s*$',
              'i',
            ),
          ],
          buildIntent: (match: RegExpMatchArray): GenericIntent => ({
            target: typeName,
            filterType: relatedType,
            filterAttribute: titleAttribute.name,
            filterValue: match[1]!.trim(),
            throughType: null,
            search: null,
            limit: null,
            confidence: 0.85,
          }),
        });
      }
    }

    return rules;
  }

  private buildWhoTraversalRules(introspection: SchemaIntrospectionResult): PatternRule[] {
    const rules: PatternRule[] = [];

    for (const [intermediateType, intermediateDescriptor] of introspection.types) {
      const belongsToRelationships = intermediateDescriptor.relationships.filter(
        (relationship) => relationship.kind === 'belongsTo',
      );
      if (belongsToRelationships.length < 2) { continue; }

      for (const filterRelationship of belongsToRelationships) {
        const filterDescriptor = introspection.types.get(filterRelationship.relatedType);
        if (!filterDescriptor) { continue; }

        const filterTitleAttribute = filterDescriptor.attributes.find(
          (attribute) => attribute.name === 'title',
        );
        if (!filterTitleAttribute) { continue; }

        const filterType = filterRelationship.relatedType;
        const filterPatterns = typePatternFor(filterType);

        for (const targetRelationship of belongsToRelationships) {
          if (targetRelationship.relatedType === filterType) { continue; }

          const targetType = targetRelationship.relatedType;

          const verbForms = intermediateType === 'comment'
            ? 'commented|left comments'
            : `(?:wrote|created|has)\\s+${escapeRegex(pluralize(intermediateType))}`;

          rules.push({
            patterns: [
              new RegExp(
                `(?:who|anyone|anybody)\\s+(?:has\\s+)?(?:${verbForms})\\s+(?:on|about)\\s+(?:the\\s+)?(.+?)\\s+(?:${filterPatterns})\\s*\\??\\s*$`,
                'i',
              ),
              new RegExp(
                `(?:who|anyone|anybody)\\s+(?:has\\s+)?(?:${verbForms})\\s+(?:on|about)\\s+(?:the\\s+)?(.+?)\\s*\\??\\s*$`,
                'i',
              ),
            ],
            buildIntent: (match: RegExpMatchArray): GenericIntent => ({
              target: targetType,
              filterType,
              filterAttribute: filterTitleAttribute.name,
              filterValue: match[1]!.trim(),
              throughType: intermediateType,
              search: null,
              limit: null,
              confidence: 0.85,
            }),
          });
        }
      }
    }

    return rules;
  }

  private buildSearchRules(introspection: SchemaIntrospectionResult): PatternRule[] {
    const rules: PatternRule[] = [];

    for (const typeName of introspection.typeNames) {
      const typePatterns = typePatternFor(typeName);
      const stringAttributes = introspection.stringAttributes.get(typeName) ?? [];
      if (stringAttributes.length === 0) { continue; }

      rules.push({
        patterns: [
          new RegExp(
            `(?:search|find|buscar?)\\s+(?:me\\s+)?(?:all\\s+)?(?:the\\s+)?(?:stuff\\s+)?(?:${typePatterns})\\s+(?:about|for|with|containing|sobre|con|que contengan?)\\s+(.+)`,
            'i',
          ),
          new RegExp(
            `(?:search|find|buscar?)\\s+(?:me\\s+)?(?:all\\s+)?(?:the\\s+)?(?:stuff\\s+)?(?:about|for|with|containing|sobre|con)\\s+(.+?)\\s+(?:in\\s+)?(?:${typePatterns})`,
            'i',
          ),
          new RegExp(
            `(?:buscar?)\\s+(.+)\\s+(?:en|in)\\s+(?:${typePatterns})`,
            'i',
          ),
          new RegExp(
            `(?:what\\s+)?(?:${typePatterns})\\s+(?:mention(?:s|ing)?|contain(?:s|ing)?|have|include|include?s)\\s+(.+?)\\s*\\??\\s*$`,
            'i',
          ),
          new RegExp(
            `(?:are there|is there)\\s+(?:any\\s+|a\\s+)?(?:${typePatterns})\\s+(?:about|on|mentioning|containing)\\s+(.+?)\\s*\\??\\s*$`,
            'i',
          ),
        ],
        buildIntent: (match: RegExpMatchArray): GenericIntent => ({
          target: typeName,
          filterType: null,
          filterAttribute: null,
          filterValue: null,
          throughType: null,
          search: match[1]!.trim(),
          limit: null,
          confidence: 0.8,
        }),
      });
    }

    return rules;
  }

  private buildListRules(introspection: SchemaIntrospectionResult): PatternRule[] {
    const rules: PatternRule[] = [];

    for (const typeName of introspection.typeNames) {
      const typePatterns = typePatternFor(typeName);

      rules.push({
        patterns: [
          new RegExp(
            `(?:show|get|list|dame|muestra)\\s+(?:los?\\s+)?(?:\\d+\\s+)?(?:${typePatterns})\\s+(?:recientes|recent)`,
            'i',
          ),
          new RegExp(
            `(?:${typePatterns})\\s+(?:recientes|recent)`,
            'i',
          ),
          new RegExp(
            `(?:recent|latest|last|newest|recientes|últimos?)\\s+(?:(\\d+)\\s+)?(?:${typePatterns})(?!\\s+(?:by|from))`,
            'i',
          ),
          new RegExp(
            `(?:show|get|list|find|dame|muestra)\\s+(?:all|todos?|las?|los?)\\s+(?:(\\d+)\\s+)?(?:${typePatterns})\\s*$`,
            'i',
          ),
          new RegExp(
            `(?:show|get|list)\\s+(?:the\\s+)?(?:newest|latest|recent)\\s+(\\d+)\\s+(?:${typePatterns})`,
            'i',
          ),
          new RegExp(
            `(?:pull up|bring up|load)\\s+(?:the\\s+)?(?:all\\s+)?(?:${typePatterns})\\s*$`,
            'i',
          ),
          new RegExp(
            `(?:which|what)\\s+(?:${typePatterns})\\s+(?:have|are|did|do|were)`,
            'i',
          ),
          new RegExp(
            `(?:do we have|are there|is there)\\s+(?:any\\s+)?(?:${typePatterns})\\s*\\??\\s*$`,
            'i',
          ),
          new RegExp(
            `(?:show|get|list|find)\\s+(?:the\\s+)?(?:${typePatterns})\\s*$`,
            'i',
          ),
          new RegExp(
            `(?:what\\s+are\\s+)?(?:the\\s+)?(?:recent|latest|newest)\\s+(?:${typePatterns})\\s*\\??\\s*$`,
            'i',
          ),
          new RegExp(
            `^(?:any\\s+)?(?:new\\s+|all\\s+)?(?:${typePatterns})\\s*\\??\\s*$`,
            'i',
          ),
        ],
        buildIntent: (match: RegExpMatchArray): GenericIntent => {
          const limitCapture = match[1];
          const limit = limitCapture && /^\d+$/.test(limitCapture)
            ? parseInt(limitCapture, 10)
            : 10;

          return {
            target: typeName,
            filterType: null,
            filterAttribute: null,
            filterValue: null,
            throughType: null,
            search: null,
            limit,
            confidence: 0.85,
          };
        },
      });
    }

    return rules;
  }

  private findNameAttribute(descriptor: SchemaTypeDescriptor): string | null {
    const nameAttribute = descriptor.attributes.find(
      (attribute) => attribute.name === 'name',
    );
    if (nameAttribute) { return nameAttribute.name; }

    const titleAttribute = descriptor.attributes.find(
      (attribute) => attribute.name === 'title',
    );
    if (titleAttribute) { return titleAttribute.name; }

    return null;
  }

  private buildCatchAllRules(introspection: SchemaIntrospectionResult): PatternRule[] {
    const rules: PatternRule[] = [];

    const contentType = this.defaultContentType;
    const { personType } = this;
    const commentType = this.commentLikeType;

    if (personType) {
      const personDescriptor = introspection.types.get(personType);
      const nameAttribute = personDescriptor ? this.findNameAttribute(personDescriptor) : null;

      if (contentType && nameAttribute) {
        rules.push({
          patterns: [
            new RegExp(
              '(?:give me|show me|get me)\\s+(?:everything|all)\\s+(?:by|from)\\s+(.+?)\\s*$',
              'i',
            ),
            new RegExp(
              'what\\s+did\\s+(.+?)\\s+(?:write|post|create|publish)\\s*\\??\\s*$',
              'i',
            ),
            new RegExp(
              '(?:can you|could you)\\s+(?:show|get|find)\\s+(.+?)\\s+(?:stuff|things|content)\\s*\\??\\s*$',
              'i',
            ),
            new RegExp(
              'everything\\s+(.+?)\\s+(?:wrote|posted|created|published)\\s*$',
              'i',
            ),
            new RegExp(
              '(.+?)\\s+(?:wrote|posted|created)\\s+what\\s*\\??\\s*$',
              'i',
            ),
          ],
          buildIntent: (match: RegExpMatchArray): GenericIntent => ({
            target: contentType,
            filterType: personType,
            filterAttribute: nameAttribute,
            filterValue: match[1]!.trim(),
            throughType: null,
            search: null,
            limit: null,
            confidence: 0.7,
          }),
        });
      }

      if (commentType && nameAttribute) {
        rules.push({
          patterns: [
            new RegExp(
              'everything\\s+(.+?)\\s+(?:said|commented|mentioned)\\s*$',
              'i',
            ),
          ],
          buildIntent: (match: RegExpMatchArray): GenericIntent => ({
            target: commentType,
            filterType: personType,
            filterAttribute: nameAttribute,
            filterValue: match[1]!.trim(),
            throughType: null,
            search: null,
            limit: null,
            confidence: 0.7,
          }),
        });
      }
    }

    if (contentType) {
      rules.push({
        patterns: [
          new RegExp(
            '(?:the\\s+)?(?:latest|newest|recent)\\s+(?:stuff|things|content|items)\\s*$',
            'i',
          ),
        ],
        buildIntent: (): GenericIntent => ({
          target: contentType,
          filterType: null,
          filterAttribute: null,
          filterValue: null,
          throughType: null,
          search: null,
          limit: 10,
          confidence: 0.6,
        }),
      });

      rules.push({
        patterns: [
          new RegExp(
            '(?:find|search|get|show)\\s+(?:me\\s+)?(?:all\\s+)?(?:the\\s+)?(?:stuff|things|content)\\s+(?:about|on|regarding)\\s+(.+)',
            'i',
          ),
        ],
        buildIntent: (match: RegExpMatchArray): GenericIntent => ({
          target: contentType,
          filterType: null,
          filterAttribute: null,
          filterValue: null,
          throughType: null,
          search: match[1]!.trim(),
          limit: null,
          confidence: 0.6,
        }),
      });
    }

    if (personType) {
      const allTypePatterns = introspection.typeNames.map(
        (name) => typePatternFor(name),
      ).join('|');

      rules.push({
        patterns: [
          new RegExp(
            `who\\s+has\\s+(?:the\\s+)?(?:most|many|fewest?)\\s+(?:${allTypePatterns})`,
            'i',
          ),
        ],
        buildIntent: (): GenericIntent => ({
          target: personType,
          filterType: null,
          filterAttribute: null,
          filterValue: null,
          throughType: null,
          search: null,
          limit: 10,
          confidence: 0.6,
        }),
      });

      const personDescriptor = introspection.types.get(personType);
      const personNameAttribute = personDescriptor ? this.findNameAttribute(personDescriptor) : null;

      if (personNameAttribute) {
        rules.push({
          patterns: [
            new RegExp('^([A-Z][a-z]+)$'),
          ],
          buildIntent: (match: RegExpMatchArray): GenericIntent => ({
            target: personType,
            filterType: personType,
            filterAttribute: personNameAttribute,
            filterValue: match[1]!.trim(),
            throughType: null,
            search: null,
            limit: null,
            confidence: 0.5,
          }),
        });
      }
    }

    return rules;
  }

  private findDefaultContentType(introspection: SchemaIntrospectionResult): string | null {
    for (const [typeName, descriptor] of introspection.types) {
      if (descriptor.attributes.some((attribute) => attribute.name === 'title')) { return typeName; }
    }
    for (const [typeName, descriptor] of introspection.types) {
      if (descriptor.attributes.some((attribute) => attribute.name === 'body')) { return typeName; }
    }
    return introspection.typeNames[0] ?? null;
  }

  private findPersonType(introspection: SchemaIntrospectionResult): string | null {
    for (const [typeName, descriptor] of introspection.types) {
      if (descriptor.attributes.some((attribute) => attribute.name === 'name' || attribute.name === 'email')) {
        return typeName;
      }
    }
    return null;
  }

  private findCommentLikeType(introspection: SchemaIntrospectionResult): string | null {
    for (const [typeName, descriptor] of introspection.types) {
      const hasBody = descriptor.attributes.some((attribute) => attribute.name === 'body');
      const hasTitle = descriptor.attributes.some((attribute) => attribute.name === 'title');
      if (hasBody && !hasTitle) { return typeName; }
    }
    return null;
  }
}
