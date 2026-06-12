import type { ResourceTypeInput, RelationshipTypeInput } from '@dna-codes/dna-core'

export const resourceTypes: ResourceTypeInput[] = [
  { name: 'contact',     category: 'person',   description: 'An individual external contact or lead.',          attribute_schema: [], stability: 'experimental' },
  { name: 'account',     category: 'group',    description: 'A company or organization being tracked.',         attribute_schema: [], stability: 'experimental' },
  { name: 'opportunity', category: 'resource', description: 'A potential deal in the sales pipeline.',          attribute_schema: [], stability: 'experimental' },
  { name: 'deal',        category: 'resource', description: 'A closed or closing revenue opportunity.',         attribute_schema: [], stability: 'experimental' },
  { name: 'activity',    category: 'resource', description: 'A logged interaction: call, email, meeting, etc.', attribute_schema: [], stability: 'experimental' },
]

export const relationshipTypes: RelationshipTypeInput[] = [
  { name: 'owned_by',     from: 'account',     to: 'contact',     cardinality: 'many-to-many', attribute: 'owned_by',     description: 'An account is owned/managed by a contact or person.',    stability: 'experimental' },
  { name: 'belongs_to',   from: '*',           to: '*',           cardinality: 'many-to-many', attribute: 'belongs_to',   description: 'Generic containment.',                                    stability: 'experimental' },
  { name: 'converts_to',  from: 'opportunity', to: 'deal',        cardinality: 'many-to-many', attribute: 'converts_to',  description: 'An opportunity converts into a deal.',                    stability: 'experimental' },
  { name: 'has_activity', from: 'account',     to: 'activity',    cardinality: 'many-to-many', attribute: 'has_activity', description: 'An account has a logged activity.',                       stability: 'experimental' },
  { name: 'assigned_to',  from: 'opportunity', to: 'contact',     cardinality: 'many-to-many', attribute: 'assigned_to',  description: 'An opportunity is assigned to a person/contact.',         stability: 'experimental' },
]
