import type { SchemaService } from '@mobx-data/schema';
import {
  ALL_OPERATORS,
  OPERATORS_FOR_TYPE,
  type MdqlFilterNode,
  type MdqlQueryObject,
  type MdqlValidationError,
} from './types.js';

export class MdqlValidationException extends Error {
  public readonly errors: MdqlValidationError[];

  constructor(errors: MdqlValidationError[]) {
    const messages = errors.map((error) => `${error.path}: ${error.message}`);
    super(`MDQL validation failed: ${messages.join('; ')}`);
    this.name = 'MdqlValidationException';
    this.errors = errors;
  }
}

export class MdqlValidator {
  static validate(query: MdqlQueryObject, schema: SchemaService): void {
    const errors = MdqlValidator.validateQuiet(query, schema);
    if (errors.length > 0) {
      throw new MdqlValidationException(errors);
    }
  }

  static validateQuiet(
    query: MdqlQueryObject,
    schema: SchemaService,
  ): MdqlValidationError[] {
    const errors: MdqlValidationError[] = [];

    if (!schema.doesTypeExist(query.modelName)) {
      errors.push({
        path: 'modelName',
        message: `Unknown model type "${query.modelName}".`,
      });
      return errors;
    }

    const attributes = schema.attributesDefinitionFor(query.modelName);
    const relationships = schema.relationshipsDefinitionFor(query.modelName);

    MdqlValidator.validateFilterNode(
      query.filters,
      'filters',
      errors,
      schema,
      query.modelName,
    );

    for (let index = 0; index < query.orderBy.length; index++) {
      const clause = query.orderBy[index]!;
      if (clause.field.includes('.')) {
        const resolved = MdqlValidator.resolveFieldAttribute(clause.field, query.modelName, schema);
        if (!resolved) {
          errors.push({
            path: `orderBy[${index}]`,
            message: `Unknown attribute path "${clause.field}".`,
          });
        }
      } else if (clause.field !== 'id' && !attributes.has(clause.field)) {
        errors.push({
          path: `orderBy[${index}]`,
          message: `Unknown attribute "${clause.field}" on "${query.modelName}".`,
        });
      }
    }

    for (const include of query.includes) {
      if (!relationships.has(include)) {
        errors.push({
          path: 'includes',
          message: `Unknown relationship "${include}" on "${query.modelName}".`,
        });
      }
    }

    if (query.limit !== null) {
      if (!Number.isInteger(query.limit) || query.limit < 1) {
        errors.push({
          path: 'limit',
          message: 'Limit must be a positive integer.',
        });
      }
    }

    if (query.offset !== null) {
      if (!Number.isInteger(query.offset) || query.offset < 0) {
        errors.push({
          path: 'offset',
          message: 'Offset must be a non-negative integer.',
        });
      }
    }

    return errors;
  }

  private static resolveFieldAttribute(
    field: string,
    modelName: string,
    schema: SchemaService,
  ): { name: string; type: string | null } | null {
    const parts = field.split('.');
    if (parts.length === 1) {
      if (field === 'id') { return { name: 'id', type: 'string' }; }
      const attributes = schema.attributesDefinitionFor(modelName);
      return attributes.get(field) ?? null;
    }

    let currentModel = modelName;
    for (let index = 0; index < parts.length - 1; index++) {
      const relationships = schema.relationshipsDefinitionFor(currentModel);
      const rel = relationships.get(parts[index]!);
      if (!rel) { return null; }
      currentModel = rel.type;
      if (!schema.doesTypeExist(currentModel)) { return null; }
    }

    const lastPart = parts[parts.length - 1]!;
    if (lastPart === 'id') {
      return { name: 'id', type: 'string' };
    }
    const finalAttributes = schema.attributesDefinitionFor(currentModel);
    return finalAttributes.get(lastPart) ?? null;
  }

  private static validateFilterNode(
    node: MdqlFilterNode,
    path: string,
    errors: MdqlValidationError[],
    schema: SchemaService,
    modelName: string,
  ): void {
    if (node.kind === 'condition') {
      const attributeDefinition = MdqlValidator.resolveFieldAttribute(node.field, modelName, schema);

      if (!attributeDefinition) {
        const message = node.field.includes('.')
          ? `Unknown attribute path "${node.field}".`
          : `Unknown attribute "${node.field}".`;
        errors.push({ path, message });
        return;
      }

      const allowedOperators = attributeDefinition.type
        ? OPERATORS_FOR_TYPE[attributeDefinition.type] ?? ALL_OPERATORS
        : ALL_OPERATORS;

      if (!allowedOperators.has(node.operator)) {
        errors.push({
          path,
          message: `Operator "${node.operator}" is not valid for type "${attributeDefinition.type}".`,
        });
      }

      if (node.operator === 'between') {
        if (!Array.isArray(node.value) || node.value.length !== 2) {
          errors.push({
            path,
            message: 'Operator "between" requires a value of [min, max].',
          });
        }
      }

      if (node.operator === 'in' || node.operator === 'notIn') {
        if (!Array.isArray(node.value)) {
          errors.push({
            path,
            message: `Operator "${node.operator}" requires an array value.`,
          });
        }
      }

      return;
    }

    for (let index = 0; index < node.children.length; index++) {
      MdqlValidator.validateFilterNode(
        node.children[index]!,
        `${path}.${node.kind}[${index}]`,
        errors,
        schema,
        modelName,
      );
    }
  }
}
