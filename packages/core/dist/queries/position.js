"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPositions = getPositions;
exports.getPosition = getPosition;
function list(dna) {
    return (dna.positions ?? []);
}
function getPositions(dna) {
    return list(dna);
}
function getPosition(dna, name) {
    return list(dna).find(r => r.name === name) ?? null;
}
//# sourceMappingURL=position.js.map