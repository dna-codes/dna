"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProcesses = getProcesses;
exports.getProcess = getProcess;
exports.getTriggersForProcess = getTriggersForProcess;
function listProcesses(dna) {
    return (dna.processes ?? []);
}
function listTriggers(dna) {
    return (dna.triggers ?? []);
}
function getProcesses(dna) {
    return listProcesses(dna);
}
function getProcess(dna, name) {
    return listProcesses(dna).find(p => p.name === name) ?? null;
}
function getTriggersForProcess(dna, processName) {
    return listTriggers(dna).filter(t => t.process === processName);
}
//# sourceMappingURL=process.js.map