import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmptyState } from "./EmptyState";
import { Button } from "../Button/Button";

const meta = {
  title: "Content/EmptyState",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The canonical "nothing here yet" placeholder, with a primary call to action. */
export const Default: Story = {
  render: () => (
    <div style={{ maxWidth: "40rem" }}>
      <EmptyState.Root>
        <EmptyState.Icon>📂</EmptyState.Icon>
        <EmptyState.Title>No resources yet</EmptyState.Title>
        <EmptyState.Description>
          Resources are the structure templates this domain manages. Create the
          first one to get started.
        </EmptyState.Description>
        <EmptyState.Actions>
          <Button variant="ghost">Import</Button>
          <Button variant="primary">New resource</Button>
        </EmptyState.Actions>
      </EmptyState.Root>
    </div>
  ),
};

/** Minimal — just an icon and a line of text. */
export const Minimal: Story = {
  render: () => (
    <div style={{ maxWidth: "40rem" }}>
      <EmptyState.Root>
        <EmptyState.Icon>🔍</EmptyState.Icon>
        <EmptyState.Title>No matches</EmptyState.Title>
      </EmptyState.Root>
    </div>
  ),
};
