import { reaction } from 'mobx';
import type { Model } from '@mobx-data/model';
import type { Store } from '@mobx-data/store';
import type { MdqlQueryObject } from '@mobx-data/mdql';
import { MdqlMemoryExecutor } from '../mdql/MdqlMemoryExecutor.js';
import { QueryParser } from './QueryParser.js';
import type {
  StoreSummary,
  RecordSummary,
  RecordDetail,
  SchemaInfo,
  InspectorChangeEvent,
} from './types.js';
import { summarizeRecord, detailRecord, extractSchemaInfo } from './serialization.js';

export class StoreInspector {
  private readonly store: Store;

  constructor(store: Store) {
    this.store = store;
  }

  summary(): StoreSummary {
    const types: StoreSummary['types'] = [];
    let totalRecords = 0;
    for (const modelName of this.store.schema.registeredNames()) {
      const count = this.store.peekAll(modelName).length;
      if (count > 0) {
        types.push({ modelName, count });
      }
      totalRecords += count;
    }
    types.sort((a, b) => a.modelName.localeCompare(b.modelName));
    return { types, totalRecords };
  }

  records(modelName: string): RecordSummary[] {
    return this.store.peekAll(modelName).toArray().map(summarizeRecord);
  }

  record(modelName: string, id: string): RecordDetail | null {
    const found = this.store.identityMap.get(modelName, id);
    if (!found) {
      return null;
    }
    return detailRecord(found);
  }

  dirty(): RecordSummary[] {
    return this.allRecordsWhere((r) => r.isDirty);
  }

  newRecords(): RecordSummary[] {
    return this.allRecordsWhere((r) => r.isNew);
  }

  errored(): RecordSummary[] {
    return this.allRecordsWhere((r) => r.isError || !r.isValid);
  }

  saving(): RecordSummary[] {
    return this.allRecordsWhere((r) => r.isSaving);
  }

  schema(modelName: string): SchemaInfo {
    return extractSchemaInfo(this.store, modelName);
  }

  types(): string[] {
    return this.store.schema.registeredNames().sort();
  }

  query(text: string): Model[] {
    const queryObject = QueryParser.parse(text);
    const items = this.store.peekAll(queryObject.modelName).toArray();
    return MdqlMemoryExecutor.executeMany(items, queryObject);
  }

  queryWithMeta(text: string): { modelName: string; results: Model[] } {
    const queryObject = QueryParser.parse(text);
    const items = this.store.peekAll(queryObject.modelName).toArray();
    return {
      modelName: queryObject.modelName,
      results: MdqlMemoryExecutor.executeMany(items, queryObject),
    };
  }

  liveModels(modelName: string): Model[] {
    return this.store.peekAll(modelName).toArray();
  }

  liveModel(modelName: string, id: string): Model | null {
    return this.store.peekRecord(modelName, id);
  }

  snapshot(): { records: Record<string, unknown[]> } {
    return this.store.serialize();
  }

  observe(callback: (event: InspectorChangeEvent) => void): () => void {
    let previousState = this.captureState();

    return reaction(
      () => this.captureState(),
      (currentState) => {
        this.diffAndEmit(previousState, currentState, callback);
        previousState = currentState;
      },
      { delay: 100 },
    );
  }

  private allRecordsWhere(predicate: (record: Model) => boolean): RecordSummary[] {
    const results: RecordSummary[] = [];
    for (const modelName of this.store.schema.registeredNames()) {
      for (const record of this.store.peekAll(modelName).toArray()) {
        if (predicate(record)) {
          results.push(summarizeRecord(record));
        }
      }
    }
    return results;
  }

  private captureState(): Map<string, Map<string, string>> {
    const state = new Map<string, Map<string, string>>();
    for (const [modelName, bucket] of this.store.identityMap._buckets) {
      const records = new Map<string, string>();
      for (const [id, record] of bucket) {
        records.set(id, record.currentState);
      }
      state.set(modelName, records);
    }
    return state;
  }

  private diffAndEmit(
    previous: Map<string, Map<string, string>>,
    current: Map<string, Map<string, string>>,
    callback: (event: InspectorChangeEvent) => void,
  ): void {
    for (const [modelName, currentBucket] of current) {
      const previousBucket = previous.get(modelName);
      for (const [id, currentStateValue] of currentBucket) {
        if (!previousBucket?.has(id)) {
          callback({ type: 'added', modelName, id });
        } else if (previousBucket.get(id) !== currentStateValue) {
          callback({ type: 'updated', modelName, id });
        }
      }
    }

    for (const [modelName, previousBucket] of previous) {
      const currentBucket = current.get(modelName);
      for (const [id] of previousBucket) {
        if (!currentBucket?.has(id)) {
          callback({ type: 'removed', modelName, id });
        }
      }
    }
  }
}
