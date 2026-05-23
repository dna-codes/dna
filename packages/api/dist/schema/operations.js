"use strict";
/**
 * DNA `Operation` primitive → GraphQL mutation codegen.
 *
 * Each entry in `dna.operations[]` becomes a mutation:
 *
 *     loanApply(id: ID!, input: LoanInput!): Loan!
 *
 * In v1, Operation resolvers behave like `updateLoan` — they forward to
 * `store.instance.update(target, id, input)` and re-read the record.
 * The DNA `Operation.changes[]` semantics (state-machine enforcement)
 * are part of Rule enforcement and are deferred.
 *
 * When an Operation's generated mutation name collides with a generic
 * CRUD mutation name, the Operation wins (design.md D3): the collision
 * is reported to the schema composer via `crudMutationsToOmit` so the
 * CRUD entry is dropped before final schema assembly.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOperationMutations = buildOperationMutations;
const graphql_1 = require("graphql");
const naming_1 = require("./naming");
function buildOperationMutations(dna, bundle, resolverFactory, crudMutationNames) {
    const mutations = {};
    const crudMutationsToOmit = new Set();
    const ops = Array.isArray(dna.operations) ? dna.operations : [];
    for (const op of ops) {
        if (typeof op?.target !== 'string' ||
            typeof op?.action !== 'string' ||
            typeof op?.name !== 'string') {
            continue;
        }
        const targetType = bundle.registry.get(op.target);
        const inputType = bundle.inputRegistry.get(op.target);
        if (!targetType || !inputType)
            continue;
        const name = (0, naming_1.operationMutationName)(op.target, op.action);
        // If two Operations resolve to the same mutation name (e.g. both
        // declare `Loan.Apply`), the first one wins. Loose policy — same
        // name → same mutation; the DNA validator already guards against
        // semantically conflicting Operations.
        if (mutations[name])
            continue;
        mutations[name] = {
            type: new graphql_1.GraphQLNonNull(targetType),
            args: {
                id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) },
                input: { type: new graphql_1.GraphQLNonNull(inputType) },
            },
            resolve: resolverFactory.forTarget(op.target),
            description: typeof op.description === 'string'
                ? op.description
                : `Apply DNA Operation ${op.name} to a ${op.target}.`,
        };
        if (crudMutationNames.has(name)) {
            crudMutationsToOmit.add(name);
        }
    }
    return { mutations, crudMutationsToOmit };
}
//# sourceMappingURL=operations.js.map