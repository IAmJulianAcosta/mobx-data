import type { Model } from '@mobx-data/model';
import type { Store } from '@mobx-data/store';
import { StoreInspector } from './StoreInspector.js';
import { summarizeRecord, detailRecord } from './serialization.js';
import type { RecordSummary, RecordDetail, StoreSummary, SchemaInfo } from './types.js';

const STYLE_HEADER = 'color: #2196f3; font-weight: bold';
const STYLE_DIRTY = 'color: #ff9800; font-weight: bold';
const STYLE_ERROR = 'color: #f44336; font-weight: bold';
const STYLE_SAVED = 'color: #4caf50';
const STYLE_RESET = 'color: inherit';

function stateLabel(record: RecordSummary): string {
  if (record.isError) return 'ERROR';
  if (record.isSaving) return 'SAVING';
  if (record.isNew) return 'NEW';
  if (record.isDirty) return 'DIRTY';
  if (record.isDeleted) return 'DELETED';
  if (record.isLoading) return 'LOADING';
  return 'SAVED';
}

function stateStyle(record: RecordSummary): string {
  if (record.isError || record.hasErrors) return STYLE_ERROR;
  if (record.isDirty || record.isNew) return STYLE_DIRTY;
  return STYLE_SAVED;
}

export type RecordResult = Model & {
  show(): void;
  toJSON(): Record<string, unknown>;
  inspect(): RecordDetail;
  summary(): RecordSummary;
};

const INSPECTOR_METHODS = new Set(['show', 'toJSON', 'inspect', 'summary']);

function createRecordResult(
  model: Model,
  renderDetail: (model: Model) => void,
): RecordResult {
  const extensions: Record<string, unknown> = {
    show() { renderDetail(model); },
    toJSON() {
      const detail = detailRecord(model);
      return { ...detail.attributes, id: detail.id, _state: detail.currentState };
    },
    inspect() { return detailRecord(model); },
    summary() { return summarizeRecord(model); },
  };

  return new Proxy(model, {
    get(target, property) {
      if (typeof property === 'string' && INSPECTOR_METHODS.has(property)) {
        return extensions[property];
      }
      return Reflect.get(target, property);
    },
    has(target, property) {
      if (typeof property === 'string' && INSPECTOR_METHODS.has(property)) return true;
      return Reflect.has(target, property);
    },
  }) as RecordResult;
}

export type ResultSet = RecordResult[] & {
  show(): void;
  toJSON(): Array<Record<string, unknown>>;
};

interface Showable {
  show(): void;
}

export class ConsoleInspector {
  private readonly inspector: StoreInspector;
  private readonly storeName: string;

  constructor(store: Store, name: string = 'default') {
    this.inspector = new StoreInspector(store);
    this.storeName = name;
  }

  summary(): StoreSummary & Showable {
    const data = this.inspector.summary();
    const self = this;
    return Object.assign(data, {
      show() {
        self.renderSummary(data);
      },
    });
  }

  records(modelName: string): ResultSet {
    const models = this.inspector.liveModels(modelName);
    return this.createResultSet(models, () => this.renderRecords(modelName, this.inspector.records(modelName)));
  }

  record(modelName: string, id: string): RecordResult | null {
    const model = this.inspector.liveModel(modelName, id);
    if (!model) return null;
    return this.wrapModel(model);
  }

  query(text: string): ResultSet {
    const { modelName, results } = this.inspector.queryWithMeta(text);
    return this.createResultSet(results, () => {
      const allRecords = this.inspector.records(modelName);
      const recordIndex = new Map(allRecords.map((s) => [s.id, s]));
      const summaries = results
        .map((r) => recordIndex.get((r as unknown as { id: string }).id))
        .filter(Boolean) as RecordSummary[];
      this.renderRecords(`${modelName} (query)`, summaries.length > 0 ? summaries : allRecords);
    });
  }

  dirty(): ResultSet {
    const models = this.collectModels((model) => model.isDirty);
    return this.createResultSet(models, () => this.renderFilteredRecords('Dirty records', models.map(summarizeRecord)));
  }

