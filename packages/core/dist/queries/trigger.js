"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTriggers = getTriggers;
exports.getTriggersForOperation = getTriggersForOperation;
function list(dna) {
    return (dna.triggers ?? []);
}
function getTriggers(dna) {
    return list(dna);
}
function getTriggersForOperation(dna, opName) {
    return list(dna).filter(t => t.operation === opName);
}
//# sourceMappingURL=trigger.js.map