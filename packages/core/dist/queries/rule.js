"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = getRules;
exports.getRule = getRule;
exports.getRulesForOperation = getRulesForOperation;
function list(dna) {
    return (dna.rules ?? []);
}
function getRules(dna) {
    return list(dna);
}
function getRule(dna, name) {
    return list(dna).find(r => r.name === name) ?? null;
}
function getRulesForOperation(dna, opName) {
    return list(dna).filter(r => r.operation === opName);
}
//# sourceMappingURL=rule.js.map