import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Button } from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    children: "Button",
    disabled: false,
  },
  argTypes: {
    onClick: { action: "clicked" },
    asChild: { control: "boolean" },
    variant: {
      control: "inline-radio",
      options: [
        undefined,
        "primary",
        "secondary",
        "outline",
        "ghost",
        "danger",
      ],
    },
    size: {
      control: "inline-radio",
      options: [undefined, "sm", "md", "lg"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default button as it renders with the opt-in default skin. The component
 * itself makes no visual decision — it emits `[data-ui-button]` (plus optional
 * `data-variant`/`data-size`) and the skin styles those hooks from `--ui-*`
 * tokens. Omit the skin and the button is fully headless.
 */
export const Default: Story = {};

/**
 * The `variant` prop emits a `data-variant` hook only; the skin maps it to a
 * look. Re-theme every variant at once by overriding the `--ui-*` color tokens.
 */
export const Variants: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <Button {...args} variant="primary">
        Primary
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="outline">
        Outline
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="danger">
        Danger
      </Button>
    </div>
  ),
};

/** The `size` prop emits a `data-size` hook the skin maps to control heights. */
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <Button {...args} size="sm" variant="primary">
        Small
      </Button>
      <Button {...args} size="md" variant="primary">
        Medium
      </Button>
      <Button {...args} size="lg" variant="primary">
        Large
      </Button>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
};

/**
 * With `asChild`, the button's props are merged onto the child element (here an
 * anchor) via Radix `Slot`, so you keep button behaviour on any element.
 */
export const AsChild: Story = {
  args: {
    asChild: true,
    children: <a href="https://www.radix-ui.com">Link that behaves as a button</a>,
  },
};

/**
 * Proof that the opt-in default skin actually loads through the shared preview.
 * The `primary` variant emits `data-variant="primary"`, which `skin.css` maps to
 * `background: var(--ui-color-primary)` (`#2dd4bf`). A resolved rgb here — rather
 * than a `toBeVisible` that passes even unstyled — confirms `tokens.css` +
 * `skin.css` are present and the token cascade resolved.
 */
export const CssCheck: Story = {
  args: { variant: "primary", children: "Primary" },
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: /primary/i });
    await expect(getComputedStyle(button).backgroundColor).toBe(
      "rgb(45, 212, 191)",
    );
  },
};

/**
 * Headless does not mean style-less for consumers — here the same primitive is
 * styled inline through the forwarded `className`/`style` to illustrate the hook.
 */
export const StyledByConsumer: Story = {
  args: {
    children: "Styled by the app",
    style: {
      padding: "0.5rem 1rem",
      borderRadius: 6,
      border: "1px solid #4f46e5",
      background: "#4f46e5",
      color: "#fff",
      font: "inherit",
      cursor: "pointer",
    },
  },
};
