import type { ResourceTypeInput, RelationshipTypeInput } from '@dna-codes/dna-core'

export const resourceTypes: ResourceTypeInput[] = [
  { name: 'employee',    category: 'person',   description: 'A current employee of the organization.',            attribute_schema: [], stability: 'experimental' },
  { name: 'role',        category: 'role',     description: 'A named job function or position type.',             attribute_schema: [], stability: 'experimental' },
  { name: 'department',  category: 'group',    description: 'A functional division within the company.',          attribute_schema: [], stability: 'experimental' },
  { name: 'team',        category: 'group',    description: 'A cross-functional or project-based working group.', attribute_schema: [], stability: 'experimental' },
  { name: 'job-posting', category: 'resource', description: 'An open requisition being actively recruited for.',  attribute_schema: [], stability: 'experimental' },
]

export const relationshipTypes: RelationshipTypeInput[] = [
  { name: 'belongs_to',  from: '*',        to: '*',           cardinality: 'many-to-many', attribute: 'belongs_to',  description: 'Generic containment.',                                    stability: 'experimental' },
  { name: 'reports_to',  from: 'employee', to: 'employee',    cardinality: 'many-to-many', attribute: 'reports_to',  description: 'An employee reports to another employee.',                stability: 'experimental' },
  { name: 'applied_to',  from: 'employee', to: 'job-posting', cardinality: 'many-to-many', attribute: 'applied_to',  description: 'A person applied to a job posting.',                      stability: 'experimental' },
  { name: 'holds',       from: 'employee', to: 'role',        cardinality: 'many-to-many', attribute: 'holds',       description: 'An employee holds a role.',                               stability: 'experimental' },
  { name: 'member_of',   from: 'employee', to: 'team',        cardinality: 'many-to-many', attribute: 'member_of',   description: 'An employee is a member of a team.',                      stability: 'experimental' },
]
