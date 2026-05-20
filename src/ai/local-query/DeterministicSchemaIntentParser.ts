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
  if (typeName.endsWith('s')) return typeName;
  if (typeName.endsWith('y')) return `${typeName.slice(0, -1)}ies`;
  return `${typeName}s`;
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class DeterministicSchemaIntentParser implements LocalAiIntentParser {
  private readonly rules: PatternRule[];

  constructor(introspection: SchemaIntrospectionResult) {
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

    rules.push(...this.buildMultiHopTraversalRules(introspection));
    rules.push(...this.buildWhoTraversalRules(introspection));
    rules.push(...this.buildWhoCreatedRules(introspection));
    rules.push(...this.buildOnAboutTraversalRules(introspection));
    rules.push(...this.buildSelfFilterRules(introspection));
    rules.push(...this.buildSingleHopTraversalRules(introspection));
    rules.push(...this.buildSearchRules(introspection));
    rules.push(...this.buildListRules(introspection));

    return rules;
  }

  private buildSelfFilterRules(introspection: SchemaIntrospectionResult): PatternRule[] {
    const rules: PatternRule[] = [];

    for (const [typeName, descriptor] of introspection.types) {
      const nameAttribute = this.findNameAttribute(descriptor);
      if (!nameAttribute) continue;

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
      const typePlural = pluralize(typeName);
      const typePatterns = `${escapeRegex(typeName)}|${escapeRegex(typePlural)}`;

      for (const relationship of descriptor.relationships) {
        if (relationship.kind !== 'belongsTo') continue;

        const relatedDescriptor = introspection.types.get(relationship.relatedType);
        if (!relatedDescriptor) continue;

        const relatedNameAttribute = this.findNameAttribute(relatedDescriptor);
        if (!relatedNameAttribute) continue;

        const relatedType = relationship.relatedType;
        const relatedPlural = pluralize(relatedType);
        const relatedPatterns = `${escapeRegex(relatedType)}|${escapeRegex(relatedPlural)}`;

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
      const targetPlural = pluralize(targetType);
      const targetPatterns = `${escapeRegex(targetType)}|${escapeRegex(targetPlural)}`;

      for (const relationship of targetDescriptor.relationships) {
        if (relationship.kind !== 'belongsTo') continue;

        const intermediateType = relationship.relatedType;
        const intermediateDescriptor = introspection.types.get(intermediateType);
        if (!intermediateDescriptor) continue;

        const intermediatePlural = pluralize(intermediateType);
        const intermediatePatterns = `${escapeRegex(intermediateType)}|${escapeRegex(intermediatePlural)}`;

        for (const intermediateRelationship of intermediateDescriptor.relationships) {
          if (intermediateRelationship.kind !== 'belongsTo') continue;

          const filterType = intermediateRelationship.relatedType;
          if (filterType === targetType) continue;

          const filterDescriptor = introspection.types.get(filterType);
          if (!filterDescriptor) continue;

          const filterNameAttribute = this.findNameAttribute(filterDescriptor);
          if (!filterNameAttribute) continue;

          rules.push({
            patterns: [
              new RegExp(
                `(?:show|get|find|list|dame|muestra)\\s+(?:todos?\\s+)?(?:los?\\s+)?(?:${targetPatterns})\\s+(?:on|in|en|de|del)\\s+(?:los?\\s+)?(?:${intermediatePatterns})\\s+(?:by|from|of|de|del|por|hechos?\\s+por)\\s+(.+)`,
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
      if (!titleAttribute) continue;

      const typePlural = pluralize(typeName);
      const typePatterns = `${escapeRegex(typeName)}|${escapeRegex(typePlural)}`;

      for (const relationship of descriptor.relationships) {
        if (relationship.kind !== 'belongsTo') continue;

        const relatedDescriptor = introspection.types.get(relationship.relatedType);
        if (!relatedDescriptor) continue;

        const nameAttribute = relatedDescriptor.attributes.find(
          (attribute) => attribute.name === 'name',
        );
        if (!nameAttribute) continue;

        rules.push({
          patterns: [
            new RegExp(
              `who\\s+(?:wrote|created|authored|made)\\s+(?:the\\s+)?(.+?)\\s+(?:${typePatterns})\\s*\\??\\s*$`,
              'i',
            ),
            new RegExp(
              `who\\s+(?:wrote|created|authored|made)\\s+(.+?)\\s*\\??\\s*$`,
              'i',
            ),
            new RegExp(
              `(?:author|creator)\\s+(?:of|de|del)\\s+(?:the\\s+)?(.+?)\\s+(?:${typePatterns})\\s*\\??\\s*$`,
              'i',
            ),
            new RegExp(
              `(?:author|creator)\\s+(?:of|de|del)\\s+(?:the\\s+)?(.+?)\\s*\\??\\s*$`,
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

  private buildOnAboutTraversalRules(introspection: SchemaIntrospectionResult): PatternRule[] {
    const rules: PatternRule[] = [];

    for (const [typeName, descriptor] of introspection.types) {
      const typePlural = pluralize(typeName);
      const typePatterns = `${escapeRegex(typeName)}|${escapeRegex(typePlural)}`;

      for (const relationship of descriptor.relationships) {
        if (relationship.kind !== 'belongsTo') continue;

        const relatedDescriptor = introspection.types.get(relationship.relatedType);
        if (!relatedDescriptor) continue;

        const titleAttribute = relatedDescriptor.attributes.find(
          (attribute) => attribute.name === 'title',
        );
        if (!titleAttribute) continue;

        const relatedType = relationship.relatedType;
        const relatedPlural = pluralize(relatedType);
        const relatedPatterns = `${escapeRegex(relatedType)}|${escapeRegex(relatedPlural)}`;

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
      if (belongsToRelationships.length < 2) continue;

      for (const filterRelationship of belongsToRelationships) {
        const filterDescriptor = introspection.types.get(filterRelationship.relatedType);
        if (!filterDescriptor) continue;

        const filterTitleAttribute = filterDescriptor.attributes.find(
          (attribute) => attribute.name === 'title',
        );
        if (!filterTitleAttribute) continue;

        const filterType = filterRelationship.relatedType;
        const filterPlural = pluralize(filterType);
        const filterPatterns = `${escapeRegex(filterType)}|${escapeRegex(filterPlural)}`;

        for (const targetRelationship of belongsToRelationships) {
          if (targetRelationship.relatedType === filterType) continue;

          const targetType = targetRelationship.relatedType;

          const verbForms = intermediateType === 'comment'
            ? 'commented|left comments'
            : `(?:wrote|created|has)\\s+${escapeRegex(pluralize(intermediateType))}`;

          rules.push({
            patterns: [
              new RegExp(
                `who\\s+(?:${verbForms})\\s+(?:on|about)\\s+(?:the\\s+)?(.+?)\\s+(?:${filterPatterns})\\s*\\??\\s*$`,
                'i',
              ),
              new RegExp(
                `who\\s+(?:${verbForms})\\s+(?:on|about)\\s+(?:the\\s+)?(.+?)\\s*\\??\\s*$`,
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
      const typePlural = pluralize(typeName);
      const typePatterns = `${escapeRegex(typeName)}|${escapeRegex(typePlural)}`;
      const stringAttributes = introspection.stringAttributes.get(typeName) ?? [];
      if (stringAttributes.length === 0) continue;

      rules.push({
        patterns: [
          new RegExp(
            `(?:search|find|buscar?)\\s+(?:${typePatterns})\\s+(?:about|for|with|containing|sobre|con|que contengan?)\\s+(.+)`,
            'i',
          ),
          new RegExp(
            `(?:buscar?)\\s+(.+)\\s+(?:en|in)\\s+(?:${typePatterns})`,
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
      const typePlural = pluralize(typeName);
      const typePatterns = `${escapeRegex(typeName)}|${escapeRegex(typePlural)}`;

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
            `(?:recent|latest|last|recientes|últimos?)\\s+(?:(\\d+)\\s+)?(?:${typePatterns})`,
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
    if (nameAttribute) return nameAttribute.name;

    const titleAttribute = descriptor.attributes.find(
      (attribute) => attribute.name === 'title',
    );
    if (titleAttribute) return titleAttribute.name;

    return null;
  }
}
