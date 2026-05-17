"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActorsForOperation = getActorsForOperation;
function rules(dna) {
    return (dna.rules ?? []);
}
function roles(dna) {
    return (dna.domain.roles ?? []);
}
function persons(dna) {
    return (dna.domain.persons ?? []);
}
function getActorsForOperation(dna, opName) {
    const accessRules = rules(dna).filter(r => r.operation === opName && r.subtype === 'access');
    const allRoles = roles(dna);
    const allPersons = persons(dna);
    const result = [];
    const seen = new Set();
    for (const rule of accessRules) {
        for (const entry of (rule.allow ?? [])) {
            const actorName = entry.role;
            if (!actorName || seen.has(actorName))
                continue;
            const role = allRoles.find(r => r.name === actorName);
            if (role) {
                seen.add(actorName);
                result.push(role);
                continue;
            }
            const person = allPersons.find(p => p.name === actorName);
            if (person) {
                seen.add(actorName);
                result.push(person);
            }
        }
    }
    return result;
}
//# sourceMappingURL=actor.js.map