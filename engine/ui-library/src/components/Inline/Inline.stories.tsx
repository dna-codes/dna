import type { Meta, StoryObj } from "@storybook/react-vite";
import { Inline } from "./Inline";
import { Input } from "../Input/Input";
import { Button } from "../Button/Button";

const meta = {
  title: "Structure/Inline",
  component: Inline,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Inline>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A row of controls. The full-width `Input` flexes to fill the remaining space
 * while the fixed-width `Button` keeps its natural size — all spaced by the
 * system's control gap.
 */
export const SearchRow: Story = {
  render: () => (
    <form role="search" action="/resources" method="get">
      <Inline>
        <Input
          type="search"
          name="q"
          aria-label="Search resources"
          placeholder="Search resources…"
        />
        <Button type="submit" variant="primary">
          Search
        </Button>
      </Inline>
    </form>
  ),
};

/** A button group — fixed-width controls keep their natural width. */
export const ButtonGroup: Story = {
  render: () => (
    <Inline>
      <Button variant="primary">Save</Button>
      <Button variant="secondary">Cancel</Button>
    </Inline>
  ),
};
