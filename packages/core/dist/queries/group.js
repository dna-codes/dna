"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGroups = getGroups;
exports.getGroup = getGroup;
function list(dna) {
    return (dna.groups ?? []);
}
function getGroups(dna) {
    return list(dna);
}
function getGroup(dna, name) {
    return list(dna).find(g => g.name === name) ?? null;
}
//# sourceMappingURL=group.js.map