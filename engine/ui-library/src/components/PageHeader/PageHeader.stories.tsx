import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageHeader } from "./PageHeader";
import { Button } from "../Button/Button";

const meta = {
  title: "Structure/PageHeader",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The in-page header: a breadcrumb trail, the page title with an actions cluster
 * pinned to the end, and an optional description. Sits inside the route's
 * `Page`/`<main>`, so it is not a `banner`.
 */
export const Default: Story = {
  render: () => (
    <PageHeader.Root>
      <PageHeader.Breadcrumb>
        <PageHeader.BreadcrumbItem href="#root">
          DNA.codes
        </PageHeader.BreadcrumbItem>
        <PageHeader.BreadcrumbItem href="#lending">
          Lending
        </PageHeader.BreadcrumbItem>
        <PageHeader.BreadcrumbItem asChild aria-current="page">
          <span>Loan</span>
        </PageHeader.BreadcrumbItem>
      </PageHeader.Breadcrumb>
      <PageHeader.Heading>
        <PageHeader.Title>Loan</PageHeader.Title>
        <PageHeader.Actions>
          <Button variant="ghost" size="sm">
            Edit
          </Button>
          <Button variant="primary" size="sm">
            New operation
          </Button>
        </PageHeader.Actions>
      </PageHeader.Heading>
      <PageHeader.Description>
        A structure template the org manages — attributes, actions, and
        operations.
      </PageHeader.Description>
    </PageHeader.Root>
  ),
};

/** Minimal — just a title, no breadcrumb or actions. */
export const TitleOnly: Story = {
  render: () => (
    <PageHeader.Root>
      <PageHeader.Heading>
        <PageHeader.Title>Settings</PageHeader.Title>
      </PageHeader.Heading>
    </PageHeader.Root>
  ),
};
