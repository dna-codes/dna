## ADDED Requirements

### Requirement: ApplicationShell composition component

The library SHALL export an `ApplicationShell` compound component that arranges
the full-page chrome over the structural primitives, replacing the former
demo-only `AppBar > ApplicationShell` Storybook story. It SHALL be headless:
make no visual decisions beyond layout structure, bundle no CSS, forward
`className`/`style` and native props, use `forwardRef`, and support `asChild` on
its parts. It SHALL expose `ApplicationShell.Root`, `ApplicationShell.Header`,
`ApplicationShell.Body`, `ApplicationShell.Sidebar`, and `ApplicationShell.Main`.

#### Scenario: Root wraps the application region

- **WHEN** `<ApplicationShell.Root>` is rendered
- **THEN** it renders the `Application` region carrying a `data-ui-app-shell`
  hook
- **AND** it makes no `banner`/`main` landmark claim of its own (those come from
  its `Header`/`Main` children)

#### Scenario: Body lays out sidebar and main side by side

- **WHEN** `ApplicationShell.Body` wraps `ApplicationShell.Sidebar` and
  `ApplicationShell.Main`
- **THEN** the sidebar and main region are arranged side by side
- **AND** `ApplicationShell.Body` carries a `data-ui-app-shell-body` hook

#### Scenario: Slots compose the real primitives

- **WHEN** `ApplicationShell.Header`, `ApplicationShell.Sidebar`, and
  `ApplicationShell.Main` render
- **THEN** `Header` provides the `banner`, `Sidebar`/`NavRail` provide the rail,
  and `Page` provides the routed `main` region
- **AND** each slot supports `asChild` so consumers can drop to the raw
  primitive

#### Scenario: Exported from the barrel

- **WHEN** consuming the package barrel
- **THEN** `ApplicationShell` is importable as a named export

### Requirement: ApplicationShell story replaces the AppBar shell story

The former `AppBar > ApplicationShell` Storybook story SHALL be removed and its
full-chrome composition demonstrated by the `ApplicationShell` component's own
story (catalog title `Structure/ApplicationShell`).

#### Scenario: Story exercises the composed shell

- **WHEN** the `Structure/ApplicationShell` story renders
- **THEN** it shows `Header` + `Sidebar`/`NavRail` + `Page` + `PageHeader`
  composed end to end via the `ApplicationShell` slots
- **AND** no `ApplicationShell` story remains under the `Header` (former
  `AppBar`) component
