"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMemberships = getMemberships;
exports.getMembership = getMembership;
function list(dna) {
    return (dna.memberships ?? []);
}
function getMemberships(dna) {
    return list(dna);
}
function getMembership(dna, name) {
    return list(dna).find(m => m.name === name) ?? null;
}
//# sourceMappingURL=membership.js.map