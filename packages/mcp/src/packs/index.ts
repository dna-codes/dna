import type { ResourceTypeInput, RelationshipTypeInput } from '@dna-codes/dna-core'
import * as operational from './operational.js'
import * as crm from './crm.js'
import * as hr from './hr.js'

export type PackName = 'operational' | 'crm' | 'hr'

export interface PackDefinition {
  name: PackName
  label: string
  description: string
  resourceTypes: ResourceTypeInput[]
  relationshipTypes: RelationshipTypeInput[]
}

export const PACKS: Record<PackName, PackDefinition> = {
  operational: {
    name: 'operational',
    label: 'Operational',
    description: 'People, positions, departments, and processes. For org structure, reporting chains, and workflow mapping.',
    resourceTypes: operational.resourceTypes,
    relationshipTypes: operational.relationshipTypes,
  },
  crm: {
    name: 'crm',
    label: 'CRM',
    description: 'Contacts, accounts, opportunities, and deals. For sales pipelines and customer relationship tracking.',
    resourceTypes: crm.resourceTypes,
    relationshipTypes: crm.relationshipTypes,
  },
  hr: {
    name: 'hr',
    label: 'HR',
    description: 'Employees, roles, teams, and job postings. For people-ops, headcount planning, and recruitment.',
    resourceTypes: hr.resourceTypes,
    relationshipTypes: hr.relationshipTypes,
  },
}

export const DEFAULT_PACK: PackName = 'operational'
