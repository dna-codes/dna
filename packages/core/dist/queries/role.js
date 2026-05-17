"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoles = getRoles;
exports.getRole = getRole;
function list(dna) {
    return (dna.domain.roles ?? []);
}
function getRoles(dna) {
    return list(dna);
}
function getRole(dna, name) {
    return list(dna).find(r => r.name === name) ?? null;
}
//# sourceMappingURL=role.js.map