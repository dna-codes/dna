## MODIFIED Requirements

### Requirement: Reporting chains lens shows paths from each leaf to root

The reporting-chains lens SHALL show paths from each leaf to root over the `Position.parent` hierarchy (renamed from `Role.parent`). Its node slots SHALL reference the operational `Position` resource type; all other traversal behavior is unchanged.

#### Scenario: Chain follows Position.parent
- **WHEN** the lens evaluates over an operational graph
- **THEN** each reporting chain is built by following `Position.parent` from leaf to root
