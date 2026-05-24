export declare const SCHEMA_ROOT: string;
export type JsonSchema = {
    $id?: string;
    $schema?: string;
    title?: string;
    description?: string;
    type?: string | string[];
    [key: string]: unknown;
};
export type Layer = 'operational' | 'product.core' | 'product.api' | 'product.ui' | 'technical';
export declare const schemas: {
    readonly operational: {
        readonly action: JsonSchema;
        readonly attribute: JsonSchema;
        readonly base: JsonSchema;
        readonly domain: JsonSchema;
        readonly group: JsonSchema;
        readonly membership: JsonSchema;
        readonly operation: JsonSchema;
        readonly person: JsonSchema;
        readonly process: JsonSchema;
        readonly relationship: JsonSchema;
        readonly resource: JsonSchema;
        readonly role: JsonSchema;
        readonly rule: JsonSchema;
        readonly task: JsonSchema;
        readonly trigger: JsonSchema;
    };
    readonly product: {
        readonly core: {
            readonly action: JsonSchema;
            readonly field: JsonSchema;
            readonly operation: JsonSchema;
            readonly resource: JsonSchema;
        };
        readonly api: {
            readonly endpoint: JsonSchema;
            readonly namespace: JsonSchema;
            readonly param: JsonSchema;
            readonly schema: JsonSchema;
        };
        readonly web: {
            readonly block: JsonSchema;
            readonly layout: JsonSchema;
            readonly page: JsonSchema;
            readonly route: JsonSchema;
        };
    };
    readonly technical: {
        readonly cell: JsonSchema;
        readonly connection: JsonSchema;
        readonly construct: JsonSchema;
        readonly environment: JsonSchema;
        readonly node: JsonSchema;
        readonly output: JsonSchema;
        readonly provider: JsonSchema;
        readonly variable: JsonSchema;
        readonly view: JsonSchema;
        readonly zone: JsonSchema;
    };
};
export declare const documents: {
    readonly operational: JsonSchema;
    readonly productCore: JsonSchema;
    readonly productApi: JsonSchema;
    readonly productUi: JsonSchema;
    readonly technical: JsonSchema;
};
export declare const layerDirs: Record<'operational' | 'product' | 'technical', string>;
export declare function resolveSchemaFile(family: 'operational' | 'product' | 'technical', name: string): string | null;
export declare function allSchemas(): JsonSchema[];
export { DnaValidator } from './validator';
export type { ValidationResult, CrossLayerResult, CrossLayerError } from './validator';
export { createOperationalDna, addResource, addPerson, addRole, addGroup, addMembership, addOperation, addTrigger, addRule, addTask, addProcess, addRelationship, } from './builders';
export type { BuilderOptions, BuilderResult, CreateOperationalDnaOptions, } from './builders';
export { merge } from './merge';
export type { Conflict, ConflictRecommendation, ConflictValue, MergeChunk, MergeResult, OperationalDNA, Provenance, Source, } from './types/merge';
export type { ParseResult, Unit, Style, StyleMap } from './types/adapters';
export { DEFAULT_STYLES } from './types/adapters';
export type { DnaDataStore, InstanceRef, InstanceRecord, InstanceCreateInput, LinkCreateOptions, LinkRecord, LinkListFilter, NounCategory, AttributeSchema, AttributeSchemaEntry, ResourceType, ResourceTypeVersion, ResourceTypeInput, ResourceTypeUpdate, RelationshipType, RelationshipTypeVersion, RelationshipTypeInput, RelationshipTypeUpdate, TypeDeleteOptions, SeedReport, } from './types/data-store';
export { TypeInUseError } from './types/data-store';
export type { Action, ActionType, Attribute, AttributeType, BasePrimitive, Domain, Group, Membership, Operation, OperationChange, Person, PrimitiveInput, Process, ProcessStep, Relationship, RelationshipCardinality, Resource, Role, RoleScope, Rule, RuleAllowEntry, RuleCondition, RuleConditionOperator, RuleType, Task, Trigger, TriggerSource, } from './types/operational';
export { OPERATIONAL_PRIMITIVE_VERSIONS, } from './version';
export type { OperationalPrimitiveType } from './version';
export { bookshopInput } from './fixtures/bookshop';
export { getResource, getResources, getPerson, getPersons, getRole, getRoles, getGroup, getGroups, getMembership, getMemberships, getOperation, getOperations, getOperationsForResource, getProcess, getProcesses, getTriggersForProcess, getTask, getTasks, getTasksForOperation, getTriggers, getTriggersForOperation, getRule, getRules, getRulesForOperation, getActorsForOperation, getMembershipsForRole, getMembershipsForPerson, } from './queries';
//# sourceMappingURL=index.d.ts.map