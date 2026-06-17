"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMembershipsForPosition = getMembershipsForPosition;
exports.getMembershipsForPerson = getMembershipsForPerson;
function list(dna) {
    return (dna.memberships ?? []);
}
function getMembershipsForPosition(dna, positionName) {
    return list(dna).filter(m => m.position === positionName);
}
function getMembershipsForPerson(dna, personName) {
    return list(dna).filter(m => m.person === personName);
}
//# sourceMappingURL=membership-resolve.js.map