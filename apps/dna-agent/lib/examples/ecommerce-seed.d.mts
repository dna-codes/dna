export interface SeedSummary {
  roots: number
  surfaceRecords: number
  grants: number
}

export function applyEcommerceSeed(
  baseUrl: string,
  opts?: { log?: (message: string) => void },
): Promise<SeedSummary>

export interface ExampleOrg {
  id: string
  label: string
  domain: string
  description: string
  apply: (baseUrl: string, opts?: { log?: (message: string) => void }) => Promise<SeedSummary>
}

export const EXAMPLES: ExampleOrg[]
