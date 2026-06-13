## Context

The operational pack already has `assigned_to` (step → position) for step-level execution accountability. There is no relationship type for process-level ownership — no way to say "this whole process is the responsibility of this position." The job description lens derives responsibilities exclusively from `assigned_to`, so it cannot surface who owns a process end-to-end.

## Goals / Non-Goals

**Goals:**
- Add `owned_by` (process → position) to the operational pack as a stable seed relationship type
- Expose `ownedProcesses` on the `JobDescription` shape (graph-studio transformer) and `JobDescEntry` shape (MCP lens)
- Render a distinct "Process Ownership" section in `JobDescriptionCanvas`

**Non-Goals:**
- Widening `owned_by` to other resource types (e.g., `product → position`) — can be done later by changing `from: 'process'` to `from: '*'`
- Updating fixtures (`dna.json` example files) to use `owned_by` — that is example data work, not this change
- Adding `owned_by` handling to the org chart, process-flow, or other lenses

## Decisions

**Separate field, not merged with `responsibilities`**  
`ownedProcesses` is a distinct field on `JobDescription` / `JobDescEntry` rather than folding owned processes into the `responsibilities` array. Rationale: the semantics are different — ownership is accountability for the whole process, execution is participation in individual steps. Merging them would require a discriminator flag and complicate consumers. A separate field is cleaner and maps directly to a separate UI section.

**`many-to-one` cardinality for `owned_by`**  
A process has one accountable owner (the DRI model). Many-to-many would support co-ownership but blurs accountability, which is the main purpose of this relationship. Chosen: `many-to-one`. Can be relaxed later if needed.

**Inverse `owns` declared**  
The `owned_by` entry includes `inverse: 'owns'` so that position-centric queries ("what does this position own?") work naturally without a separate relationship type.

**No breaking change to existing `JobDescription` type**  
`ownedProcesses` is added as a required field defaulting to `[]` when no `owned_by` links exist. Existing fixtures without `owned_by` data continue to render correctly — they just show an empty or hidden ownership section.

## Risks / Trade-offs

- **Cardinality constraint not enforced at the graph layer** — `many-to-one` is declared in the type but the graph store does not enforce uniqueness. Multiple `owned_by` links from the same process are technically possible. Mitigation: the lens picks up all links and surfaces them; the UI is correct regardless.
- **Canvas section visible even when empty** — if no `owned_by` links exist, the "Process Ownership" section could appear empty. Mitigation: conditionally render the section only when `ownedProcesses.length > 0`.
