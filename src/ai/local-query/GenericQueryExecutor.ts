import type { Store } from '@mobx-data/store';
import type { Model } from '@mobx-data/model';
import {
  NotADataQueryError,
  type DataSourceMode,
  type GenericIntent,
  type LocalAiQueryResult,
  type SchemaIntrospectionResult,
  type RelationshipGraphEdge,
} from './LocalAiTypes.js';

interface TraversalStep {
  fromType: string;
  relationshipName: string;
  toType: string;
}

export class GenericQueryExecutor {
  private readonly introspection: SchemaIntrospectionResult;
  private readonly dataSourceMode: DataSourceMode;

  constructor(
    introspection: SchemaIntrospectionResult,
    dataSourceMode: DataSourceMode = 'local',
  ) {
    this.introspection = introspection;
    this.dataSourceMode = dataSourceMode;
  }

  public async execute(
    intent: GenericIntent,
    store: Store,
  ): Promise<LocalAiQueryResult> {
    if (intent.target === 'unsupported') {
      throw new NotADataQueryError('');
    }

    if (!this.introspection.typeNames.includes(intent.target)) {
      return {
        status: 'validation_error',
        message: `Unknown type "${intent.target}".`,
      };
    }

    if (intent.filterType && !this.introspection.typeNames.includes(intent.filterType)) {
      return {
        status: 'validation_error',
        message: `Unknown filter type "${intent.filterType}".`,
      };
    }

    if (intent.search) {
      return this.executeSearch(intent, store);
    }

    if (!intent.filterType) {
      return this.executeList(intent, store);
    }

    if (intent.target === intent.filterType) {
      return this.executeSelfFilter(intent, store);
    }

    return this.executeTraversal(intent, store);
  }

  private async executeSearch(
    intent: GenericIntent,
    store: Store,
  ): Promise<LocalAiQueryResult> {
    const records = await this.resolveRecords(intent.target, store);
    const searchText = intent.search!.toLowerCase();
    const searchableAttributes = this.introspection.stringAttributes.get(intent.target) ?? [];

    const matching = records.filter((record) => {
      const data = record as unknown as Record<string, unknown>;
      for (const attributeName of searchableAttributes) {
        const value = data[attributeName];
        if (typeof value === 'string' && value.toLowerCase().includes(searchText)) {
          return true;
        }
      }
      return false;
    });

    const limited = intent.limit ? matching.slice(0, intent.limit) : matching;

    return {
      status: 'success',
      data: limited,
      message: limited.length > 0
        ? `Found ${limited.length} ${intent.target}(s) matching "${intent.search}".`
        : `No ${intent.target}s found matching "${intent.search}".`,
    };
  }

  private async executeList(
    intent: GenericIntent,
    store: Store,
  ): Promise<LocalAiQueryResult> {
    const records = await this.resolveRecords(intent.target, store);
    const limit = intent.limit ?? records.length;
    const limited = records.slice(-limit).reverse();

    return {
      status: 'success',
      data: limited,
      message: limited.length > 0
        ? `Found ${limited.length} ${intent.target}(s).`
        : `No ${intent.target}s found.`,
    };
  }

  private async executeSelfFilter(
    intent: GenericIntent,
    store: Store,
  ): Promise<LocalAiQueryResult> {
    const records = await this.resolveRecords(intent.target, store);
    const match = this.findByAttribute(
      records,
      intent.filterAttribute!,
      intent.filterValue!,
    );

    if (!match) {
      return {
        status: 'success',
        data: null,
        message: `No ${intent.target} found matching ${intent.filterAttribute} "${intent.filterValue}".`,
      };
    }

    return {
      status: 'success',
      data: match,
      message: `Found ${intent.target} "${intent.filterValue}".`,
    };
  }

  private async executeTraversal(
    intent: GenericIntent,
    store: Store,
  ): Promise<LocalAiQueryResult> {
    const filterRecords = await this.resolveRecords(intent.filterType!, store);
    const sourceRecord = this.findByAttribute(
      filterRecords,
      intent.filterAttribute!,
      intent.filterValue!,
    );

    if (!sourceRecord) {
      return {
        status: 'success',
        data: [],
        message: `No ${intent.filterType} found matching ${intent.filterAttribute} "${intent.filterValue}".`,
      };
    }

    const path = this.findPath(
      intent.filterType!,
      intent.target,
      intent.throughType,
    );

    if (!path) {
      return {
        status: 'error',
        message: `No relationship path from ${intent.filterType} to ${intent.target}.`,
      };
    }

    let currentRecords: Model[] = [sourceRecord];

    for (const step of path) {
      const nextRecords: Model[] = [];
      for (const record of currentRecords) {
        const related = this.followRelationship(record, step, store);
        nextRecords.push(...related);
      }
      currentRecords = this.deduplicateRecords(nextRecords);
    }

    const limited = intent.limit
      ? currentRecords.slice(0, intent.limit)
      : currentRecords;

    const identifier = intent.filterValue ?? intent.filterType;
    return {
      status: 'success',
      data: limited,
      message: limited.length > 0
        ? `Found ${limited.length} ${intent.target}(s) for ${identifier}.`
        : `No ${intent.target}s found for ${identifier}.`,
    };
  }

