export interface LensMeta {
  id: string
  label: string
  href: string
}

export interface ExampleMeta {
  id: string
  label: string
  description: string
  lenses: LensMeta[]
}

export const EXAMPLES: ExampleMeta[] = [
  {
    id: 'mass-torts',
    label: 'Marshall Fire Justice',
    description: 'Mass-tort case management firm with Case Operations, Litigation, and Client Services departments.',
    lenses: [
      { id: 'org-chart',          label: 'Org Chart',         href: '/lens/mass-torts/org-chart'          },
      { id: 'process-flow',      label: 'Process Flow',      href: '/lens/mass-torts/process-flow'      },
      { id: 'runbook',           label: 'Runbook',           href: '/lens/mass-torts/runbook'           },
      { id: 'swimlane',          label: 'Swimlane',          href: '/lens/mass-torts/swimlane'          },
      { id: 'responsibility-map',label: 'Responsibility Map',href: '/lens/mass-torts/responsibility-map'},
      { id: 'job-description',   label: 'Job Description',   href: '/lens/mass-torts/job-description'   },
    ],
  },
  {
    id: 'ecommerce',
    label: 'Apex Commerce',
    description: 'E-commerce enterprise with Catalog, Orders, Fulfillment, and Payments departments.',
    lenses: [
      { id: 'org-chart',          label: 'Org Chart',         href: '/lens/ecommerce/org-chart'          },
      { id: 'process-flow',      label: 'Process Flow',      href: '/lens/ecommerce/process-flow'      },
      { id: 'runbook',           label: 'Runbook',           href: '/lens/ecommerce/runbook'           },
      { id: 'swimlane',          label: 'Swimlane',          href: '/lens/ecommerce/swimlane'          },
      { id: 'responsibility-map',label: 'Responsibility Map',href: '/lens/ecommerce/responsibility-map'},
      { id: 'job-description',   label: 'Job Description',   href: '/lens/ecommerce/job-description'   },
    ],
  },
  {
    id: 'lending',
    label: 'ClearPath Lending',
    description: 'Consumer lending company with Origination, Underwriting, Servicing, and Collections departments.',
    lenses: [
      { id: 'org-chart',          label: 'Org Chart',         href: '/lens/lending/org-chart'          },
      { id: 'process-flow',      label: 'Process Flow',      href: '/lens/lending/process-flow'      },
      { id: 'runbook',           label: 'Runbook',           href: '/lens/lending/runbook'           },
      { id: 'swimlane',          label: 'Swimlane',          href: '/lens/lending/swimlane'          },
      { id: 'responsibility-map',label: 'Responsibility Map',href: '/lens/lending/responsibility-map'},
      { id: 'job-description',   label: 'Job Description',   href: '/lens/lending/job-description'   },
    ],
  },
  {
    id: 'audiobook-distributor',
    label: 'Content Operations',
    description: 'Audiobook distributor Content Operations team managing title review, catalog, rights, and merchandizing.',
    lenses: [
      { id: 'org-chart',          label: 'Org Chart',         href: '/lens/audiobook-distributor/org-chart'          },
      { id: 'process-flow',      label: 'Process Flow',      href: '/lens/audiobook-distributor/process-flow'      },
      { id: 'runbook',           label: 'Runbook',           href: '/lens/audiobook-distributor/runbook'           },
      { id: 'swimlane',          label: 'Swimlane',          href: '/lens/audiobook-distributor/swimlane'          },
      { id: 'responsibility-map',label: 'Responsibility Map',href: '/lens/audiobook-distributor/responsibility-map'},
      { id: 'job-description',   label: 'Job Description',   href: '/lens/audiobook-distributor/job-description'   },
    ],
  },
]
