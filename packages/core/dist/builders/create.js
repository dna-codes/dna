"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOperationalDna = createOperationalDna;
/**
 * Create an empty-but-valid Operational DNA shell ready to receive
 * primitives via the `add*` builders.
 *
 * The returned DNA has only a `domain` with the supplied metadata; every
 * collection (resources, persons, positions, groups, memberships, operations,
 * triggers, rules, relationships, tasks, processes) is absent until a
 * primitive is added.
 */
function createOperationalDna(opts) {
    const { name, description, path } = opts.domain;
    const dna = { domain: { name } };
    if (description !== undefined)
        dna.domain.description = description;
    if (path !== undefined)
        dna.domain.path = path;
    return dna;
}
//# sourceMappingURL=create.js.map