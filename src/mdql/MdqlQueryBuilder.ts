import type { Model } from '@mobx-data/model';
import type { Store } from '@mobx-data/store';
import type { RecordArray } from '../store/RecordArray.js';
import type {
  MdqlCondition,
  MdqlLogicalGroup,
  MdqlOperator,
  MdqlOperatorFor,
  MdqlValueFor,
  MdqlQueryObject,
  MdqlSortDirection,
  ModelFields,
} from './types.js';
import { MdqlValidator } from './MdqlValidator.js';
import { MdqlMemoryExecutor } from './MdqlMemoryExecutor.js';

type Fields<T extends Model> = ModelFields<T>;
type FieldKey<T extends Model> = Extract<keyof Fields<T>, string>;

export class MdqlQueryBuilder<T extends Model = Model> {
  private readonly store: Store;
  private readonly queryModelName: string;
  private readonly rootGroup: MdqlLogicalGroup;
  private readonly orderByClauses: Array<{ field: string; direction: MdqlSortDirection }>;
  private limitValue: number | null;
  private offsetValue: number | null;
  private readonly includesList: string[];

  constructor(store: Store, modelName: string) {
    this.store = store;
    this.queryModelName = modelName;
    this.rootGroup = { kind: 'and', children: [] };
    this.orderByClauses = [];
    this.limitValue = null;
    this.offsetValue = null;
    this.includesList = [];
  }

  where<
    TKey extends FieldKey<T>,
    TOp extends MdqlOperatorFor<Fields<T>[TKey]>,
  >(
    field: TKey,
    operator: TOp,
    value?: MdqlValueFor<Fields<T>[TKey], TOp>,
  ): this;
  where(field: string, operator: MdqlOperator, value?: unknown): this;
  where(field: string, operator: MdqlOperator, value?: unknown): this {
    const condition: MdqlCondition = {
      kind: 'condition',
      field,
      operator,
      value,
    };
    this.rootGroup.children.push(condition);
    return this;
  }

  whereEquals<TKey extends FieldKey<T>>(
    field: TKey,
    value: Fields<T>[TKey],
  ): this;
  whereEquals(field: string, value: unknown): this;
  whereEquals(field: string, value: unknown): this {
    return this.where(field, 'equals', value);
  }

  whereContains<TKey extends FieldKey<T>>(
    field: TKey,
    value: string,
  ): this;
  whereContains(field: string, value: string): this;
  whereContains(field: string, value: string): this {
    return this.where(field, 'contains', value);
  }

  and(callback: (builder: MdqlQueryBuilder<T>) => void): this {
    const sub = new MdqlQueryBuilder<T>(this.store, this.queryModelName);
    callback(sub);
    const group: MdqlLogicalGroup = { kind: 'and', children: [...sub.rootGroup.children] };
    this.rootGroup.children.push(group);
    return this;
  }

  or(callback: (builder: MdqlQueryBuilder<T>) => void): this {
    const sub = new MdqlQueryBuilder<T>(this.store, this.queryModelName);
    callback(sub);
    const group: MdqlLogicalGroup = { kind: 'or', children: [...sub.rootGroup.children] };
    this.rootGroup.children.push(group);
    return this;
  }

  not(callback: (builder: MdqlQueryBuilder<T>) => void): this {
    const sub = new MdqlQueryBuilder<T>(this.store, this.queryModelName);
    callback(sub);
    const group: MdqlLogicalGroup = { kind: 'not', children: [...sub.rootGroup.children] };
    this.rootGroup.children.push(group);
    return this;
  }

  orderBy(field: FieldKey<T>, direction?: MdqlSortDirection): this;
  orderBy(field: string, direction?: MdqlSortDirection): this;
  orderBy(field: string, direction: MdqlSortDirection = 'asc'): this {
    this.orderByClauses.push({ field, direction });
    return this;
  }

  limit(value: number): this {
    this.limitValue = value;
    return this;
  }

  offset(value: number): this {
    this.offsetValue = value;
    return this;
  }

  include(relation: string): this {
    if (!this.includesList.includes(relation)) {
      this.includesList.push(relation);
    }
    return this;
  }

  toQueryObject(): MdqlQueryObject {
    return {
      modelName: this.queryModelName,
      filters: { kind: 'and', children: [...this.rootGroup.children] },
      orderBy: [...this.orderByClauses],
      limit: this.limitValue,
      offset: this.offsetValue,
      includes: [...this.includesList],
    };
  }

  async toArray(): Promise<T[]> {
    const query = this.toQueryObject();
    MdqlValidator.validate(query, this.store.schema);
    const items = this.store.peekAll<T>(this.queryModelName).toArray();
    return MdqlMemoryExecutor.executeMany<T>(items, query);
  }

  async first(): Promise<T | null> {
    const query = this.toQueryObject();
    MdqlValidator.validate(query, this.store.schema);
    const items = this.store.peekAll<T>(this.queryModelName).toArray();
    return MdqlMemoryExecutor.executeOne<T>(items, query);
  }

  async count(): Promise<number> {
    const query = this.toQueryObject();
    MdqlValidator.validate(query, this.store.schema);
    const items = this.store.peekAll<T>(this.queryModelName).toArray();
    return MdqlMemoryExecutor.count<T>(items, query);
  }

  async exists(): Promise<boolean> {
    const query = this.toQueryObject();
    MdqlValidator.validate(query, this.store.schema);
    const items = this.store.peekAll<T>(this.queryModelName).toArray();
    return MdqlMemoryExecutor.exists<T>(items, query);
  }

  toLiveArray(): RecordArray<T> {
    const query = this.toQueryObject();
    MdqlValidator.validate(query, this.store.schema);
    const predicate = MdqlMemoryExecutor.compilePredicate<T>(query);
    return this.store.liveQuery<T>(this.queryModelName, predicate);
  }
}
