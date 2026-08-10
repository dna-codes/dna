# docs-canonical-source Specification

## Purpose
TBD - created by archiving change reconcile-docs-with-dna-codes-site. Update Purpose after archive.
## Requirements
### Requirement: Every documentation area names one canonical home

Each documentation area in this repository SHALL state where it is canonical — in this repository or
on `dna.codes/docs`. The statement SHALL live in the documentation itself, not only in a change
proposal, so a reader who arrives at a file can tell whether they are reading the governing copy.

#### Scenario: A reader lands on a non-canonical file

- **WHEN** a reader opens a documentation file whose canonical home is the site
- **THEN** the file MUST say so and link to the canonical location

#### Scenario: A reader lands on a canonical file

- **WHEN** a reader opens a documentation file that is canonical in this repository
- **THEN** nothing in it MUST suggest the site supersedes it

### Requirement: Superseded material is retired, not left alongside its replacement

Documentation material that another home now covers SHALL be retired rather than maintained in
parallel. Material that has no home elsewhere SHALL be kept, regardless of the vocabulary it uses.

#### Scenario: Superseded material is removed

- **WHEN** a documentation artifact's content is fully covered by a canonical home elsewhere
- **AND** nothing in this repository reads it programmatically
- **THEN** it MUST be retired rather than kept in parallel

#### Scenario: Uncovered material survives the cleanup

- **WHEN** a documentation artifact carries content no canonical home covers
- **THEN** it MUST be kept
- **AND** its inbound links MUST continue to resolve

### Requirement: The DSL is authoritative where vocabularies differ

Where conceptual documentation uses names that differ from the DSL primitives — for example a
metamodel vocabulary of types and perspectives against the DSL's layers and primitives — the
documentation SHALL name the DSL as authoritative. The difference SHALL be recorded as a deliberate
framing rather than as an unresolved reconciliation.

#### Scenario: A vocabulary difference is declared, not left open

- **WHEN** a reader opens conceptual documentation that uses non-DSL names
- **THEN** it MUST state that the DSL primitives are authoritative
- **AND** it MUST NOT describe the difference as an open thread awaiting reconciliation

