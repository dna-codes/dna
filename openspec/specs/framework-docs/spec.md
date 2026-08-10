# framework-docs Specification

## Purpose
TBD - created by archiving change add-cedar-and-trigger-framework-docs. Update Purpose after archive.
## Requirements
### Requirement: Cedar framework comparison doc exists at docs/frameworks/cedar.md

The repository SHALL include a Cedar comparison doc at `docs/frameworks/cedar.md` that maps Cedar's policy primitives to their DNA equivalents and follows the four-section structure used by every other doc in `docs/frameworks/`.

#### Scenario: Doc structure matches existing framework docs
- **WHEN** a reader opens `docs/frameworks/cedar.md`
- **THEN** the file contains, in order: a concept mapping table, a "Where DNA intentionally differs" section, a concrete translation example, and a "See also" section linking to other framework docs

#### Scenario: Mapping table covers Cedar's policy primitives
- **WHEN** the mapping table is read
- **THEN** it includes rows for `principal`, `action`, `resource`, `when`/`unless` conditions, `permit`/`forbid` effects, and Cedar's entity/schema concept (with the row noting DNA has no direct schema/entity-store analog)

#### Scenario: Translation example is concrete
- **WHEN** the translation example is read
- **THEN** a Cedar `permit (principal in Role::"Underwriter", action == Action::"Approve", resource is Loan)` policy is translated to a DNA `Rule` + Operation pair, with file paths or line counts that a reader can verify against `examples/lending/`

### Requirement: Triggers and events comparison doc exists at docs/frameworks/triggers-and-events.md

The repository SHALL include a single combined comparison doc at `docs/frameworks/triggers-and-events.md` covering n8n, Zapier, GitHub Actions, and EventBridge in one file.

#### Scenario: Doc covers all four tools
- **WHEN** a reader opens `docs/frameworks/triggers-and-events.md`
- **THEN** the file contains a clearly-labeled mini-mapping-table for each of n8n, Zapier, GitHub Actions, and EventBridge

#### Scenario: Each tool's mapping table addresses DNA's four Trigger.source values
- **WHEN** any tool's mini-table is read
- **THEN** it shows how DNA's `user`, `schedule`, `webhook`, and `operation` Trigger sources map to that tool's equivalents (or notes "no equivalent" with one-line reasoning if a value doesn't map)

#### Scenario: Doc has one combined "intentional differences" section, not four
- **WHEN** the "Where DNA intentionally differs" section is read
- **THEN** it lists features common across these tools that DNA omits — e.g., EventBridge's expressive event patterns, Zapier's per-app trigger templates — with reasoning, written once rather than repeated per tool

#### Scenario: Concrete example uses one tool only
- **WHEN** the translation example is read
- **THEN** a single tool's trigger configuration (e.g., a GitHub Actions `on: push` block) is shown, then translated to DNA's `Trigger` form

### Requirement: Framework README index includes both new docs

The repository's `docs/frameworks/README.md` SHALL list both new docs in its index table, in the same row format as existing entries.

#### Scenario: Cedar row added to index table
- **WHEN** the framework README's index table is read
- **THEN** it contains a row referencing `cedar.md` with a "When you'd reach for it" cell and a "DNA mapping" cell, both phrased consistently with the surrounding rows

#### Scenario: Triggers-and-events row added to index table
- **WHEN** the framework README's index table is read
- **THEN** it contains a row referencing `triggers-and-events.md` whose "DNA mapping" cell makes clear the doc covers four tools (n8n, Zapier, GitHub Actions, EventBridge), not one

### Requirement: The framework index names where each comparison is canonical

`docs/frameworks/README.md` SHALL state, for every comparison it indexes, whether that comparison is
canonical on `https://dna.codes/docs/frameworks` or in this repository. A reader following the index
SHALL never be sent to a destination that does not carry the doc being indexed.

#### Scenario: A ported comparison points at the site

- **WHEN** a reader reads the index row for a comparison that has been ported to the site
- **THEN** the row MUST link to that comparison on `https://dna.codes/docs/frameworks`
- **AND** the README MUST make clear the site copy is the canonical one

#### Scenario: An unported comparison stays canonical here

- **WHEN** a reader reads the index row for a comparison that has not been ported
- **THEN** the row MUST link to the file in this repository
- **AND** the README MUST NOT imply the site carries it

#### Scenario: The index states the split rather than leaving it implied

- **WHEN** a reader reads the README preamble
- **THEN** it MUST state that some comparisons are canonical on the site and some in this repository

### Requirement: Retiring a framework doc leaves no broken inbound link

When a comparison is retired from this repository in favor of the site, every inbound link to it
SHALL be updated in the same change.

#### Scenario: No link survives its target

- **WHEN** a framework doc is retired from `docs/frameworks/`
- **THEN** no markdown link in `README.md` or `docs/**` MUST still point at the retired file

