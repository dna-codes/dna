# dna-react-package Specification

## Purpose
TBD - created by archiving change add-dna-react. Update Purpose after archive.
## Requirements
### Requirement: packages/react/ is a standalone npm package
There SHALL be a `packages/react/` directory published as `@dna-codes/dna-react`. It SHALL list `react` and `react-dom` as peer dependencies and `@dna-codes/dna-core` as a runtime dependency. It SHALL have no dependency on `@dna-codes/dna-schemas` directly. It SHALL be added to the root `package.json` workspaces array.

#### Scenario: Package has correct peer dependencies
- **WHEN** `packages/react/package.json` is read
- **THEN** it SHALL list `react` and `react-dom` under `peerDependencies` and `@dna-codes/dna-core` under `dependencies`

#### Scenario: Package is in the workspace
- **WHEN** the root `package.json` workspaces array is read
- **THEN** it SHALL include `packages/react`

### Requirement: Package exports DnaProvider, Operation, and useOperation
The main export of `@dna-codes/dna-react` SHALL expose `DnaProvider`, `Operation`, and `useOperation` as named exports. It SHALL also export the `AuditEvent` TypeScript type.

#### Scenario: Named exports are accessible
- **WHEN** `import { DnaProvider, Operation, useOperation } from '@dna-codes/dna-react'` is called
- **THEN** all three SHALL be defined and not throw at import time

#### Scenario: AuditEvent type is exported
- **WHEN** `import type { AuditEvent } from '@dna-codes/dna-react'` is used in TypeScript
- **THEN** it SHALL compile without error

