import type { SchemaService } from '@mobx-data/schema';
import { type MdqlQueryObject, type MdqlValidationError } from './types.js';
export declare class MdqlValidationException extends Error {
    readonly errors: MdqlValidationError[];
    constructor(errors: MdqlValidationError[]);
}
export declare class MdqlValidator {
    static validate(query: MdqlQueryObject, schema: SchemaService): void;
    static validateQuiet(query: MdqlQueryObject, schema: SchemaService): MdqlValidationError[];
    private static resolveFieldAttribute;
    private static validateFilterNode;
}
//# sourceMappingURL=MdqlValidator.d.ts.map