## ADDED Requirements

### Requirement: FixtureTheme type and DEFAULT_THEME exist in canvas-theme module
`lib/canvas-theme.ts` SHALL export a `FixtureTheme` interface with fields `bg`, `primary`, `accent`, `text`, `textMuted` (all strings), and a `DEFAULT_THEME` constant of type `FixtureTheme` representing the existing dark palette. It SHALL NOT export a `THEMES` map or any client-specific identifiers.

#### Scenario: DEFAULT_THEME matches the existing dark palette
- **WHEN** `DEFAULT_THEME` is imported from `lib/canvas-theme`
- **THEN** `DEFAULT_THEME.bg` SHALL be `#0A0F1E`, `DEFAULT_THEME.primary` SHALL be `#0D9488`, and `DEFAULT_THEME.accent` SHALL be `#2DD4BF`

### Requirement: ResourceGraph supports an optional embedded theme
The `ResourceGraph` interface in `lib/resource-graph.ts` SHALL include an optional field `theme?: FixtureTheme`. Fixtures that omit this field SHALL continue to work without modification.

#### Scenario: Fixture with theme field parses correctly
- **WHEN** a `dna.json` fixture containing a `theme` object is imported
- **THEN** `fixture.theme` SHALL be assignable to `FixtureTheme`

#### Scenario: Fixture without theme field is still valid
- **WHEN** an existing fixture without a `theme` field is imported
- **THEN** `fixture.theme` SHALL be `undefined` and no type error SHALL occur

### Requirement: All JointJS canvas components accept an optional theme prop
`OrgChartCanvas`, `ProcessFlowCanvas`, `SwimlaneCanvas`, and `ResponsibilityMapCanvas` SHALL each accept an optional `theme?: FixtureTheme` prop. When provided, the theme's color tokens SHALL replace the component's internal hardcoded color constants. When omitted, the component SHALL use `DEFAULT_THEME` and behave identically to the pre-theming implementation.

#### Scenario: Canvas uses provided theme background
- **WHEN** a canvas component is rendered with `theme={{ bg: '#FFFFFF', ... }}`
- **THEN** the JointJS paper background SHALL be `#FFFFFF`

#### Scenario: Canvas defaults to dark theme when no theme prop is given
- **WHEN** a canvas component is rendered without a `theme` prop
- **THEN** the JointJS paper background SHALL be `#0A0F1E`

### Requirement: RunbookCanvas accepts and applies an optional theme prop
`RunbookCanvas` SHALL accept an optional `theme?: FixtureTheme` prop and apply `theme.primary` to role badge backgrounds and `theme.accent` to step number indicators via inline styles. When omitted, it SHALL use `DEFAULT_THEME`.

#### Scenario: RunbookCanvas renders with custom theme colors
- **WHEN** `RunbookCanvas` is rendered with `theme={{ primary: '#6800a3', accent: '#9333ea', ... }}`
- **THEN** role badge elements SHALL have background color `#6800a3`

### Requirement: Existing lens routes are unaffected
The 15 existing lens routes (mass-torts, ecommerce, lending × 5 lenses) SHALL NOT pass a `theme` prop. Canvas components SHALL default to `DEFAULT_THEME`, producing identical visual output.

#### Scenario: Existing org-chart renders with dark theme
- **WHEN** `/lens/mass-torts/org-chart` is rendered
- **THEN** the JointJS paper background SHALL be `#0A0F1E`
