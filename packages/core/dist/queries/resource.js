"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResources = getResources;
exports.getResource = getResource;
function list(dna) {
    return (dna.domain.resources ?? []);
}
function getResources(dna) {
    return list(dna);
}
function getResource(dna, name) {
    return list(dna).find(r => r.name === name) ?? null;
}
//# sourceMappingURL=resource.js.map