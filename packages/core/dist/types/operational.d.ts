/**
 * TypeScript types for every Operational DNA primitive, hand-kept in sync with
 * the JSON Schemas in `@dna-codes/dna-schemas`. The schema is the source of
 * truth at runtime; these types are the source of truth at compile time.
 *
 * `OperationalDNA` (the document-level type) lives in `./merge.ts` next to
 * the merge utility's other public types. This file covers per-primitive
 * shapes consumed by the builder API.
 */
/**
 * Universal base contract carried by every Operational primitive. Builders
 * auto-assign `id` (UUID v4), `type` (hardcoded per builder), and `version`
 * (current per-type schema version from `@dna-codes/dna-schemas`'s
 * `operational/versions.json`) when not supplied. See `src/version.ts`.
 */
export interface BasePrimitive {
    /** UUID v4. Stable identity across data stores. */
    id: string;
    /** Lowercase primitive discriminator (narrowed per primitive). */
    type: string;
    /** Human-readable definition name; used for cross-references. */
    name: string;
    /** Schema version of this primitive type in effect when authored. */
    version: string;
    description?: string;
}
/**
 * Builder-input shape: the stored primitive shape, with `id`, `type`,
 * `version` made optional. Callers may supply any of them; builders
 * auto-stamp the rest. `name` stays required since merge-by-name identity
 * needs it.
 */
