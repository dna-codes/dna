import type { Meta, StoryObj } from "@storybook/react-vite";
import { ApplicationShell } from "./ApplicationShell";
import { Header } from "../Header/Header";
import { NavRail } from "../NavRail/NavRail";
import { PageHeader } from "../PageHeader/PageHeader";
import { Input } from "../Input/Input";
import { Button } from "../Button/Button";
import { Avatar } from "../Avatar/Avatar";

const meta = {
  title: "Structure/ApplicationShell",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The whole GitHub-style chrome composed end to end — `Header` + `NavRail`
 * (inside the `Sidebar`) + `PageHeader` — the canonical full-page arrangement,
 * now a reusable component instead of a hand-rolled composition.
 */
export const Default: Story = {
  render: () => (
    <ApplicationShell.Root style={{ minHeight: "100vh" }}>
      <ApplicationShell.Header>
        <Header.Brand>DNA.codes</Header.Brand>
        <Header.Search>
          <Input type="search" placeholder="Search…" aria-label="Search" />
        </Header.Search>
        <Header.Actions>
          <Avatar>
            <Avatar.Fallback>TK</Avatar.Fallback>
          </Avatar>
        </Header.Actions>
      </ApplicationShell.Header>
      <ApplicationShell.Body>
        <ApplicationShell.Sidebar asChild>
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
        </ApplicationShell.Sidebar>
        <ApplicationShell.Main title="Resources">
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
        </ApplicationShell.Main>
      </ApplicationShell.Body>
    </ApplicationShell.Root>
  ),
};
