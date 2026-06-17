/**
 * Shared contract for runtime-data persistence backends, registry-native edition.
 *
 * A `DnaDataStore` persists:
 *
 *   1. **The type system itself**, as first-class `ResourceType` and
 *      `RelationshipType` records. Versioned — every update creates an
 *      immutable `ResourceTypeVersion` (or `RelationshipTypeVersion`) record
 *      and bumps the live record's `current_version`. The DNA file is a
 *      *seed* for these records on first boot; after that, admins own the
 *      type system through the API.
 *
 *   2. **Runtime data** — `Instance` records of each `ResourceType` and
 *      `Link` records (per `RelationshipType`) connecting Instances. Every
 *      Instance / Link carries a `_schemaVersion` stamp recording which
 *      `current_version` of its type was active when it was written.
 *
 * It is distinct from any future *descriptor* storage (a hypothetical
 * `DnaStore` that would persist the `OperationalDNA` document itself).
 * The DNA descriptor is *input* to a `DnaDataStore` (passed to
 * `seedFromDna(dna)` on first boot only), not data stored by it.
 *
 * Two implementations ship in `@dna-codes/dna-adapters`:
 *
 *   - `integration/memory` — zero-dep, recommended test double.
 *   - `integration/neo4j`  — backed by `neo4j-driver`; the production store.
 *
 * Transport wrappers (`dna-api`, future `dna-mcp` / `dna-cli`) depend on
 * this interface, not on a concrete implementation.
 */

import type { OperationalDNA } from './merge'

// ── Foundational categories ────────────────────────────────────────────────

/**
 * The four foundational noun-kinds in DNA. Every `ResourceType` declares
 * which of these it specializes (a `Loan` ResourceType is `category: 'resource'`;
 * a `Borrower` is `category: 'person'`).
 */
export type NounCategory = 'person' | 'position' | 'group' | 'resource'

// ── Stability lifecycle ─────────────────────────────────────────────────────

/**
 * Maturity of a registry type's *concept* (Kubernetes API-maturity model).
 * Orthogonal to the numeric schema `version`/`current_version`: a type can be
 * `experimental` at version 1 or `stable` at version 3, independently. A type
 * can transition between stability stages without a schema change, and a schema
 * change does not alter stability. See `defaultStabilityForType` for seed/read
 * defaults.
 */
export type Stability = 'experimental' | 'beta' | 'stable' | 'deprecated'

/** Canonical ordered list of stability values. The single source of truth for the GraphQL enum. */
export const STABILITIES: readonly Stability[] = ['experimental', 'beta', 'stable', 'deprecated']

/** The four foundational resource-type names, always seeded and always `stable`. */
export const FOUNDATIONAL_RESOURCE_TYPE_NAMES: readonly string[] = ['Person', 'Position', 'Group', 'Resource']

/** True iff `name` is one of the four foundational resource types. */
export function isFoundationalTypeName(name: string): boolean {
  return FOUNDATIONAL_RESOURCE_TYPE_NAMES.includes(name)
}

/**
 * The default `stability` for a registry type identified by `name`. Foundational
 * types (Person/Position/Group/Resource) default to `stable`; every other type
 * defaults to `experimental`. Used both when seeding/creating a type without an
 * explicit stability and when reading a legacy record that predates the field.
 * `is_seed` cannot be used for this because tenant-seeded types are also seeds.
 */
export function defaultStabilityForType(name: string): Stability {
  return isFoundationalTypeName(name) ? 'stable' : 'experimental'
}

// ── Type system records ────────────────────────────────────────────────────

/**
 * The `attribute_schema` carried by `ResourceType` records is a loose,
 * JSON-Schema-shaped structural type. We mirror the DNA attribute shape
 * (one entry per declared attribute) rather than full JSON-Schema syntax
 * so the codegen and storage stay tractable. The v1 ajv translation is
 * the identity transform.
 */
export interface AttributeSchemaEntry {
  name: string
  type:
    | 'string'
    | 'text'
    | 'number'
    | 'boolean'
    | 'date'
    | 'datetime'
    | 'enum'
    | 'reference'
  description?: string
  required?: boolean
  /** Required when `type === 'enum'`. */
  values?: string[]
  /** Required when `type === 'reference'`; names the target ResourceType. */
  resource?: string
}

/** Array form: an array of attribute entries, identical to DNA's per-Resource `attributes[]`. */
export type AttributeSchema = AttributeSchemaEntry[]

/** A live `ResourceType` record — the class/template that instances validate against. */
export interface ResourceType {
  id: string
  name: string
  category: NounCategory
  attribute_schema: AttributeSchema
  current_version: number
  /** Concept maturity, orthogonal to `current_version`. See {@link Stability}. */
  stability: Stability
  description?: string
  /** True iff this record was created by `seedFromDna`. Admin-edited types stay `is_seed: false`. */
  is_seed: boolean
}

