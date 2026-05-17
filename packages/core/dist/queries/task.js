"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTasks = getTasks;
exports.getTask = getTask;
exports.getTasksForOperation = getTasksForOperation;
function list(dna) {
    return (dna.tasks ?? []);
}
function getTasks(dna) {
    return list(dna);
}
function getTask(dna, name) {
    return list(dna).find(t => t.name === name) ?? null;
}
function getTasksForOperation(dna, opName) {
    return list(dna).filter(t => t.operation === opName);
}
//# sourceMappingURL=task.js.map