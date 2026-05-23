/**
 * Loose structural types for DNA fragments the codegen walks. We avoid
 * importing the strongly-typed `Resource`/`Person`/etc. types from
 * `@dna-codes/dna-core` because the codegen treats them uniformly — it
 * doesn't care about per-primitive specialization. These shapes are the
 * minimum needed for the codegen pipeline to compile and run safely.
 */
export type NounCategory = 'resource' | 'person' | 'role' | 'group';
export interface DnaAttribute {
    name: string;
    type: 'string' | 'text' | 'number' | 'boolean' | 'date' | 'datetime' | 'enum' | 'reference';
    description?: string;
    required?: boolean;
    values?: string[];
    resource?: string;
}
export interface DnaNounPrimitive {
    name: string;
    description?: string;
    attributes?: DnaAttribute[];
    [key: string]: unknown;
}
export interface DnaRelationship {
    name: string;
    from: string;
    to: string;
    cardinality: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
    attribute: string;
    inverse?: string;
}
export interface DnaOperation {
    name: string;
    target: string;
    action: string;
    description?: string;
}
//# sourceMappingURL=dna-shapes.d.ts.map