"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPersons = getPersons;
exports.getPerson = getPerson;
function list(dna) {
    return (dna.persons ?? []);
}
function getPersons(dna) {
    return list(dna);
}
function getPerson(dna, name) {
    return list(dna).find(p => p.name === name) ?? null;
}
//# sourceMappingURL=person.js.map