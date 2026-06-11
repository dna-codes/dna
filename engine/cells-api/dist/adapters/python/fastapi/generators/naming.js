"use strict";
/**
 * Python/FastAPI naming conventions derived from DNA names.
 *
 * DNA names are PascalCase (e.g. "Borrower", "LoanApplication").
 * Python expects snake_case for most identifiers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSnakeCase = toSnakeCase;
exports.toPlural = toPlural;
exports.toTableName = toTableName;
exports.toRouterFileName = toRouterFileName;
exports.toModelFileName = toModelFileName;
exports.toSchemaFileName = toSchemaFileName;
exports.toActionMethod = toActionMethod;
exports.toSqlalchemyType = toSqlalchemyType;
exports.toPythonType = toPythonType;
/** PascalCase → snake_case: 'LoanApplication' → 'loan_application' */
function toSnakeCase(str) {
    return str.replace(/([A-Z])/g, (c, _p1, offset) => (offset === 0 ? '' : '_') + c.toLowerCase());
}
/** Plural snake_case: 'Borrower' → 'borrowers' */
function toPlural(str) {
    return toSnakeCase(str) + 's';
}
/** Table name (plural snake_case): 'Borrower' → 'borrowers' */
function toTableName(str) {
    return toPlural(str);
}
/** Router file name: 'Borrower' → 'borrowers.py' */
function toRouterFileName(str) {
    return `${toPlural(str)}.py`;
}
/** Model file name: 'Borrower' → 'borrower.py' */
function toModelFileName(str) {
    return `${toSnakeCase(str)}.py`;
}
/** Schema file name: 'Borrower' → 'borrower.py' */
function toSchemaFileName(str) {
    return `${toSnakeCase(str)}.py`;
}
/** Method name from action: 'Register' → 'register', 'View' → 'get', 'List' → 'list_all' */
function toActionMethod(action) {
    const lc = action.toLowerCase();
    if (lc === 'view')
        return 'get';
    if (lc === 'list')
        return 'list_all';
    return toSnakeCase(action);
}
/** DNA type → SQLAlchemy column type import */
function toSqlalchemyType(dnaType) {
    const map = {
        string: 'String',
        text: 'Text',
        number: 'Numeric',
        boolean: 'Boolean',
        date: 'Date',
        datetime: 'DateTime',
        enum: 'String',
        reference: 'String',
    };
    return map[dnaType] ?? 'String';
}
/** DNA type → Python/Pydantic type hint */
function toPythonType(dnaType) {
    const map = {
        string: 'str',
        text: 'str',
        number: 'float',
        boolean: 'bool',
        date: 'date',
        datetime: 'datetime',
        enum: 'str',
        reference: 'str',
    };
    return map[dnaType] ?? 'str';
}
//# sourceMappingURL=naming.js.map