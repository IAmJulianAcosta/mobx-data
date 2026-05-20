import type { SchemaService } from '@mobx-data/schema';
import type {
  SchemaTypeDescriptor,
  SchemaIntrospectionResult,
  RelationshipGraphEdge,
} from './LocalAiTypes.js';

export class SchemaIntrospector {
  private readonly schema: SchemaService;

  constructor(schema: SchemaService) {
    this.schema = schema;
  }

  public introspect(): SchemaIntrospectionResult {
    const typeNames = this.schema.registeredNames();
    const types = this.buildTypeDescriptors(typeNames);
    const relationshipGraph = this.buildRelationshipGraph(types);
    const stringAttributes = this.buildStringAttributesMap(types);
    const systemPrompt = this.generateSystemPrompt(typeNames, types);
    const jsonSchema = this.generateJsonSchema(typeNames);

    return {
      typeNames,
      types,
      relationshipGraph,
      systemPrompt,
      jsonSchema,
      stringAttributes,
    };
  }

  private buildTypeDescriptors(
    typeNames: string[],
  ): Map<string, SchemaTypeDescriptor> {
    const types = new Map<string, SchemaTypeDescriptor>();

    for (const typeName of typeNames) {
      const attributes: SchemaTypeDescriptor['attributes'] = [];
      const relationships: SchemaTypeDescriptor['relationships'] = [];

      this.schema.eachAttribute(typeName, (name, meta) => {
        attributes.push({ name, type: meta.type });
      });

      this.schema.eachRelationship(typeName, (name, meta) => {
        relationships.push({
          name,
          kind: meta.kind,
          relatedType: meta.type,
        });
      });

      types.set(typeName, { typeName, attributes, relationships });
    }

    return types;
  }

  private buildRelationshipGraph(
    types: Map<string, SchemaTypeDescriptor>,
  ): Map<string, RelationshipGraphEdge[]> {
    const graph = new Map<string, RelationshipGraphEdge[]>();

    for (const [typeName, descriptor] of types) {
      const edges: RelationshipGraphEdge[] = [];
      for (const relationship of descriptor.relationships) {
        edges.push({
          relatedType: relationship.relatedType,
          relationshipName: relationship.name,
          kind: relationship.kind,
        });
      }
      graph.set(typeName, edges);
    }

    return graph;
  }

  private buildStringAttributesMap(
    types: Map<string, SchemaTypeDescriptor>,
  ): Map<string, string[]> {
    const stringAttributes = new Map<string, string[]>();

    for (const [typeName, descriptor] of types) {
      const strings = descriptor.attributes
        .filter((attribute) => attribute.type === 'string' || attribute.type === null)
        .map((attribute) => attribute.name);
      stringAttributes.set(typeName, strings);
    }

    return stringAttributes;
  }

  private generateSystemPrompt(
    typeNames: string[],
    types: Map<string, SchemaTypeDescriptor>,
  ): string {
    const lines: string[] = [
      'You are a query classifier for a data store. Given a user query in English or Spanish, output a JSON object describing the data query.',
      '',
      `Available types: ${typeNames.join(', ')}`,
      '',
      'Type details:',
    ];

    for (const typeName of typeNames) {
      const descriptor = types.get(typeName)!;
      const attributesList = descriptor.attributes
        .map((attribute) => `${attribute.name}(${attribute.type ?? 'any'})`)
        .join(', ');
      const relationshipsList = descriptor.relationships
        .map((relationship) => `${relationship.name}(${relationship.kind})→${relationship.relatedType}`)
        .join(', ');
      lines.push(`- ${typeName}: attributes [${attributesList}], relationships [${relationshipsList}]`);
    }

    lines.push(
      '',
      'Output format:',
      '{"target":"<type>","filter_type":"<type or none>","filter_attribute":"<attr or none>","filter_value":"<value or none>","through_type":"<type or none>","search":"<text or none>","limit":"<number or none>","confidence":<0-1>}',
      '',
      'Rules:',
      '- target: the type of records to return, or "unsupported" if the query is NOT about stored data',
      '- filter_type + filter_attribute + filter_value: filter by an entity\'s attribute (all three must be set, or all "none")',
      '- through_type: intermediate type when the query explicitly mentions traversal (e.g., "comments on POSTS by Alice" → through_type:"post")',
      '- When target == filter_type, it means direct attribute lookup (e.g., "profile of Alice" → target:"user", filter_type:"user")',
      '- "show posts by Alice" means filter posts by the author user named Alice, NOT filter posts by title. Use filter_type for the entity that owns the name.',
      '- filter_attribute can be ANY string attribute of filter_type (name, title, email, slug, etc.), not just "name"',
      '- "comments on the Weekend post" → target:"comment", filter_type:"post", filter_attribute:"title", filter_value:"Weekend" (filter by post title, NOT search)',
      '- When a query references a specific entity by name or title, use filter — NOT search. Search is only for free-text keyword matching.',
      '- search: free-text search across string attributes of the target type (e.g., "search posts about MobX")',
      '- limit: number of results for "recent"/"latest" queries, or "none" if no limit',
      '- For queries unrelated to stored data, set target to "unsupported"',
      '- Use "none" (the string) instead of null for empty fields',
      '',
      'Examples:',
    );

    lines.push(...this.generateExamples(typeNames, types));

    lines.push(
      '',
      'Output ONLY the JSON object. No explanation.',
    );

    return lines.join('\n');
  }

