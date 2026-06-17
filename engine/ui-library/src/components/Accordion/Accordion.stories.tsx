import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Accordion } from "./Accordion";

const meta = {
  title: "Navigation/Accordion",
  component: Accordion,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { type: "single" },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A common landing-page FAQ pattern. */
export const FAQ: Story = {
  render: () => (
    <Accordion type="single" collapsible style={{ width: 420 }}>
      <Accordion.Item value="pricing">
        <Accordion.Trigger>Is there a free plan?</Accordion.Trigger>
        <Accordion.Content>
          Yes — the free plan includes core features for individuals.
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="cancel">
        <Accordion.Trigger>Can I cancel anytime?</Accordion.Trigger>
        <Accordion.Content>
          Absolutely. Cancel from your billing settings at any time.
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
  // The panel content is collapsed (and absent from the a11y tree) until the
  // trigger is activated, which also flips aria-expanded.
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole("button", { name: /free plan/i });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(await canvas.findByText(/core features/i)).toBeVisible();
  },
};

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" style={{ width: 420 }}>
      <Accordion.Item value="one">
        <Accordion.Trigger>First</Accordion.Trigger>
        <Accordion.Content>Both can be open at once.</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="two">
        <Accordion.Trigger>Second</Accordion.Trigger>
        <Accordion.Content>No accordion collapse behaviour.</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
};
