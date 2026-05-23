"use strict";
/**
 * DNA `Relationship` primitive → GraphQL expansion fields.
 *
 * Reference attributes (`attribute.type === 'reference'`) already produce
 * scalar `ID` fields in `./types.ts` — those stay. This module ADDS the
 * expansion field on the `from` type for every entry in
 * `dna.relationships[]`:
 *
 *   - Cardinality `many-to-one` / `one-to-one` → single nullable field
 *     (`borrower: Borrower`).
 *   - Cardinality `one-to-many` / `many-to-many` → nullable list of
 *     non-null elements (`borrowers: [Borrower!]`).
 *
 * The field name is the relationship's `attribute` field with any
 * trailing `_id`/`Id`/`ID` stripped, then camelCased. The resolver wires
 * via `./resolvers/relationships.ts` (passes a closure over the data
 * store) when the schema is composed in `./index.ts`.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.planRelationshipFields = planRelationshipFields;
exports.buildRelationshipFieldConfigs = buildRelationshipFieldConfigs;
exports.extendObjectFields = extendObjectFields;
const graphql_1 = require("graphql");
const naming_1 = require("./naming");
/**
 * Compute the relationship-field metadata. Returns one entry per
 * `dna.relationships[]` whose `from` AND `to` types both exist in the
 * bundle. Orphan relationships (dangling references) are silently
 * skipped — same policy as the merge / validator layers.
 *
 * The actual field installation requires resolvers (which the schema
 * composer wires); this function only returns the descriptors.
 */
function planRelationshipFields(dna, bundle) {
    const out = [];
    const rels = Array.isArray(dna.relationships) ? dna.relationships : [];
    for (const rel of rels) {
        if (typeof rel?.name !== 'string' ||
            typeof rel?.from !== 'string' ||
            typeof rel?.to !== 'string' ||
            typeof rel?.cardinality !== 'string' ||
            typeof rel?.attribute !== 'string') {
            continue;
        }
        const fromType = bundle.registry.get(rel.from);
        const toType = bundle.registry.get(rel.to);
        if (!fromType || !toType)
            continue;
        const isList = rel.cardinality === 'one-to-many' || rel.cardinality === 'many-to-many';
        const fieldName = (0, naming_1.stripIdSuffix)(rel.attribute);
        const fieldType = isList
            ? new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(toType))
            : toType;
        out.push({
            fromType: rel.from,
            fieldName,
            fieldType,
            info: {
                fromType: rel.from,
                toType: rel.to,
                fieldName,
                relationshipName: rel.name,
                cardinality: rel.cardinality,
                isList,
            },
        });
    }
    return out;
}
/**
 * Build the field configs to install on the corresponding object types.
 * The schema composer feeds these back into `extendObjectFields` (a
 * thunk-friendly merger) so the resolvers can be wired alongside.
 *
 * `resolverFor` is the dependency the composer injects; it returns the
 * GraphQL resolver for a given `RelationshipFieldInfo`. Keeping this
 * dependency-injected means this module owns no I/O and stays unit-
 * testable without the data store.
 */
function buildRelationshipFieldConfigs(builders, resolverFor) {
    const grouped = new Map();
    for (const b of builders) {
        const existing = grouped.get(b.fromType) ?? {};
        existing[b.fieldName] = {
            type: b.fieldType,
            resolve: resolverFor(b.info),
        };
        grouped.set(b.fromType, existing);
    }
    return grouped;
}
/**
 * The thunked-fields API on `GraphQLObjectType` means you can't naively
 * mutate `.fields` after construction. We re-wrap each affected type's
 * field thunk to include the new relationship fields, returning a fresh
 * map of types the schema composer should substitute.
 *
 * This is intentionally a non-destructive operation — callers receive a
 * new Map and decide whether to swap the originals.
 */
function extendObjectFields(bundle, additions) {
    // GraphQL types accept a `fields` thunk that is invoked exactly once
    // by `getFields()`. Once invoked, the field set is cached. By the time
    // `extendObjectFields` runs the thunks haven't been resolved yet (the
    // schema composer is still assembling), so we can re-wrap the
    // underlying configuration via the public `.toConfig()` API.
    for (const [typeName, addedFields] of additions) {
        const objectType = bundle.registry.get(typeName);
        if (!objectType)
            continue;
        const config = objectType.toConfig();
        const existingFields = config.fields;
        const newFields = { ...existingFields, ...addedFields };
        // Replace the entry in the registry with a fresh type carrying the
        // combined field set. This relies on the schema composer holding a
        // reference to `bundle.registry`, not the original object types.
        const updated = new objectType.constructor({
            ...config,
            fields: newFields,
        });
        bundle.registry.set(typeName, updated);
    }
}
//# sourceMappingURL=relationships.js.map