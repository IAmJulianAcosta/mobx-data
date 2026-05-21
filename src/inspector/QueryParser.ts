import type {
  MdqlQueryObject,
  MdqlFilterNode,
  MdqlCondition,
  MdqlLogicalGroup,
  MdqlOperator,
  MdqlOrderByClause,
  MdqlSortDirection,
} from '@mobx-data/mdql';

interface Token {
  type: 'keyword' | 'operator' | 'string' | 'number' | 'identifier' | 'null' | 'bracket';
  value: string;
  raw: unknown;
}

const KEYWORD_SET = new Set([
  'where', 'and', 'or', 'not', 'order', 'by', 'sort',
  'limit', 'offset', 'is', 'null', 'in', 'between',
  'asc', 'desc', 'contains', 'startswith', 'endswith',
]);

const OPERATOR_MAP: Record<string, MdqlOperator> = {
  '=': 'equals',
  '==': 'equals',
  '!=': 'notEquals',
  '<>': 'notEquals',
  '>': 'greaterThan',
  '>=': 'greaterThanOrEquals',
  '<': 'lessThan',
  '<=': 'lessThanOrEquals',
  '~': 'contains',
  '^=': 'startsWith',
  '$=': 'endsWith',
  contains: 'contains',
  startswith: 'startsWith',
  endswith: 'endsWith',
};

const OPERATOR_CHARS = new Set(['=', '!', '<', '>', '~', '^', '$']);

export class QueryParser {
  static parse(input: string): MdqlQueryObject {
    const parser = new QueryParser(input);
    return parser.parseQuery();
  }

  private tokens: Token[];
  private position: number;

  private constructor(input: string) {
    this.tokens = QueryParser.tokenize(input);
    this.position = 0;
  }

  private static tokenize(input: string): Token[] {
    const tokens: Token[] = [];
    let index = 0;

    while (index < input.length) {
      if (input[index] === ' ' || input[index] === '\t') {
        index++;
        continue;
      }

      if (input[index] === '[' || input[index] === ']' || input[index] === ',') {
        tokens.push({ type: 'bracket', value: input[index]!, raw: input[index] });
        index++;
        continue;
      }

      if (input[index] === '"' || input[index] === "'") {
        const quote = input[index]!;
        let value = '';
        index++;
        while (index < input.length && input[index] !== quote) {
          if (input[index] === '\\' && index + 1 < input.length) {
            index++;
          }
          value += input[index];
          index++;
        }
        index++;
        tokens.push({ type: 'string', value, raw: value });
        continue;
      }

      if (OPERATOR_CHARS.has(input[index]!)) {
        let operator = '';
        while (index < input.length && OPERATOR_CHARS.has(input[index]!)) {
          operator += input[index];
          index++;
        }
        tokens.push({ type: 'operator', value: operator, raw: operator });
        continue;
      }

      let word = '';
      while (index < input.length && input[index] !== ' ' && input[index] !== '\t'
        && !OPERATOR_CHARS.has(input[index]!) && input[index] !== '[' && input[index] !== ']' && input[index] !== ',') {
        word += input[index];
        index++;
      }

      if (word === '') {
        index++;
        continue;
      }

      const lower = word.toLowerCase();

      if (lower === 'null') {
        tokens.push({ type: 'null', value: 'null', raw: null });
      } else if (KEYWORD_SET.has(lower)) {
        tokens.push({ type: 'keyword', value: lower, raw: word });
      } else {
        const numberValue = Number(word);
        if (!Number.isNaN(numberValue) && word !== '') {
          tokens.push({ type: 'number', value: word, raw: numberValue });
        } else {
          tokens.push({ type: 'identifier', value: word, raw: word });
        }
      }
    }

    return tokens;
  }

  private peek(): Token | null {
    return this.tokens[this.position] ?? null;
  }

  private advance(): Token | null {
    const token = this.tokens[this.position] ?? null;
    this.position++;
    return token;
  }

  private expect(type: string, value?: string): Token {
    const token = this.advance();
    if (!token || token.type !== type || (value !== undefined && token.value !== value)) {
      const got = token ? `${token.type}:${token.value}` : 'end of input';
      throw new Error(`Expected ${type}${value ? `:${value}` : ''}, got ${got}`);
    }
    return token;
  }

  private expectNullToken(): void {
    const token = this.advance();
    if (!token || (token.type !== 'null' && token.value !== 'null')) {
      const got = token ? `${token.type}:${token.value}` : 'end of input';
      throw new Error(`Expected null, got ${got}`);
    }
  }

  private matchKeyword(keyword: string): boolean {
    const token = this.peek();
    if (token?.type === 'keyword' && token.value === keyword) {
      this.advance();
      return true;
    }
    return false;
  }

  private parseQuery(): MdqlQueryObject {
    const modelToken = this.advance();
    if (!modelToken) { throw new Error('Expected model name'); }
    const modelName = modelToken.value;

    let filters: MdqlLogicalGroup = { kind: 'and', children: [] };
    const orderBy: MdqlOrderByClause[] = [];
    let limit: number | null = null;
    let offset: number | null = null;

    if (this.matchKeyword('where')) {
      filters = this.parseFilterExpression();
    }

    if (this.matchKeyword('order')) {
      this.expect('keyword', 'by');
      this.parseOrderBy(orderBy);
    } else if (this.matchKeyword('sort')) {
      this.parseOrderBy(orderBy);
    }

    if (this.matchKeyword('limit')) {
      const token = this.expect('number');
      limit = token.raw as number;
    }

    if (this.matchKeyword('offset')) {
      const token = this.expect('number');
      offset = token.raw as number;
    }

    return {
      modelName, filters, orderBy, limit, offset, includes: [],
    };
  }

