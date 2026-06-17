export declare const SCHEMA_ROOT: string;
export declare const LENS_ROOT: string;
export type JsonSchema = {
    $id?: string;
    $schema?: string;
    title?: string;
    description?: string;
    type?: string | string[];
    [key: string]: unknown;
};
export type { LensNodeSlot, LensEdge, LensDefinition, LensTarget, LensRef, LensScope, LensResult, LensDataResult, LensSchemaResult, } from './lens/types';
import type { LensDefinition } from './lens/types';
export type Layer = 'operational' | 'product.core' | 'product.api' | 'product.ui' | 'technical';
export declare const schemas: {
    readonly meta: {
        readonly stability: JsonSchema;
        readonly lens: JsonSchema;
    };
    readonly operational: {
        readonly action: JsonSchema;
        readonly attribute: JsonSchema;
        readonly base: JsonSchema;
        readonly domain: JsonSchema;
        readonly group: JsonSchema;
        readonly membership: JsonSchema;
        readonly operation: JsonSchema;
        readonly person: JsonSchema;
        readonly position: JsonSchema;
        readonly process: JsonSchema;
        readonly relationship: JsonSchema;
        readonly resource: JsonSchema;
        readonly rule: JsonSchema;
        readonly task: JsonSchema;
        readonly trigger: JsonSchema;
    };
    readonly product: {
        readonly core: {
            readonly action: JsonSchema;
            readonly field: JsonSchema;
            readonly operation: JsonSchema;
            readonly permission: JsonSchema;
            readonly resource: JsonSchema;
            readonly role: JsonSchema;
            readonly user: JsonSchema;
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
        readonly ui: {
            readonly app: JsonSchema;
            readonly module: JsonSchema;
            readonly workflow: JsonSchema;
            readonly section: JsonSchema;
            readonly component: JsonSchema;
            readonly element: JsonSchema;
            readonly operation: JsonSchema;
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
export declare const lenses: {
    readonly operational: LensDefinition;
    readonly product: LensDefinition;
    readonly productUi: LensDefinition;
    readonly technical: LensDefinition;
    readonly people: LensDefinition;
    readonly accessControl: LensDefinition;
    readonly execution: LensDefinition;
};
export declare function allLenses(): LensDefinition[];
export declare const layerDirs: Record<'operational' | 'product' | 'technical', string>;
export declare function resolveSchemaFile(family: 'operational' | 'product' | 'technical', name: string): string | null;
export declare function allSchemas(): JsonSchema[];
export { DnaValidator } from './validator';
export type { ValidationResult, CrossLayerResult, CrossLayerError } from './validator';
export { evaluateLens } from './lens/evaluate';
export { isSchemaResult } from './lens/types';
export { validateLensDefinition } from './lens/validate-def';
export type { LensDefValidation } from './lens/validate-def';
export { project } from './projection/project';
export type { ProductLevel, ProductNode, ProductEdge, ProductSubgraph, ProjectOptions } from './projection/types';
export { seedProductTypes, applyProjection, PRODUCT_LEVEL_TYPE_NAME } from './projection/apply';
export type { ApplyReport } from './projection/apply';
export { projectPermissions, permissionKey } from './projection/permissions';
export type { PermissionProjectionInput } from './projection/permissions';
export { applyPermissions, PERMISSION_TYPE_NAME } from './projection/apply';
export type { ApplyPermissionsReport } from './projection/apply';
export type { PermissionNode, GrantEdge, PermissionProjection } from './projection/types';
export { resolveStructuralAccess, lintEmptySurfaces } from './access/structural-access';
export type { StructuralAccessGraph, EmptySurfaceLintInput, EmptySurfaceWarning, } from './access/structural-access';
export { createOperationalDna, addResource, addPerson, addPosition, addGroup, addMembership, addOperation, addTrigger, addRule, addTask, addProcess, addRelationship, } from './builders';
export type { BuilderOptions, BuilderResult, CreateOperationalDnaOptions, } from './builders';
export { derivePath } from './domain/path';
export type { DomainLike } from './domain/path';
export { merge } from './merge';
export type { Conflict, ConflictRecommendation, ConflictValue, MergeChunk, MergeResult, OperationalDNA, Provenance, Source, } from './types/merge';
export type { ParseResult, Unit, Style, StyleMap } from './types/adapters';
export { DEFAULT_STYLES } from './types/adapters';
export type { DnaDataStore, InstanceRef, InstanceRecord, InstanceCreateInput, LinkCreateOptions, LinkRecord, LinkListFilter, NounCategory, Stability, AttributeSchema, AttributeSchemaEntry, ResourceType, ResourceTypeVersion, ResourceTypeInput, ResourceTypeUpdate, RelationshipType, RelationshipTypeVersion, RelationshipTypeInput, RelationshipTypeUpdate, TypeDeleteOptions, SeedReport, } from './types/data-store';
export { TypeInUseError, STABILITIES, FOUNDATIONAL_RESOURCE_TYPE_NAMES, isFoundationalTypeName, defaultStabilityForType, } from './types/data-store';
export type { Action, ActionType, Attribute, AttributeType, BasePrimitive, Domain, Group, Membership, Operation, OperationChange, Person, PrimitiveInput, Process, ProcessStep, Relationship, RelationshipCardinality, Position, PositionScope, Resource, Rule, RuleAllowEntry, RuleCondition, RuleConditionOperator, RuleType, Task, Trigger, TriggerSource, } from './types/operational';
export type { Element, Component, Section, Workflow, UIOperation, UIOperationTrigger, UIOperationEffect, NavigateEffect, ApiCallEffect, StateChangeEffect, RenderEffect, } from './types/product-ui';
export { OPERATIONAL_PRIMITIVE_VERSIONS, } from './version';
export type { OperationalPrimitiveType } from './version';
export { bookshopInput } from './fixtures/bookshop';
export { getResource, getResources, getPerson, getPersons, getPosition, getPositions, getGroup, getGroups, getMembership, getMemberships, getOperation, getOperations, getOperationsForResource, getProcess, getProcesses, getTriggersForProcess, getTask, getTasks, getTasksForOperation, getTriggers, getTriggersForOperation, getRule, getRules, getRulesForOperation, getActorsForOperation, getMembershipsForPosition, getMembershipsForPerson, } from './queries';
//# sourceMappingURL=index.d.ts.map