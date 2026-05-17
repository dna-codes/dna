"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMembershipsForRole = getMembershipsForRole;
exports.getMembershipsForPerson = getMembershipsForPerson;
function list(dna) {
    return (dna.memberships ?? []);
}
function getMembershipsForRole(dna, roleName) {
    return list(dna).filter(m => m.role === roleName);
}
function getMembershipsForPerson(dna, personName) {
    return list(dna).filter(m => m.person === personName);
}
//# sourceMappingURL=membership-resolve.js.map