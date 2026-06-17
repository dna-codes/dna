"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActorsForOperation = getActorsForOperation;
function rules(dna) {
    return (dna.rules ?? []);
}
function positions(dna) {
    return (dna.positions ?? []);
}
function persons(dna) {
    return (dna.persons ?? []);
}
function getActorsForOperation(dna, opName) {
    const accessRules = rules(dna).filter(r => r.operation === opName && r.rule_type === 'access');
    const allPositions = positions(dna);
    const allPersons = persons(dna);
    const result = [];
    const seen = new Set();
    for (const rule of accessRules) {
        for (const entry of (rule.allow ?? [])) {
            const actorName = entry.role;
            if (!actorName || seen.has(actorName))
                continue;
            const position = allPositions.find(r => r.name === actorName);
            if (position) {
                seen.add(actorName);
                result.push(position);
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