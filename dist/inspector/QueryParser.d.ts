import type { MdqlQueryObject } from '@mobx-data/mdql';
export declare class QueryParser {
    static parse(input: string): MdqlQueryObject;
    private tokens;
    private position;
    private constructor();
    private static tokenize;
    private peek;
    private advance;
    private expect;
    private expectNullToken;
    private matchKeyword;
    private parseQuery;
    private parseFilterExpression;
    private parseCondition;
    private parseOrderBy;
    private parseDirection;
    private parseValue;
    private parseArray;
}
//# sourceMappingURL=QueryParser.d.ts.map