  private findByAttribute(
    records: Model[],
    attributeName: string,
    attributeValue: string,
  ): Model | undefined {
    const lowerValue = attributeValue.toLowerCase();

    const matchesRecord = (record: Model, exact: boolean): boolean => {
      const data = record as unknown as Record<string, unknown>;
      const value = data[attributeName];
      if (typeof value === 'string') {
        const lowerActual = value.toLowerCase();
        return exact
          ? lowerActual === lowerValue
          : lowerActual.includes(lowerValue) || lowerValue.includes(lowerActual);
      }
      return exact && String(value) === attributeValue;
    };

    return records.find((record) => matchesRecord(record, true))
      ?? records.find((record) => matchesRecord(record, false));
  }

  private followRelationship(
    record: Model,
    step: TraversalStep,
    store: Store,
  ): Model[] {
    const data = record as unknown as Record<string, unknown>;
    const related = data[step.relationshipName];

    if (Array.isArray(related)) {
      return related as Model[];
    }

    if (related && typeof related === 'object' && 'id' in (related as object)) {
      return [related as Model];
    }

    if (related && typeof (related as { toArray?: unknown }).toArray === 'function') {
      return (related as { toArray(): Model[] }).toArray();
    }

    const foreignKey = data[`${step.relationshipName}Id`];
    if (typeof foreignKey === 'string') {
      const resolved = store.peekRecord(step.toType, foreignKey);
      return resolved ? [resolved] : [];
    }

    return this.reverseScan(record, step, store);
  }

  private reverseScan(
    record: Model,
    step: TraversalStep,
    store: Store,
  ): Model[] {
    const recordId = (record as unknown as { id: string }).id;
    if (!recordId) { return []; }

    const reverseEdges = (this.introspection.relationshipGraph.get(step.toType) ?? [])
      .filter((edge) => edge.relatedType === step.fromType);
    if (reverseEdges.length === 0) { return []; }

    const candidates = store.peekAll(step.toType).toArray();
    return candidates.filter((candidate) => {
      const candidateData = candidate as unknown as Record<string, unknown>;
      for (const edge of reverseEdges) {
        const related = candidateData[edge.relationshipName];
        if (related && typeof related === 'object' && 'id' in (related as object)) {
          if ((related as { id: string }).id === recordId) { return true; }
        }
        const fk = candidateData[`${edge.relationshipName}Id`];
        if (fk === recordId) { return true; }
      }
      return false;
    });
  }

  private findPath(
    fromType: string,
    toType: string,
    throughType: string | null,
  ): TraversalStep[] | null {
    const graph = this.introspection.relationshipGraph;

    interface QueueEntry {
      type: string;
      path: TraversalStep[];
    }

    const queue: QueueEntry[] = [{ type: fromType, path: [] }];
    const visited = new Set<string>([fromType]);
    const allPaths: TraversalStep[][] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const edges = graph.get(current.type) ?? [];

      for (const edge of edges) {
        if (visited.has(edge.relatedType)) { continue; }

        const newPath: TraversalStep[] = [
          ...current.path,
          {
            fromType: current.type,
            relationshipName: edge.relationshipName,
            toType: edge.relatedType,
          },
        ];

        if (edge.relatedType === toType) {
          if (!throughType) {
            return newPath;
          }
          allPaths.push(newPath);
          continue;
        }

        visited.add(edge.relatedType);
        queue.push({ type: edge.relatedType, path: newPath });
      }
    }

    if (throughType && allPaths.length > 0) {
      const pathThroughType = allPaths.find((path) => path.some((step) => step.toType === throughType || step.fromType === throughType));
      return pathThroughType ?? allPaths[0] ?? null;
    }

    return null;
  }

  private deduplicateRecords(records: Model[]): Model[] {
    const seen = new Set<string>();
    return records.filter((record) => {
      const key = `${record.modelName}:${record.id}`;
      if (seen.has(key)) { return false; }
      seen.add(key);
      return true;
    });
  }

  private async resolveRecords(
    typeName: string,
    store: Store,
  ): Promise<Model[]> {
    if (this.dataSourceMode === 'server' || this.dataSourceMode === 'both') {
      try {
        await store.findAll(typeName);
      } catch {
        // Fall through to local data if server fails
      }
    }

    return store.peekAll(typeName).toArray();
  }
}
