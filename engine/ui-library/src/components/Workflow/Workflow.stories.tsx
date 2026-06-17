import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Workflow } from "./Workflow";

const meta = {
  title: "Structure/Workflow",
  component: Workflow.Root,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof Workflow.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A sequential, headless multi-step flow. The library ships behaviour and ARIA
 * hooks only — styling shown here is inline, applied by the consumer through
 * `className`/`style` and the `[data-ui-workflow-*]` hooks.
 */
export const Default: Story = {
  render: () => (
    <Workflow.Root defaultValue="account">
      <Workflow.Steps style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <Workflow.Step value="account">Account</Workflow.Step>
        <Workflow.Step value="profile">Profile</Workflow.Step>
        <Workflow.Step value="review">Review</Workflow.Step>
      </Workflow.Steps>

      <Workflow.Panel value="account">Account details go here.</Workflow.Panel>
      <Workflow.Panel value="profile">Profile details go here.</Workflow.Panel>
      <Workflow.Panel value="review">Review and submit.</Workflow.Panel>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <Workflow.Previous>Back</Workflow.Previous>
        <Workflow.Next>Next</Workflow.Next>
      </div>
    </Workflow.Root>
  ),
  // Exercises the state-machine seed: the first step is active on mount (only
  // its panel is rendered), and Next advances the sequence — swapping the
  // mounted panel and moving aria-current to the new step.
  play: async ({ canvas, userEvent }) => {
    await expect(
      canvas.getByRole("button", { name: "Account" }),
    ).toHaveAttribute("aria-current", "step");
    await expect(canvas.getByText("Account details go here.")).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "Next" }));

    await expect(
      canvas.getByRole("button", { name: "Profile" }),
    ).toHaveAttribute("aria-current", "step");
    await expect(canvas.getByText("Profile details go here.")).toBeVisible();
  },
};

/**
 * Step indicators expose `aria-current="step"`, `data-state`, and `data-complete`
 * so consumers can style active/visited/upcoming states. Here they are rendered
 * inside an `<ol>` via `asChild` for a numbered stepper.
 */
export const NumberedStepper: Story = {
  render: () => (
    <Workflow.Root defaultValue="one">
      <Workflow.Steps asChild>
        <ol style={{ display: "flex", gap: 16, listStyle: "decimal inside" }}>
          <li>
            <Workflow.Step value="one">First</Workflow.Step>
          </li>
          <li>
            <Workflow.Step value="two">Second</Workflow.Step>
          </li>
          <li>
            <Workflow.Step value="three">Third</Workflow.Step>
          </li>
        </ol>
      </Workflow.Steps>

      <Workflow.Panel value="one">First panel.</Workflow.Panel>
      <Workflow.Panel value="two">Second panel.</Workflow.Panel>
      <Workflow.Panel value="three">Third panel.</Workflow.Panel>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <Workflow.Previous>Back</Workflow.Previous>
        <Workflow.Next>Next</Workflow.Next>
      </div>
    </Workflow.Root>
  ),
};
