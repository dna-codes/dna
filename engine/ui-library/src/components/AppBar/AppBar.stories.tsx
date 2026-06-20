import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppBar } from "./AppBar";
import { NavRail } from "../NavRail/NavRail";
import { PageHeader } from "../PageHeader/PageHeader";
import { Application } from "../Application/Application";
import { Sidebar } from "../Sidebar/Sidebar";
import { Page } from "../Page/Page";
import { Input } from "../Input/Input";
import { Button } from "../Button/Button";
import { Avatar } from "../Avatar/Avatar";

const meta = {
  title: "Structure/AppBar",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The global top bar: brand, primary navigation, a growable global-search slot,
 * and the account/actions cluster pinned to the end. Renders a `banner`
 * landmark.
 */
export const Default: Story = {
  render: () => (
    <AppBar.Root>
      <AppBar.Brand>DNA.codes</AppBar.Brand>
      <AppBar.Nav>
        <a href="#repos" aria-current="page">
          Resources
        </a>
        <a href="#issues">Operations</a>
        <a href="#actions">Processes</a>
      </AppBar.Nav>
      <AppBar.Search>
        <Input type="search" placeholder="Search DNA…" aria-label="Search" />
      </AppBar.Search>
      <AppBar.Actions>
        <Button variant="ghost" size="sm">
          Docs
        </Button>
        <Avatar>
          <Avatar.Fallback>TK</Avatar.Fallback>
        </Avatar>
      </AppBar.Actions>
    </AppBar.Root>
  ),
};

/**
 * The whole GitHub-style chrome composed end to end — `AppBar` + `NavRail`
 * (inside a `Sidebar`) + `PageHeader` — the canonical replacement for an app's
 * interim `AppShell`/`PageHeader` compositions.
 */
export const ApplicationShell: Story = {
  render: () => (
    <Application style={{ minHeight: "100vh" }}>
      <AppBar.Root>
        <AppBar.Brand>DNA.codes</AppBar.Brand>
        <AppBar.Search>
          <Input type="search" placeholder="Search…" aria-label="Search" />
        </AppBar.Search>
        <AppBar.Actions>
          <Avatar>
            <Avatar.Fallback>TK</Avatar.Fallback>
          </Avatar>
        </AppBar.Actions>
      </AppBar.Root>
      <div style={{ display: "flex", alignItems: "stretch" }}>
        <Sidebar asChild>
          <NavRail.Root>
            <NavRail.Section>
              <NavRail.Label>Workspace</NavRail.Label>
              <NavRail.Item href="#overview" aria-current="page">
                Overview
              </NavRail.Item>
              <NavRail.Item href="#resources">Resources</NavRail.Item>
              <NavRail.Item href="#operations">Operations</NavRail.Item>
            </NavRail.Section>
            <NavRail.Section>
              <NavRail.Label>Admin</NavRail.Label>
              <NavRail.Item href="#roles">Roles</NavRail.Item>
              <NavRail.Item href="#settings">Settings</NavRail.Item>
            </NavRail.Section>
          </NavRail.Root>
        </Sidebar>
        <Page title="Resources" style={{ flex: 1 }}>
          <PageHeader.Root>
            <PageHeader.Breadcrumb>
              <PageHeader.BreadcrumbItem href="#root">
                DNA.codes
              </PageHeader.BreadcrumbItem>
              <PageHeader.BreadcrumbItem href="#ws">
                Lending
              </PageHeader.BreadcrumbItem>
              <PageHeader.BreadcrumbItem asChild aria-current="page">
                <span>Resources</span>
              </PageHeader.BreadcrumbItem>
            </PageHeader.Breadcrumb>
            <PageHeader.Heading>
              <PageHeader.Title>Resources</PageHeader.Title>
              <PageHeader.Actions>
                <Button variant="ghost" size="sm">
                  Filter
                </Button>
                <Button variant="primary" size="sm">
                  New resource
                </Button>
              </PageHeader.Actions>
            </PageHeader.Heading>
            <PageHeader.Description>
              The structure templates this domain manages.
            </PageHeader.Description>
          </PageHeader.Root>
        </Page>
      </div>
    </Application>
  ),
};
