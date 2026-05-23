/**
 * DNA noun primitive → GraphQL type codegen.
 *
 * Walks `dna.domain.{resources,persons,roles,groups}` and produces one
 * `GraphQLObjectType` per entry. Each type carries `id: ID!` plus one
 * field per declared `Attribute` (with the attribute-type mapping table
 * documented in design.md D1).
 *
 * Reference attributes (`attribute.type === 'reference'`) are surfaced as
 * scalar `ID` fields here. The expansion field (e.g. `borrower: Borrower`)
 * is added by `./relationships.ts` based on the DNA's
 * `relationships[]` primitives — not from the reference attribute alone.
 */
import { GraphQLEnumType, GraphQLInputObjectType, GraphQLList, GraphQLObjectType } from 'graphql';
import type { OperationalDNA } from '@dna-codes/dna-core';
import type { NounCategory } from './dna-shapes';
/** Result of the §2 pass. Mutable for §3 (relationship fields). */
export interface ResourceTypeBundle {
    /** All emitted output types, keyed by the original DNA noun-primitive name. */
    registry: Map<string, GraphQLObjectType>;
    /** Category lookup so later passes know which DNA collection a type came from. */
    categories: Map<string, NounCategory>;
    /** Input types for CRUD mutations, keyed by original name. */
    inputRegistry: Map<string, GraphQLInputObjectType>;
    /** Generated per-attribute enum types, keyed by `<TypeName>.<attributeName>`. */
    enumRegistry: Map<string, GraphQLEnumType>;
}
/**
 * Build the per-noun-primitive GraphQL types from a DNA. Returns mutable
 * registries; `./relationships.ts` and `./crud.ts` consume them and may
 * extend the object types' fields (via the thunked `fields` API).
 */
export declare function buildResourceTypes(dna: OperationalDNA): ResourceTypeBundle;
export { GraphQLList };
//# sourceMappingURL=types.d.ts.map