  private parseFilterExpression(): MdqlLogicalGroup {
    const first = this.parseCondition();
    const children: MdqlFilterNode[] = [first];
    let groupKind: 'and' | 'or' = 'and';

    while (this.peek()) {
      const token = this.peek()!;
      if (token.type === 'keyword' && token.value === 'and') {
        this.advance();
        groupKind = 'and';
        children.push(this.parseCondition());
      } else if (token.type === 'keyword' && token.value === 'or') {
        this.advance();
        groupKind = 'or';
        children.push(this.parseCondition());
      } else {
        break;
      }
    }

    if (children.length === 1 && first.kind !== 'condition') {
      return first as MdqlLogicalGroup;
    }

    return { kind: groupKind, children };
  }

  private parseCondition(): MdqlFilterNode {
    if (this.matchKeyword('not')) {
      const child = this.parseCondition();
      return { kind: 'not', children: [child] };
    }

    const fieldToken = this.advance();
    if (!fieldToken) { throw new Error('Expected field name'); }
    const field = fieldToken.value;

    if (this.peek()?.type === 'keyword' && this.peek()?.value === 'is') {
      this.advance();
      if (this.matchKeyword('not')) {
        this.expectNullToken();
        return {
          kind: 'condition', field, operator: 'isNotNull', value: undefined,
        };
      }
      this.expectNullToken();
      return {
        kind: 'condition', field, operator: 'isNull', value: undefined,
      };
    }

    if (this.peek()?.type === 'keyword' && this.peek()?.value === 'in') {
      this.advance();
      const values = this.parseArray();
      return {
        kind: 'condition', field, operator: 'in', value: values,
      };
    }

    if (this.peek()?.type === 'keyword' && this.peek()?.value === 'between') {
      this.advance();
      const low = this.parseValue();
      const high = this.parseValue();
      return {
        kind: 'condition', field, operator: 'between', value: [low, high],
      };
    }

    const operatorToken = this.advance();
    if (!operatorToken) { throw new Error(`Expected operator after field "${field}"`); }

    let operator: MdqlOperator;
    if (operatorToken.type === 'operator') {
      operator = OPERATOR_MAP[operatorToken.value] as MdqlOperator;
      if (!operator) { throw new Error(`Unknown operator: ${operatorToken.value}`); }
    } else if (operatorToken.type === 'keyword' && OPERATOR_MAP[operatorToken.value]) {
      operator = OPERATOR_MAP[operatorToken.value] as MdqlOperator;
    } else {
      throw new Error(`Expected operator, got ${operatorToken.type}:${operatorToken.value}`);
    }

    const value = this.parseValue();

    return {
      kind: 'condition', field, operator, value,
    } as MdqlCondition;
  }

  private parseOrderBy(orderBy: MdqlOrderByClause[]): void {
    const fieldToken = this.advance();
    if (!fieldToken) { throw new Error('Expected field name after order by / sort'); }
    orderBy.push({
      field: fieldToken.value,
      direction: this.parseDirection(),
    });

    while (this.peek()?.type === 'bracket' && this.peek()?.value === ',') {
      this.advance();
      const nextField = this.advance();
      if (!nextField) { break; }
      orderBy.push({
        field: nextField.value,
        direction: this.parseDirection(),
      });
    }
  }

  private parseDirection(): MdqlSortDirection {
    const token = this.peek();
    if (token?.type === 'keyword' && (token.value === 'asc' || token.value === 'desc')) {
      this.advance();
      return token.value as MdqlSortDirection;
    }
    return 'asc';
  }

  private parseValue(): unknown {
    const token = this.advance();
    if (!token) { throw new Error('Expected value'); }

    if (token.type === 'string') { return token.raw; }
    if (token.type === 'number') { return token.raw; }
    if (token.type === 'null') { return null; }
    if (token.type === 'keyword' && token.value === 'null') { return null; }
    if (token.type === 'identifier') { return token.value; }

    throw new Error(`Unexpected value token: ${token.type}:${token.value}`);
  }

  private parseArray(): unknown[] {
    const values: unknown[] = [];
    if (this.peek()?.type === 'bracket' && this.peek()?.value === '[') {
      this.advance();
      while (this.peek() && !(this.peek()?.type === 'bracket' && this.peek()?.value === ']')) {
        if (this.peek()?.type === 'bracket' && this.peek()?.value === ',') {
          this.advance();
          continue;
        }
        values.push(this.parseValue());
      }
      if (this.peek()?.type === 'bracket' && this.peek()?.value === ']') {
        this.advance();
      }
    } else {
      while (this.peek() && this.peek()?.type !== 'keyword') {
        if (this.peek()?.type === 'bracket' && this.peek()?.value === ',') {
          this.advance();
          continue;
        }
        values.push(this.parseValue());
      }
    }
    return values;
  }
}