  private generateExamples(
    typeNames: string[],
    types: Map<string, SchemaTypeDescriptor>,
  ): string[] {
    const examples: string[] = [];
    let hasTraversalExample = false;

    for (const typeName of typeNames) {
      const descriptor = types.get(typeName)!;

      for (const relationship of descriptor.relationships) {
        if (relationship.kind !== 'belongsTo') continue;

        const relatedDescriptor = types.get(relationship.relatedType);
        if (!relatedDescriptor) continue;

        const relatedNameAttribute = relatedDescriptor.attributes.find(
          (attribute) => attribute.name === 'name' || attribute.name === 'title',
        );
        if (!relatedNameAttribute) continue;

        examples.push(
          `"show ${typeName}s by Alice" → {"target":"${typeName}","filter_type":"${relationship.relatedType}","filter_attribute":"${relatedNameAttribute.name}","filter_value":"Alice","through_type":"none","search":"none","limit":"none","confidence":0.9}`,
        );
        hasTraversalExample = true;
        break;
      }
    }

    for (const typeName of typeNames) {
      const descriptor = types.get(typeName)!;
      const nameAttribute = descriptor.attributes.find(
        (attribute) => attribute.name === 'name',
      );
      if (!nameAttribute) continue;

      examples.push(
        `"profile of Alice" → {"target":"${typeName}","filter_type":"${typeName}","filter_attribute":"${nameAttribute.name}","filter_value":"Alice","through_type":"none","search":"none","limit":"none","confidence":0.95}`,
      );
      break;
    }

    if (!hasTraversalExample) {
      for (const typeName of typeNames) {
        const descriptor = types.get(typeName)!;
        const nameAttribute = descriptor.attributes.find(
          (attribute) => attribute.name === 'name' || attribute.name === 'title',
        );
        if (nameAttribute) {
          examples.push(
            `"find ${typeName} named example" → {"target":"${typeName}","filter_type":"${typeName}","filter_attribute":"${nameAttribute.name}","filter_value":"example","through_type":"none","search":"none","limit":"none","confidence":0.95}`,
          );
          break;
        }
      }
    }

    const firstTypeWithStringAttributes = typeNames.find((typeName) => {
      const descriptor = types.get(typeName)!;
      return descriptor.attributes.some(
        (attribute) => attribute.type === 'string' && attribute.name !== 'name',
      );
    });

    if (firstTypeWithStringAttributes) {
      examples.push(
        `"search ${firstTypeWithStringAttributes}s about TypeScript" → {"target":"${firstTypeWithStringAttributes}","filter_type":"none","filter_attribute":"none","filter_value":"none","through_type":"none","search":"TypeScript","limit":"none","confidence":0.9}`,
      );
    }

    if (typeNames.length > 0) {
      const listableType = typeNames.find((typeName) => {
        const descriptor = types.get(typeName)!;
        return descriptor.attributes.some(
          (attribute) => attribute.name.toLowerCase().includes('date')
            || attribute.name.toLowerCase().includes('at'),
        );
      }) ?? typeNames[0];

      examples.push(
        `"recent ${listableType}s" → {"target":"${listableType}","filter_type":"none","filter_attribute":"none","filter_value":"none","through_type":"none","search":"none","limit":"10","confidence":0.9}`,
      );
    }

    const typesWithMultiHop = this.findMultiHopExample(typeNames, types);
    if (typesWithMultiHop) {
      examples.push(typesWithMultiHop);
    }

    examples.push(...this.generateTitleFilterExamples(typeNames, types));

    examples.push(
      '"what is the weather" → {"target":"unsupported","filter_type":"none","filter_attribute":"none","filter_value":"none","through_type":"none","search":"none","limit":"none","confidence":0.8}',
    );

    return examples;
  }

