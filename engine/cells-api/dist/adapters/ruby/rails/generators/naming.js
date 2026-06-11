"use strict";
/**
 * Ruby/Rails naming conventions derived from DNA names.
 *
 * DNA names are PascalCase (e.g. "Borrower", "LoanApplication").
 * Rails expects specific casing for different contexts.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSnakeCase = toSnakeCase;
exports.toPlural = toPlural;
exports.toTableName = toTableName;
exports.toControllerName = toControllerName;
exports.toControllerFileName = toControllerFileName;
exports.toModelFileName = toModelFileName;
exports.toActionMethod = toActionMethod;
exports.toRailsColumnType = toRailsColumnType;
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
/** Controller class name: 'Borrower' → 'BorrowersController' */
function toControllerName(str) {
    return `${str}sController`;
}
/** Controller file name: 'Borrower' → 'borrowers_controller.rb' */
function toControllerFileName(str) {
    return `${toPlural(str)}_controller.rb`;
}
/** Model file name: 'Borrower' → 'borrower.rb' */
function toModelFileName(str) {
    return `${toSnakeCase(str)}.rb`;
}
/** Method name from action: 'Register' → 'register', 'View' → 'show', 'List' → 'index' */
function toActionMethod(action) {
    const lc = action.toLowerCase();
    if (lc === 'view')
        return 'show';
    if (lc === 'list')
        return 'index';
    return toSnakeCase(action);
}
/** DNA type → Rails migration column type */
function toRailsColumnType(dnaType) {
    const map = {
        string: 'string',
        text: 'text',
        number: 'decimal',
        boolean: 'boolean',
        date: 'date',
        datetime: 'datetime',
        enum: 'string',
        reference: 'string',
    };
    return map[dnaType] ?? 'string';
}
//# sourceMappingURL=naming.js.map