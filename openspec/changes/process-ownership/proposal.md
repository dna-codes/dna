## Why

There is currently no way to model which position is accountable for an entire process — only which positions execute steps within a process. This gap makes it impossible to answer "who owns this process?" and prevents the job description lens from surfacing high-level process accountability alongside step-level responsibilities.

## What Changes

- Add `owned_by` relationship type to the operational pack (`process → position`, `many-to-one`, inverse `owns`)
- Update `fromResourceGraph` (graph-studio job description transformer) to collect `owned_by` links and expose an `ownedProcesses` field on each `JobDescription`
- Update `JobDescriptionCanvas` to render a "Process Ownership" section per position card
- Update the MCP `job-descriptions` lens to collect `owned_by` links and expose `ownedProcesses` on each `JobDescEntry`

## Capabilities

### New Capabilities

- `process-ownership`: The `owned_by` relationship type connecting `process` → `position`, enabling accountability modeling at the process level (not just step-level via `assigned_to`).

### Modified Capabilities

- `job-description-lens`: Requirements change — the lens must now surface two distinct accountability tiers: process ownership (`owned_by`) and step-level execution (`assigned_to`). The `JobDescription` / `JobDescEntry` data shapes gain an `ownedProcesses` field, and the canvas gains a "Process Ownership" section.

## Impact

- `packages/mcp/src/packs/operational.ts` — new relationship type entry
- `apps/graph-studio/lib/lenses/job-description/fromResourceGraph.ts` — updated transformer and `JobDescription` type
- `apps/graph-studio/components/lenses/JobDescriptionCanvas.tsx` — new UI section
- `packages/mcp/src/lenses/job-descriptions.ts` — updated MCP lens and `JobDescEntry` type
