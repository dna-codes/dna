export interface LensEntry {
  name: string
  title: string
  description: string
  href: string
}

export const LENS_REGISTRY: Record<string, LensEntry> = {
  'org-chart': {
    name: 'org-chart',
    title: 'Org Chart',
    description: 'Structural containment and membership: domains, groups, roles, and persons.',
    href: '/lens/org-chart',
  },
  'job-description': {
    name: 'job-description',
    title: 'Job Description',
    description: 'One formatted job description per position, derived directly from the DNA graph.',
    href: '/lens/job-description',
  },
}

export function getLens(name: string): LensEntry | null {
  return LENS_REGISTRY[name] ?? null
}