/** Immutable history record. One per `update` on a `ResourceType`. */
export interface ResourceTypeVersion {
  id: string
  resource_type_id: string
  version: number
  attribute_schema: AttributeSchema
  /** The `stability` in effect when this version was written (self-describing history). */
  stability: Stability
  created_at: string
}

/** Input shape for `resourceType.create` / `update`. `id` is optional (hybrid assignment). */
export interface ResourceTypeInput {
  id?: string
  name: string
  category: NounCategory
  attribute_schema: AttributeSchema
  /** Optional; when omitted, defaults via {@link defaultStabilityForType}. */
  stability?: Stability
  description?: string
}

/** Patch shape for `resourceType.update`. `name` is intentionally absent — names are immutable. */
export interface ResourceTypeUpdate {
  attribute_schema?: AttributeSchema
  /** When present, sets stability alongside the schema revision. To transition stability without bumping the version, use `setStability`. */
  stability?: Stability
  description?: string
}

/** A live `RelationshipType` record — the class for Links between two ResourceTypes. */
export interface RelationshipType {
  id: string
  name: string
  from: string
  to: string
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'
  attribute: string
  inverse?: string
  attribute_schema?: AttributeSchema
  current_version: number
  /** Concept maturity, orthogonal to `current_version`. See {@link Stability}. */
  stability: Stability
  description?: string
  is_seed: boolean
}

/** Immutable history record for a `RelationshipType`. */
export interface RelationshipTypeVersion {
  id: string
  relationship_type_id: string
  version: number
  attribute_schema?: AttributeSchema
  /** The `stability` in effect when this version was written (self-describing history). */
  stability: Stability
  created_at: string
}

/** Input shape for `relationshipType.create` / `update`. */
export interface RelationshipTypeInput {
  id?: string
  name: string
  from: string
  to: string
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'
  attribute: string
  inverse?: string
  attribute_schema?: AttributeSchema
  /** Optional; when omitted, defaults via {@link defaultStabilityForType}. */
  stability?: Stability
  description?: string
}

/** Patch shape for `relationshipType.update`. `name`/`from`/`to` are immutable. */
export interface RelationshipTypeUpdate {
  cardinality?: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'
  attribute?: string
  inverse?: string
  attribute_schema?: AttributeSchema
  /** When present, sets stability alongside the schema revision. To transition stability without bumping the version, use `setStability`. */
  stability?: Stability
  description?: string
}

/** Options for `resourceType.delete` / `relationshipType.delete`. */
export interface TypeDeleteOptions {
  /** When true, delete every Instance / Link of the type before removing the type itself. */
  cascade?: boolean
}

// ── Runtime data records (Instance / Link) ─────────────────────────────────

/** Endpoint of a Link — the typed identity of an Instance. */
export interface InstanceRef {
  typeName: string
  id: string
}

/** Optional fields a caller can pass when creating a Link. */
export interface LinkCreateOptions {
  /** Caller-provided Link ID. If omitted, the adapter generates a UUIDv4. */
  id?: string
  /** Discriminator for role assignments (e.g. `"primary_borrower"`). Absent for plain references. */
  role?: string
  /** Role-specific payload (e.g. `{ assigned_at: "2026-05-23" }`). */
  attributes?: Record<string, unknown>
}

/** A Link record as returned by `link.list()`. Carries `_schemaVersion` from the RelationshipType current_version at write time. */
export interface LinkRecord {
  id: string
  from: InstanceRef
  to: InstanceRef
  role?: string
  attributes?: Record<string, unknown>
  _schemaVersion?: number
}

/** Optional filter for `link.list()`. Provide any subset of fields. */
export interface LinkListFilter {
  from?: InstanceRef
  to?: InstanceRef
  role?: string
}

/** Instance record as returned by `instance.get()` / `instance.list()`. */
export type InstanceRecord = Record<string, unknown> & {
  id: string
  _schemaVersion?: number
}

/** Payload accepted by `instance.create()`. `id` is optional (hybrid assignment). */
export type InstanceCreateInput = Record<string, unknown> & { id?: string }

// ── Seeding ────────────────────────────────────────────────────────────────

/** Per-collection breakdown of what a `seedFromDna` call wrote. */
export interface SeedReport {
  resourceTypesCreated: number
  resourceTypesSkipped: number
  relationshipTypesCreated: number
  relationshipTypesSkipped: number
}

// ── Public interface ───────────────────────────────────────────────────────

/**
 * Runtime-data persistence interface. Implementations:
 *
 * - Manage the type system (`resourceType.*`, `relationshipType.*`).
 * - Persist runtime data (`instance.*`, `link.*`) with `_schemaVersion`
 *   stamps from the relevant type's `current_version`.
 * - Provide first-boot seeding (`seedFromDna`, `hasBeenSeeded`).
 * - Create backend constraints/indexes (`migrate`).
 */