  private findMultiHopExample(
    typeNames: string[],
    types: Map<string, SchemaTypeDescriptor>,
  ): string | null {
    for (const typeName of typeNames) {
      const descriptor = types.get(typeName)!;
      for (const relationship of descriptor.relationships) {
        if (relationship.kind !== 'hasMany') continue;

        const intermediateDescriptor = types.get(relationship.relatedType);
        if (!intermediateDescriptor) continue;

        for (const intermediateRelationship of intermediateDescriptor.relationships) {
          if (intermediateRelationship.kind !== 'hasMany') continue;
          if (intermediateRelationship.relatedType === typeName) continue;

          const targetType = intermediateRelationship.relatedType;
          const nameAttribute = descriptor.attributes.find(
            (attribute) => attribute.name === 'name',
          );
          if (!nameAttribute) continue;

          return `"${targetType}s on ${relationship.relatedType}s by ${typeName} Alice" → {"target":"${targetType}","filter_type":"${typeName}","filter_attribute":"name","filter_value":"Alice","through_type":"${relationship.relatedType}","search":"none","limit":"none","confidence":0.9}`;
        }
      }
    }
    return null;
  }

  private generateTitleFilterExamples(
    typeNames: string[],
    types: Map<string, SchemaTypeDescriptor>,
  ): string[] {
    const examples: string[] = [];

    for (const typeName of typeNames) {
      const descriptor = types.get(typeName)!;

      for (const relationship of descriptor.relationships) {
        if (relationship.kind !== 'belongsTo') continue;

        const relatedDescriptor = types.get(relationship.relatedType);
        if (!relatedDescriptor) continue;

        const titleAttribute = relatedDescriptor.attributes.find(
          (attribute) => attribute.name === 'title',
        );
        if (!titleAttribute) continue;

        const targetPlural = typeName.endsWith('s') ? typeName : `${typeName}s`;
        const relatedType = relationship.relatedType;

        examples.push(
          `"all ${targetPlural} on the Example ${relatedType}" → {"target":"${typeName}","filter_type":"${relatedType}","filter_attribute":"title","filter_value":"Example","through_type":"none","search":"none","limit":"none","confidence":0.9}`,
        );
        examples.push(
          `"${targetPlural} for ${relatedType} Weekend" → {"target":"${typeName}","filter_type":"${relatedType}","filter_attribute":"title","filter_value":"Weekend","through_type":"none","search":"none","limit":"none","confidence":0.9}`,
        );

        for (const otherRelationship of descriptor.relationships) {
          if (otherRelationship.kind !== 'belongsTo') continue;
          if (otherRelationship.relatedType === relatedType) continue;

          const otherDescriptor = types.get(otherRelationship.relatedType);
          if (!otherDescriptor) continue;

          const otherNameAttribute = otherDescriptor.attributes.find(
            (attribute) => attribute.name === 'name' || attribute.name === 'title',
          );
          if (!otherNameAttribute) continue;

          examples.push(
            `"who ${relationship.name === 'post' ? 'commented on' : `has ${targetPlural} on`} Example" → {"target":"${otherRelationship.relatedType}","filter_type":"${relatedType}","filter_attribute":"title","filter_value":"Example","through_type":"${typeName}","search":"none","limit":"none","confidence":0.85}`,
          );
          break;
        }

        return examples;
      }
    }

    return examples;
  }

  private generateJsonSchema(typeNames: string[]): string {
    return JSON.stringify({
      type: 'object',
      properties: {
        target: {
          type: 'string',
          enum: [...typeNames, 'unsupported'],
        },
        filter_type: {
          type: 'string',
          enum: [...typeNames, 'none'],
        },
        filter_attribute: {
          type: 'string',
        },
        filter_value: {
          type: 'string',
        },
        through_type: {
          type: 'string',
          enum: [...typeNames, 'none'],
        },
        search: {
          type: 'string',
        },
        limit: {
          type: 'string',
        },
        confidence: {
          type: 'number',
        },
      },
      required: [
        'target',
        'filter_type',
        'filter_attribute',
        'filter_value',
        'through_type',
        'search',
        'limit',
        'confidence',
      ],
    });
  }
}
