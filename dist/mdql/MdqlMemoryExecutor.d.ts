import type { Model } from '@mobx-data/model';
import type { MdqlQueryObject } from './types.js';
export declare class MdqlMemoryExecutor {
    static executeMany<T extends Model = Model>(items: T[], query: MdqlQueryObject): T[];
    static executeOne<T extends Model = Model>(items: T[], query: MdqlQueryObject): T | null;
    static count<T extends Model = Model>(items: T[], query: MdqlQueryObject): number;
    static exists<T extends Model = Model>(items: T[], query: MdqlQueryObject): boolean;
    static compilePredicate<T extends Model = Model>(query: MdqlQueryObject): (record: T) => boolean;
    private static matchesNode;
    private static resolveFieldValues;
    private static resolveFieldValue;
    private static evaluateCondition;
    private static evaluateSingleCondition;
    private static compareValues;
    private static sortRecords;
}
//# sourceMappingURL=MdqlMemoryExecutor.d.ts.map