export type PrimitiveInput<T extends BasePrimitive> = Omit<T, 'id' | 'type' | 'version'> & Partial<Pick<T, 'id' | 'type' | 'version'>>;
export type AttributeType = 'string' | 'text' | 'number' | 'boolean' | 'date' | 'datetime' | 'enum' | 'reference';
export interface Attribute {
    /** The snake_case name of the attribute. */
    name: string;
    type: AttributeType;
    description?: string;
    required?: boolean;
    /** Required when `type === 'enum'`. */
    values?: string[];
    /** Required when `type === 'reference'`; names the referenced Resource. */
    resource?: string;
}
export type ActionType = 'read' | 'write' | 'destructive';
export interface Action {
    /** PascalCase verb. */
    name: string;
    description?: string;
    type?: ActionType;
    idempotent?: boolean;
}
export interface Resource extends BasePrimitive {
    type: 'resource';
    /** Dot-separated domain path (informational; placement is via the DNA tree). */
    domain?: string;
    attributes?: Attribute[];
    actions?: Action[];
    /** Optional parent Resource name for hierarchical relationships. */
    parent?: string;
    /** Representative example records — used as stub data. */
    examples?: Record<string, unknown>[];
}
export interface Person extends BasePrimitive {
    type: 'person';
    domain?: string;
    attributes?: Attribute[];
    actions?: Action[];
    parent?: string;
    /** Optional Resource template that backs this Person at another layer. */
    resource?: string;
    examples?: Record<string, unknown>[];
}
export interface Group extends BasePrimitive {
    type: 'group';
    domain?: string;
    attributes?: Attribute[];
    actions?: Action[];
    parent?: string;
    examples?: Record<string, unknown>[];
}
export type RoleScope = string | string[];
export interface Role extends BasePrimitive {
    type: 'role';
    domain?: string;
    /** Single Group name, an array of Group names, or omitted (global). */
    scope?: RoleScope;
    /** Optional parent Role for position hierarchy. */
    parent?: string;
    /** Marks a non-human / system actor; incompatible with `cardinality`/`required`/`excludes`. */
    system?: boolean;
    /** Optional Resource template backing a system Role. */
    resource?: string;
    attributes?: Attribute[];
    actions?: Action[];
    /** Per-scope-instance Person-count limit. */
    cardinality?: 'one' | 'many';
    /** Whether at least one Person must hold this Role on every scope instance at runtime. */
    required?: boolean;
    /** Other Role names that the same Person must not simultaneously hold on the same scope instance. */
    excludes?: string[];
}
export interface Membership extends BasePrimitive {
    type: 'membership';
    /** References a declared Person. */
    person: string;
    /** References a declared Role. */
    role: string;
    /** Required when the referenced Role has multi-scope and disambiguation is needed. */
    group?: string;
    domain?: string;
}
export interface OperationChange {
    /** Attribute name on the target. Use `now` for the current timestamp. */
    attribute: string;
    set: unknown;
}
export interface Operation extends BasePrimitive {
    type: 'operation';
    /** Conventional shorthand: `${target}.${action}`. Base contract requires it. */
    name: string;
    /** PascalCase noun name — Resource, Person, Role, Group, or Process. */
    target: string;
    /** PascalCase verb. */
    action: string;
    /** Domain path (informational). */
    domain?: string;
    /** State mutations applied to the target Resource on completion. */
    changes?: OperationChange[];
}
export type TriggerSource = 'user' | 'schedule' | 'webhook' | 'operation';
export interface Trigger extends BasePrimitive {
    type: 'trigger';
    /** Mutually exclusive with `process` — exactly one must be set. */
    operation?: string;
    /** Mutually exclusive with `operation`. */
    process?: string;
    source: TriggerSource;
    /** Required when `source === 'schedule'`. Cron expression. */
    schedule?: string;
    /** Required when `source === 'webhook'`. */
    event?: string;
    /** Required when `source === 'operation'`. The upstream Operation whose completion fires this trigger. */
    after?: string;
    domain?: string;
}
export type RuleType = 'access' | 'condition';
export interface RuleAllowEntry {
    /** A Resource (acting as a Role) that is permitted. */
    role?: string;
    /** When true, the actor must own the Resource instance. */
    ownership?: boolean;
    /** Feature flags that must all be enabled. */
    flags?: string[];
}
export type RuleConditionOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'present' | 'absent';
export interface RuleCondition {
    attribute: string;
    operator: RuleConditionOperator;
    value?: unknown;
}
export interface Rule extends BasePrimitive {
    type: 'rule';
    /** The Operation this rule governs, expressed as Target.Action. */
    operation: string;
    /** Subtype: `access` or `condition`. Re-exposed under `subtype` to avoid clashing with the base `type` discriminator. */
    subtype?: RuleType;
    /** Used when `subtype === 'access'`. */
    allow?: RuleAllowEntry[];
    /** Used when `subtype === 'condition'`. */
    conditions?: RuleCondition[];
    domain?: string;
}
export interface Task extends BasePrimitive {
    type: 'task';
    /** References a declared Role (human or system). */
    actor: string;
    /** Operation (Target.Action). */
    operation: string;
    domain?: string;
}
export interface ProcessStep {
    /** kebab-case identifier, unique within the process. */
    id: string;
    /** References exactly one declared Task. */
    task: string;
    description?: string;
    /** Sibling step ids that must complete before this step begins. */
    depends_on?: string[];
    /** Rule names (condition-type) that must all evaluate true for this step to execute. */
    conditions?: string[];
    /** Sibling step id to jump to on condition failure, or the literal `'abort'`. */
    else?: string;
}
export interface Process extends BasePrimitive {
    type: 'process';
    domain?: string;
    /** The Resource (acting as a Role) responsible for owning the workflow. */
    operator: string;
    /** Step id where the DAG begins. */
    startStep: string;
    /** DAG of steps; the entry point is named by `startStep`. */
    steps: ProcessStep[];
}
export type RelationshipCardinality = 'one-to-one' | 'many-to-one' | 'one-to-many' | 'many-to-many';
export interface Relationship extends BasePrimitive {
    type: 'relationship';
    /** Resource that holds the reference Attribute. */
    from: string;
    /** Resource being referenced. */
    to: string;
    cardinality: RelationshipCardinality;
    /** The reference Attribute on `from` that implements the relationship. */
    attribute: string;
    /** Optional name for the inverse direction. */
    inverse?: string;
}
export interface Domain {
    name: string;
    description?: string;
    path?: string;
    domains?: Domain[];
    resources?: Resource[];
    persons?: Person[];
    roles?: Role[];
    groups?: Group[];
}
//# sourceMappingURL=operational.d.ts.map