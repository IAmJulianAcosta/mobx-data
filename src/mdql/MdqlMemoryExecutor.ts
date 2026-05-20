import type { Model } from '@mobx-data/model';
import type {
  MdqlCondition,
  MdqlFilterNode,
  MdqlQueryObject,
  MdqlOrderByClause,
} from './types.js';

export class MdqlMemoryExecutor {
  static executeMany<T extends Model = Model>(
    items: T[],
    query: MdqlQueryObject,
  ): T[] {
    let result = items.filter((record) =>
      MdqlMemoryExecutor.matchesNode(record, query.filters),
    );

    if (query.orderBy.length > 0) {
      result = MdqlMemoryExecutor.sortRecords(result, query.orderBy);
    }

    const offset = query.offset ?? 0;
    if (offset > 0 || query.limit !== null) {
      const end = query.limit !== null ? offset + query.limit : undefined;
      result = result.slice(offset, end);
    }

    return result;
  }

  static executeOne<T extends Model = Model>(
    items: T[],
    query: MdqlQueryObject,
  ): T | null {
    const results = MdqlMemoryExecutor.executeMany(items, query);
    return results[0] ?? null;
  }

  static count<T extends Model = Model>(
    items: T[],
    query: MdqlQueryObject,
  ): number {
    let count = 0;
    for (const record of items) {
      if (MdqlMemoryExecutor.matchesNode(record, query.filters)) {
        count++;
      }
    }
    return count;
  }

  static exists<T extends Model = Model>(
    items: T[],
    query: MdqlQueryObject,
  ): boolean {
    return items.some((record) =>
      MdqlMemoryExecutor.matchesNode(record, query.filters),
    );
  }

  static compilePredicate<T extends Model = Model>(
    query: MdqlQueryObject,
  ): (record: T) => boolean {
    return (record: T) => MdqlMemoryExecutor.matchesNode(record, query.filters);
  }

  private static matchesNode(record: Model, node: MdqlFilterNode): boolean {
    if (node.kind === 'condition') {
      return MdqlMemoryExecutor.evaluateCondition(record, node);
    }

    if (node.kind === 'and') {
      return node.children.every((child) =>
        MdqlMemoryExecutor.matchesNode(record, child),
      );
    }

    if (node.kind === 'or') {
      return node.children.some((child) =>
        MdqlMemoryExecutor.matchesNode(record, child),
      );
    }

    // not
    return !node.children.some((child) =>
      MdqlMemoryExecutor.matchesNode(record, child),
    );
  }

  private static resolveFieldValues(record: Model, field: string): unknown[] {
    const parts = field.split('.');
    let currentValues: unknown[] = [record];
    for (const part of parts) {
      const nextValues: unknown[] = [];
      for (const current of currentValues) {
        if (current === null || current === undefined) continue;
        if (Array.isArray(current)) {
          for (const item of current) {
            if (item === null || item === undefined) continue;
            nextValues.push((item as Record<string, unknown>)[part]);
          }
        } else {
          nextValues.push((current as Record<string, unknown>)[part]);
        }
      }
      currentValues = nextValues;
    }
    return currentValues;
  }

  private static resolveFieldValue(record: Model, field: string): unknown {
    const values = MdqlMemoryExecutor.resolveFieldValues(record, field);
    return values.length === 1 ? values[0] : values.length === 0 ? undefined : values;
  }

  private static evaluateCondition(record: Model, condition: MdqlCondition): boolean {
    const resolvedValues = MdqlMemoryExecutor.resolveFieldValues(record, condition.field);
    if (resolvedValues.length > 1) {
      return resolvedValues.some((fieldValue) =>
        MdqlMemoryExecutor.evaluateSingleCondition(fieldValue, condition.operator, condition.value),
      );
    }
    const fieldValue = resolvedValues[0];
    return MdqlMemoryExecutor.evaluateSingleCondition(fieldValue, condition.operator, condition.value);
  }

  private static evaluateSingleCondition(fieldValue: unknown, operator: string, value: unknown): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === value;

      case 'notEquals':
        return fieldValue !== value;

      case 'in':
        return Array.isArray(value) && value.includes(fieldValue);

      case 'notIn':
        return Array.isArray(value) && !value.includes(fieldValue);

      case 'isNull':
        return fieldValue === null || fieldValue === undefined;

      case 'isNotNull':
        return fieldValue !== null && fieldValue !== undefined;

      case 'contains':
        return typeof fieldValue === 'string'
          && typeof value === 'string'
          && fieldValue.toLowerCase().includes(value.toLowerCase());

      case 'startsWith':
        return typeof fieldValue === 'string'
          && typeof value === 'string'
          && fieldValue.toLowerCase().startsWith(value.toLowerCase());

      case 'endsWith':
        return typeof fieldValue === 'string'
          && typeof value === 'string'
          && fieldValue.toLowerCase().endsWith(value.toLowerCase());

      case 'greaterThan':
        return MdqlMemoryExecutor.compareValues(fieldValue, value) > 0;

      case 'greaterThanOrEquals':
        return MdqlMemoryExecutor.compareValues(fieldValue, value) >= 0;

      case 'lessThan':
        return MdqlMemoryExecutor.compareValues(fieldValue, value) < 0;

      case 'lessThanOrEquals':
        return MdqlMemoryExecutor.compareValues(fieldValue, value) <= 0;

      case 'between': {
        if (!Array.isArray(value) || value.length !== 2) return false;
        const lower = MdqlMemoryExecutor.compareValues(fieldValue, value[0]);
        const upper = MdqlMemoryExecutor.compareValues(fieldValue, value[1]);
        return lower >= 0 && upper <= 0;
      }

      default:
        return false;
    }
  }

  private static compareValues(a: unknown, b: unknown): number {
    if (a === null || a === undefined) return -1;
    if (b === null || b === undefined) return 1;

    if (a instanceof Date && b instanceof Date) {
      return a.getTime() - b.getTime();
    }

    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }

    if (typeof a === 'string' && typeof b === 'string') {
      return a.localeCompare(b);
    }

    return String(a).localeCompare(String(b));
  }

  private static sortRecords<T extends Model>(
    records: T[],
    orderBy: MdqlOrderByClause[],
  ): T[] {
    return [...records].sort((a, b) => {
      for (const clause of orderBy) {
        const valueA = MdqlMemoryExecutor.resolveFieldValue(a, clause.field);
        const valueB = MdqlMemoryExecutor.resolveFieldValue(b, clause.field);

        if (valueA === valueB) continue;

        // Nulls always sort last regardless of direction
        if (valueA === null || valueA === undefined) return 1;
        if (valueB === null || valueB === undefined) return -1;

        const comparison = MdqlMemoryExecutor.compareValues(valueA, valueB);
        if (comparison !== 0) {
          return clause.direction === 'desc' ? -comparison : comparison;
        }
      }

      return 0;
    });
  }
}
