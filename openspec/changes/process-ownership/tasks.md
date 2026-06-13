## 1. Operational Pack

- [ ] 1.1 Add `owned_by` entry to `relationshipTypes` in `packages/mcp/src/packs/operational.ts` (`from: 'process'`, `to: 'position'`, `cardinality: 'many-to-one'`, `attribute: 'owned_by'`, `inverse: 'owns'`, `stability: 'stable'`)

## 2. Graph-Studio Transformer

- [ ] 2.1 Add `ownedProcesses: { processName: string; processDescription?: string }[]` to the `JobDescription` interface in `apps/graph-studio/lib/lenses/job-description/fromResourceGraph.ts`
- [ ] 2.2 Collect `owned_by` relationships (process → position) in `fromResourceGraph` and populate `ownedProcesses` on each position's `JobDescription`

## 3. JobDescriptionCanvas

- [ ] 3.1 Add a "Process Ownership" section to `JobCard` in `apps/graph-studio/components/lenses/JobDescriptionCanvas.tsx`, rendered only when `jd.ownedProcesses.length > 0`, listing each owned process name (and description if present)

## 4. MCP Lens

- [ ] 4.1 Add `ownedProcesses: { title: string; description?: string }[]` to the `JobDescEntry` interface in `packages/mcp/src/lenses/job-descriptions.ts`
- [ ] 4.2 Collect `owned_by` links in `buildJobDescriptions` and populate `ownedProcesses` on each position entry
