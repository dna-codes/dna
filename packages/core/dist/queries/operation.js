"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOperations = getOperations;
exports.getOperation = getOperation;
exports.getOperationsForResource = getOperationsForResource;
function list(dna) {
    return (dna.operations ?? []);
}
function getOperations(dna) {
    return list(dna);
}
function getOperation(dna, name) {
    return list(dna).find(o => o.name === name) ?? null;
}
function getOperationsForResource(dna, resourceName) {
    return list(dna).filter(o => o.target === resourceName);
}
//# sourceMappingURL=operation.js.map