"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toKebabCase = toKebabCase;
exports.toCamelCase = toCamelCase;
exports.toTitleCase = toTitleCase;
exports.toFileName = toFileName;
function toKebabCase(str) {
    return str.replace(/([A-Z])/g, (c, _p1, offset) => (offset === 0 ? '' : '-') + c.toLowerCase());
}
function toCamelCase(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
}
/** 'LoanList' → 'Loan List' */
function toTitleCase(str) {
    return str.replace(/([A-Z])/g, (c, _p1, offset) => (offset === 0 ? '' : ' ') + c);
}
/** 'LoanList' → 'loan-list' */
function toFileName(name) {
    return toKebabCase(name);
}
//# sourceMappingURL=utils.js.map