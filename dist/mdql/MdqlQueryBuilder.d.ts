import type { Model } from '@mobx-data/model';
import type { Store } from '@mobx-data/store';
import type { RecordArray } from '../store/RecordArray.js';
import type { MdqlOperator, MdqlOperatorFor, MdqlValueFor, MdqlQueryObject, MdqlSortDirection, ModelFields } from './types.js';
type Fields<T extends Model> = ModelFields<T>;
type FieldKey<T extends Model> = Extract<keyof Fields<T>, string>;
export declare class MdqlQueryBuilder<T extends Model = Model> {
    private readonly store;
    private readonly queryModelName;
    private readonly rootGroup;
    private readonly orderByClauses;
    private limitValue;
    private offsetValue;
    private readonly includesList;
    constructor(store: Store, modelName: string);
    where<TKey extends FieldKey<T>, TOp extends MdqlOperatorFor<Fields<T>[TKey]>>(field: TKey, operator: TOp, value?: MdqlValueFor<Fields<T>[TKey], TOp>): this;
    where(field: string, operator: MdqlOperator, value?: unknown): this;
    whereEquals<TKey extends FieldKey<T>>(field: TKey, value: Fields<T>[TKey]): this;
    whereEquals(field: string, value: unknown): this;
    whereContains<TKey extends FieldKey<T>>(field: TKey, value: string): this;
    whereContains(field: string, value: string): this;
    and(callback: (builder: MdqlQueryBuilder<T>) => void): this;
    or(callback: (builder: MdqlQueryBuilder<T>) => void): this;
    not(callback: (builder: MdqlQueryBuilder<T>) => void): this;
    orderBy(field: FieldKey<T>, direction?: MdqlSortDirection): this;
    orderBy(field: string, direction?: MdqlSortDirection): this;
    limit(value: number): this;
    offset(value: number): this;
    include(relation: string): this;
    toQueryObject(): MdqlQueryObject;
    toArray(): Promise<T[]>;
    first(): Promise<T | null>;
    count(): Promise<number>;
    exists(): Promise<boolean>;
    toLiveArray(): RecordArray<T>;
}
export {};
//# sourceMappingURL=MdqlQueryBuilder.d.ts.map