export interface DnaDataStore {
  /**
   * Create backend constraints and indexes. Does NOT seed any data — seeding
   * is the dedicated `seedFromDna` method. Idempotent; safe to call on every
   * startup.
   */
  migrate(): Promise<void>

  /**
   * Seed `ResourceType` and `RelationshipType` records from a DNA document.
   * Idempotent on `name` — existing types are NOT overwritten. After
   * successful seeding, writes a seed marker so subsequent calls to
   * `hasBeenSeeded()` return true.
   *
   * On first invocation against a fresh store, ALWAYS writes four
   * foundational `ResourceType` records (`Person`, `Position`, `Group`,
   * `Resource`) with `is_seed: true` and matching `category` values, then
   * walks `dna.domain.{persons,positions,groups,resources}` and
   * `dna.relationships[]` for tenant-domain seeds.
   */
  seedFromDna(dna: OperationalDNA): Promise<SeedReport>

  /** Returns true iff the seed marker exists (i.e. `seedFromDna` has been called at least once). */
  hasBeenSeeded(): Promise<boolean>

  /** `ResourceType` CRUD — the class/template registry for runtime data. */
  resourceType: {
    /** Create a new ResourceType; writes the live record and an initial version. */
    create(input: ResourceTypeInput): Promise<{ id: string }>
    get(id: string): Promise<ResourceType | null>
    /** Filter by category if provided; otherwise return every live ResourceType. */
    list(filter?: { category?: NounCategory }): Promise<ResourceType[]>
    /** Update bumps `current_version` and appends a new version record. */
    update(id: string, patch: ResourceTypeUpdate): Promise<void>
    /**
     * Transition the live record's `stability` only. Does NOT bump
     * `current_version` and does NOT append a version record — stability is a
     * property of the concept, orthogonal to schema revisions.
     */
    setStability(id: string, stability: Stability): Promise<void>
    /** Reject with `TypeInUseError` if any Instance exists, unless `cascade: true`. */
    delete(id: string, opts?: TypeDeleteOptions): Promise<void>
    /** Version history in descending version order. */
    versions(id: string): Promise<ResourceTypeVersion[]>
  }

  /** `RelationshipType` CRUD — same shape as resourceType, scoped to relationship metadata. */
  relationshipType: {
    create(input: RelationshipTypeInput): Promise<{ id: string }>
    get(id: string): Promise<RelationshipType | null>
    list(): Promise<RelationshipType[]>
    update(id: string, patch: RelationshipTypeUpdate): Promise<void>
    /** Transition the live record's `stability` only — no version bump. See `resourceType.setStability`. */
    setStability(id: string, stability: Stability): Promise<void>
    delete(id: string, opts?: TypeDeleteOptions): Promise<void>
    versions(id: string): Promise<RelationshipTypeVersion[]>
  }

  /** Per-Instance CRUD scoped by `typeName` (the ResourceType's `name`). */
  instance: {
    /**
     * Create an Instance. If `data.id` is present, that ID is used (and
     * collisions throw). Otherwise the adapter generates a UUIDv4. The
     * resulting record carries `_schemaVersion = <ResourceType.current_version>`.
     */
    create(typeName: string, data: InstanceCreateInput): Promise<{ id: string }>
    get(typeName: string, id: string): Promise<InstanceRecord | null>
    update(typeName: string, id: string, patch: Record<string, unknown>): Promise<void>
    delete(typeName: string, id: string): Promise<void>
    list(typeName: string): Promise<InstanceRecord[]>
  }

  /** Link CRUD. Each Link connects two Instances and may carry a role + attributes. */
  link: {
    create(from: InstanceRef, to: InstanceRef, opts?: LinkCreateOptions): Promise<{ id: string }>
    delete(linkId: string): Promise<void>
    list(filter?: LinkListFilter): Promise<LinkRecord[]>
  }

  /** Release any backend resources (e.g. database driver). No-op for in-memory adapters. */
  close(): Promise<void>
}

// ── Error sentinel ─────────────────────────────────────────────────────────

/**
 * Thrown by `resourceType.delete(id)` and `relationshipType.delete(id)` when
 * Instances or Links of the targeted type still exist and `cascade: true`
 * was not supplied. Adapters MUST throw this exact shape so callers can
 * match against it.
 */
export class TypeInUseError extends Error {
  readonly inUseCount: number
  readonly typeName: string
  constructor(typeName: string, inUseCount: number) {
    super(
      `Cannot delete ${typeName}: ${inUseCount} instance(s) still exist. Pass { cascade: true } to delete them too.`,
    )
    this.name = 'TypeInUseError'
    this.typeName = typeName
    this.inUseCount = inUseCount
  }
}
