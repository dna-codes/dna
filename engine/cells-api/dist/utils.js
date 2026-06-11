"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toKebabCase = toKebabCase;
exports.toTableName = toTableName;
exports.toCamelCase = toCamelCase;
exports.toFileName = toFileName;
exports.stripLeadingSlash = stripLeadingSlash;
exports.collectNouns = collectNouns;
exports.splitOperation = splitOperation;
function toKebabCase(str) {
    return str.replace(/([A-Z])/g, (c, _p1, offset) => (offset === 0 ? '' : '-') + c.toLowerCase());
}
function toTableName(nounName) {
    return nounName.replace(/([A-Z])/g, (c, _p1, offset) => (offset === 0 ? '' : '_') + c.toLowerCase()) + 's';
}
function toCamelCase(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
}
/** 'Borrower' → 'borrowers', 'LoanApplication' → 'loan-applications' */
function toFileName(resourceName) {
    return toKebabCase(resourceName) + 's';
}
function stripLeadingSlash(p) {
    return p.replace(/^\//, '');
}
/**
 * Return all CoreResources for a Product Core document. Product Core stores
 * resources as a flat top-level array (the materializer already walked the
 * operational domain tree and emitted the surfaced closure), so this is just
 * a pass-through.
 *
 * Accepts a partial shape so old call-sites that passed `core.domain` or older
 * shapes work too — but prefer passing `core` directly.
 */
function collectNouns(core) {
    return [...(core.resources ?? [])];
}
/** 'Loan.Approve' → resource='Loan', action='Approve' */
function splitOperation(operation) {
    const [resource, action] = operation.split('.');
    return { resource, action };
}
//# sourceMappingURL=utils.js.map