  newRecords(): ResultSet {
    const models = this.collectModels((model) => model.isNew);
    return this.createResultSet(models, () => this.renderFilteredRecords('New records', models.map(summarizeRecord)));
  }

  saving(): ResultSet {
    const models = this.collectModels((model) => model.isSaving);
    return this.createResultSet(models, () => this.renderFilteredRecords('Saving records', models.map(summarizeRecord)));
  }

  errored(): ResultSet {
    const models = this.collectModels((model) => model.isError || !model.isValid);
    return this.createResultSet(models, () => this.renderFilteredRecords('Errored records', models.map(summarizeRecord)));
  }

  private collectModels(predicate: (model: Model) => boolean): Model[] {
    const models: Model[] = [];
    for (const name of this.inspector.types()) {
      for (const model of this.inspector.liveModels(name)) {
        if (predicate(model)) {
          models.push(model);
        }
      }
    }
    return models;
  }

  schema(modelName: string): SchemaInfo & Showable {
    const data = this.inspector.schema(modelName);
    const self = this;
    return Object.assign(data, {
      show() {
        self.renderSchema(modelName, data);
      },
    });
  }

  types(): string[] & Showable {
    const names = this.inspector.types();
    const self = this;
    const result = [...names] as string[] & Showable;
    result.show = () => {
      const summaryData = self.inspector.summary();
      const countMap = new Map(summaryData.types.map((t) => [t.modelName, t.count]));
      console.log(`%c[mobx-data] Registered types (${names.length})`, STYLE_HEADER);
      for (const name of names) {
        console.log(`  ${name} (${countMap.get(name) ?? 0})`);
      }
    };
    return result;
  }

  snapshot(): unknown {
    return this.inspector.snapshot();
  }

  observe(): () => void {
    console.log('%c[mobx-data] Live observation started. Call the returned function to stop.', STYLE_HEADER);
    return this.inspector.observe((event) => {
      const style = event.type === 'removed' ? STYLE_ERROR
        : event.type === 'added' ? STYLE_SAVED
          : STYLE_DIRTY;
      const label = event.type.toUpperCase();
      const identifier = event.id ?? '(new)';
      const stateInfo = event.record ? ` [${stateLabel(event.record)}]` : '';
      console.log(`%c[mobx-data] %c${label}%c ${event.modelName}:${identifier}${stateInfo}`, STYLE_HEADER, style, STYLE_RESET);
    });
  }

  raw(): StoreInspector {
    return this.inspector;
  }

  command(input: string): unknown {
    const trimmed = input.trim();

    if (this.isQueryCommand(trimmed)) {
      const result = this.query(trimmed);
      result.show();
      return result;
    }

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0]?.toLowerCase() ?? '';
    const argument1 = parts[1];

