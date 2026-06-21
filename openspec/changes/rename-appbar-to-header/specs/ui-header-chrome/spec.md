## ADDED Requirements

### Requirement: Compound Header global application bar

The library SHALL export a compound `Header` component (replacing the former
`AppBar`) as the global top application bar. It SHALL be headless: it makes no
visual decisions, bundles no CSS, forwards `className`/`style` and native props,
uses `forwardRef`, and supports `asChild` on every part. It SHALL expose the
parts `Header.Root`, `Header.Brand`, `Header.Nav`, `Header.Search`,
`Header.Spacer`, and `Header.Actions`.

#### Scenario: Root renders the banner landmark with header hook

- **WHEN** `<Header.Root>` is rendered as a top-level region
- **THEN** it renders a `<header>` exposing the `banner` landmark role
- **AND** it carries the `data-ui-header` attribute and no class of its own

#### Scenario: Parts emit header-namespaced styling hooks

- **WHEN** `Header.Brand`, `Header.Nav`, `Header.Search`, `Header.Spacer`, and
  `Header.Actions` are rendered
- **THEN** they carry `data-ui-header-brand`, `data-ui-header-nav`,
  `data-ui-header-search`, `data-ui-header-spacer`, and `data-ui-header-actions`
  respectively

#### Scenario: Nav and Search are distinguishable landmarks

- **WHEN** `Header.Nav` is rendered without an explicit `aria-label`
- **THEN** it is a `navigation` landmark labelled "Primary"
- **AND** a consumer-provided `aria-label` overrides that default
- **AND** `Header.Search` exposes a `search` landmark

#### Scenario: asChild composes onto a provided element

- **WHEN** any `Header.*` part is given `asChild` with a single child element
- **THEN** the part's hook and props are merged onto that child instead of
  rendering the default element

### Requirement: Header replaces the thin Header and AppBar exports

The library SHALL remove the previous thin `Header` semantic-element component
and the `AppBar` export. The compound `Header` SHALL be the sole top-bar
primitive, exported from the package barrel.

#### Scenario: Old exports are gone

- **WHEN** consuming the package barrel
- **THEN** there is no `AppBar` export and no thin `Header` semantic-element
  export
- **AND** importing `Header` yields the compound component

### Requirement: Header styling hooks renamed in the skin

The default skin SHALL style the `Header` via `data-ui-header*` selectors,
replacing the former `data-ui-appbar*` selectors, with no change to the
resulting appearance. The generated Tailwind skin SHALL be regenerated from the
updated `skin.css`.

#### Scenario: Skin targets header hooks

- **WHEN** the default skin is applied to a rendered `Header`
- **THEN** the layout/appearance matches the former `AppBar` skin
- **AND** no `data-ui-appbar*` selector remains in `skin.css` or the generated
  Tailwind skin
