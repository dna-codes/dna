## ADDED Requirements

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