    switch (cmd) {
      case 'help': case 'h': case '?':
        this.help();
        return undefined;
      case 'summary': case 's': {
        const result = this.summary();
        result.show();
        return result;
      }
      case 'types': case 't': {
        const result = this.types();
        result.show();
        return result;
      }
      case 'dirty': case 'd': {
        const result = this.dirty();
        result.show();
        return result;
      }
      case 'saving': {
        const result = this.saving();
        result.show();
        return result;
      }
      case 'errored': case 'errors': case 'e': {
        const result = this.errored();
        result.show();
        return result;
      }
      case 'schema':
        if (argument1) {
          const result = this.schema(argument1);
          result.show();
          return result;
        }
        console.log('%c[mobx-data] Usage: schema <type>', STYLE_ERROR);
        return undefined;
      case 'snap': case 'snapshot':
        return this.snapshot();
      case 'watch': case 'observe':
        return this.observe();
      default:
        return this.resolveModelCommand(cmd, argument1);
    }
  }

  help(): void {
    console.log(`%c[mobx-data] CLI commands:`, STYLE_HEADER);
    console.log(`
  %c$m('help')%c                          Show this help
  %c$m('summary')%c                       Overview of all types and counts
  %c$m('types')%c                         List registered model names
  %c$m('user')%c                          All records (returns live refs)
  %c$m('user 1')%c                        Single record (live ref)
  %c$m('user where age > 25')%c           Query with filters
  %c$m('user where name ~ "Al"')%c        Contains search
  %c$m('post where title ~ h sort title')%c  Query + sort
  %c$m('dirty')%c                         All dirty records
  %c$m('saving')%c                        All records being saved
  %c$m('errored')%c                       All records with errors
  %c$m('schema user')%c                   Attribute/relationship metadata
  %c$m('snapshot')%c                      Full store snapshot
  %c$m('watch')%c                         Live change logging (returns stop fn)
`,
      STYLE_DIRTY, STYLE_RESET,
      STYLE_DIRTY, STYLE_RESET,
      STYLE_DIRTY, STYLE_RESET,
      STYLE_DIRTY, STYLE_RESET,
      STYLE_DIRTY, STYLE_RESET,
      STYLE_DIRTY, STYLE_RESET,
      STYLE_DIRTY, STYLE_RESET,
      STYLE_DIRTY, STYLE_RESET,
      STYLE_DIRTY, STYLE_RESET,
      STYLE_DIRTY, STYLE_RESET,
      STYLE_DIRTY, STYLE_RESET,
      STYLE_DIRTY, STYLE_RESET,
      STYLE_DIRTY, STYLE_RESET,
      STYLE_DIRTY, STYLE_RESET,
    );
    console.log('%c  Operators: = != > >= < <= ~ (contains) ^= (startsWith) $= (endsWith) in between is null', STYLE_SAVED);
    console.log('%c  All methods return live objects. Use .show() to render, [0] for refs.', STYLE_SAVED);
    console.log('%c  Shortcuts: s=summary, t=types, d=dirty, e=errored, h=help', STYLE_SAVED);
  }

  private isQueryCommand(input: string): boolean {
    const lower = input.toLowerCase();
    return lower.includes(' where ')
      || lower.includes(' sort ')
      || / order by /i.test(lower)
      || / limit /i.test(lower)
      || / offset /i.test(lower);
  }

  private resolveModelCommand(cmd: string, argument1?: string): unknown {
    const registeredTypes = this.inspector.types();
    const resolvedType = registeredTypes.includes(cmd) ? cmd
      : registeredTypes.includes(`${cmd}s`) ? `${cmd}s`
        : null;

    if (resolvedType) {
      if (argument1) {
        const result = this.record(resolvedType, argument1);
        if (result) {
          result.show();
        } else {
          console.log(`%c[mobx-data] ${resolvedType}:${argument1} not found`, STYLE_ERROR);
        }
        return result;
      }
      const result = this.records(resolvedType);
      result.show();
      return result;
    }

    if (cmd === '') {
      const result = this.summary();
      result.show();
      return result;
    }

    console.log(`%c[mobx-data] Unknown command: "${cmd}". Try $m('help')`, STYLE_ERROR);
    return undefined;
  }

  private wrapModel(model: Model): RecordResult {
    return createRecordResult(model, (m) => {
      const detail = detailRecord(m);
      this.renderRecordDetail(detail.modelName, detail.id ?? detail.clientId, detail);
    });
  }

  private createResultSet(models: Model[], showFunction: () => void): ResultSet {
    const wrapped = models.map((m) => this.wrapModel(m));
    const result = wrapped as ResultSet;
    result.show = showFunction;
    result.toJSON = () => wrapped.map((r) => r.toJSON());
    return result;
  }

  private renderSummary(data: StoreSummary): void {
    console.log(`%c[mobx-data] Store "${this.storeName}" — ${data.totalRecords} records`, STYLE_HEADER);
    if (data.types.length === 0) {
      console.log('  (empty)');
      return;
    }
    console.table(
      data.types.reduce<Record<string, { count: number }>>((accumulator, entry) => {
        accumulator[entry.modelName] = { count: entry.count };
        return accumulator;
      }, {}),
    );
  }

  private renderRecords(label: string, data: RecordSummary[]): void {
    console.log(`%c[mobx-data] ${label} — ${data.length} records`, STYLE_HEADER);
    if (data.length === 0) {
      console.log('  (none)');
      return;
    }
    console.table(
      data.map((record) => ({
        id: record.id ?? record.clientId,
        state: stateLabel(record),
        isDirty: record.isDirty,
        isNew: record.isNew,
        isSaving: record.isSaving,
        hasErrors: record.hasErrors,
      })),
    );
  }

  private renderRecordDetail(modelName: string, id: string, data: RecordDetail): void {
    const label = stateLabel(data);
    const style = stateStyle(data);
    console.groupCollapsed(`%c[mobx-data] %c${modelName}:${id}%c — %c${label}%c (${data.currentState})`, STYLE_HEADER, STYLE_RESET, STYLE_RESET, style, STYLE_RESET);

    console.groupCollapsed('Attributes');
    const changedKeys = new Set(Object.keys(data.changedAttributes));
    const attributeTable: Record<string, { current: unknown; original: unknown; changed: string }> = {};
    for (const [key, value] of Object.entries(data.attributes)) {
      attributeTable[key] = {
        current: value,
        original: data.originalAttributes[key],
        changed: changedKeys.has(key) ? 'YES' : '',
      };
    }
    console.table(attributeTable);
    console.groupEnd();

    if (Object.keys(data.relationships).length > 0) {
      console.groupCollapsed('Relationships');
      for (const [name, reference] of Object.entries(data.relationships)) {
        const referenceData = (reference as { data?: unknown })?.data;
        if (Array.isArray(referenceData)) {
          const ids = referenceData.map((r: { type: string; id: string }) => `${r.type}:${r.id}`);
          console.log(`  ${name} → [${ids.join(', ')}]`);
        } else if (referenceData && typeof referenceData === 'object') {
          const typed = referenceData as { type: string; id: string };
          console.log(`  ${name} → ${typed.type}:${typed.id}`);
        } else {
          console.log(`  ${name} → null`);
        }
      }
      console.groupEnd();
    }

    if (data.errors.length > 0) {
      console.groupCollapsed(`%cErrors (${data.errors.length})`, STYLE_ERROR);
      for (const entry of data.errors) {
        console.log(`  ${entry.attribute}: ${entry.messages.join(', ')}`);
      }
      console.groupEnd();
    }

    console.groupEnd();
  }

  private renderSchema(modelName: string, data: SchemaInfo): void {
    console.log(`%c[mobx-data] Schema: ${modelName}${data.isAbstract ? ' (abstract)' : ''}`, STYLE_HEADER);

    if (data.discriminator) {
      console.log(`  Discriminator key: ${data.discriminator.key}`);
    }

    if (data.attributes.length > 0) {
      console.log('%cAttributes:', STYLE_HEADER);
      console.table(
        data.attributes.map((a) => ({ name: a.name, type: a.type ?? '(untyped)' })),
      );
    }

    if (data.relationships.length > 0) {
      console.log('%cRelationships:', STYLE_HEADER);
      console.table(
        data.relationships.map((r) => ({
          name: r.name,
          kind: r.kind,
          type: r.type,
          async: r.async,
          inverse: r.inverse ?? '(none)',
        })),
      );
    }
  }

  private renderFilteredRecords(label: string, data: RecordSummary[]): void {
    console.log(`%c[mobx-data] ${label} — ${data.length} total`, STYLE_HEADER);
    if (data.length === 0) {
      console.log('  (none)');
      return;
    }
    console.table(
      data.map((record) => ({
        type: record.modelName,
        id: record.id ?? record.clientId,
        state: stateLabel(record),
        isDirty: record.isDirty,
        isNew: record.isNew,
        hasErrors: record.hasErrors,
      })),
    );
  }
}
