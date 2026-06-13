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

/**
 * Render a pack's real type definitions as a structured prompt block. This is
 * the single source of truth for the agent's pack vocabulary — it reads the
 * same `PackDefinition` used to seed the store, so the prompt can never drift
 * from what is registered. Resource types render as `name · category — desc`;
 * relationship types as `name · from→to · cardinality — desc`, mirroring the
 * shape of the reference example documents.
 */
export function renderPackForPrompt(packName: PackName): string {
  const pack = PACKS[packName] ?? PACKS[DEFAULT_PACK]

  const resourceLines = pack.resourceTypes
    .map(rt => `- **${rt.name}** · _${rt.category}_ — ${rt.description ?? ''}`.trimEnd())
    .join('\n')

  const relationshipLines = pack.relationshipTypes
    .map(rel => `- **${rel.name}** · ${rel.from}→${rel.to} · ${rel.cardinality} — ${rel.description ?? ''}`.trimEnd())
    .join('\n')

  return [
    `### ${pack.label} pack — ${pack.description}`,
    '',
    '**Resource types** (use these exact names as the `type` on add_instance):',
    resourceLines,
    '',
    '**Relationship types** (use these exact names as the `type` on add_link; respect the from→to endpoints):',
    relationshipLines,
  ].join('\n')
}
