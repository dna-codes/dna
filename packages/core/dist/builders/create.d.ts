import type { OperationalDNA } from '../types/merge';
import type { Domain } from '../types/operational';
export interface CreateOperationalDnaOptions {
    /** Domain wrapper. Required because `domain.name` is required by the schema. */
    domain: Pick<Domain, 'name'> & Partial<Pick<Domain, 'description' | 'path'>>;
}
/**
 * Create an empty-but-valid Operational DNA shell ready to receive
 * primitives via the `add*` builders.
 *
 * The returned DNA has only a `domain` with the supplied metadata; every
 * collection (resources, persons, positions, groups, memberships, operations,
 * triggers, rules, relationships, tasks, processes) is absent until a
 * primitive is added.
 */
export declare function createOperationalDna(opts: CreateOperationalDnaOptions): OperationalDNA;
//# sourceMappingURL=create.d.ts.map