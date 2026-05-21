import type { Model } from '@mobx-data/model';
export type MdqlOperator = 'equals' | 'notEquals' | 'in' | 'notIn' | 'isNull' | 'isNotNull' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'greaterThanOrEquals' | 'lessThan' | 'lessThanOrEquals' | 'between';
export type MdqlUnaryOperator = 'isNull' | 'isNotNull';
export type MdqlSortDirection = 'asc' | 'desc';
export interface MdqlCondition {
    kind: 'condition';
    field: string;
    operator: MdqlOperator;
    value: unknown;
}
export interface MdqlLogicalGroup {
    kind: 'and' | 'or' | 'not';
    children: MdqlFilterNode[];
}
export type MdqlFilterNode = MdqlCondition | MdqlLogicalGroup;
export interface MdqlOrderByClause {
    field: string;
    direction: MdqlSortDirection;
}
export interface MdqlQueryObject {
    modelName: string;
    filters: MdqlLogicalGroup;
    orderBy: MdqlOrderByClause[];
    limit: number | null;
    offset: number | null;
    includes: string[];
}
export interface MdqlValidationError {
    path: string;
    message: string;
}
export declare const OPERATORS_FOR_TYPE: Record<string, ReadonlySet<MdqlOperator>>;
export declare const ALL_OPERATORS: ReadonlySet<MdqlOperator>;
export type ModelFields<T extends Model> = Omit<T, keyof Model>;
export type MdqlStringOperator = 'equals' | 'notEquals' | 'in' | 'notIn' | 'isNull' | 'isNotNull' | 'contains' | 'startsWith' | 'endsWith';
export type MdqlNumberOperator = 'equals' | 'notEquals' | 'in' | 'notIn' | 'isNull' | 'isNotNull' | 'greaterThan' | 'greaterThanOrEquals' | 'lessThan' | 'lessThanOrEquals' | 'between';
export type MdqlBooleanOperator = 'equals' | 'notEquals' | 'isNull' | 'isNotNull';
export type MdqlOperatorFor<T> = [
    T
] extends [string] ? MdqlStringOperator : [
    T
] extends [number] ? MdqlNumberOperator : [
    T
] extends [boolean] ? MdqlBooleanOperator : [
    T
] extends [Date] ? MdqlNumberOperator : MdqlOperator;
export type MdqlValueFor<TField, TOp extends MdqlOperator> = TOp extends 'isNull' | 'isNotNull' ? undefined : TOp extends 'in' | 'notIn' ? TField[] : TOp extends 'between' ? [TField, TField] : TField;
//# sourceMappingURL=types.d.ts.map