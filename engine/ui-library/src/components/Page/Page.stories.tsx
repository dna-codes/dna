import type { Meta, StoryObj } from "@storybook/react-vite";
import { Page } from "./Page";
import { Content } from "../Content/Content";

const meta = {
  title: "Structure/Page",
  component: Page,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Page>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The route's single `<main>`. Router-agnostic — pass `path`/`title` as props.
 * Setting `title` updates `document.title` and names the landmark. It is
 * focusable (`tabIndex={-1}`) so you can move focus here on navigation.
 */
export const Default: Story = {
  args: {
    path: "/reports",
    title: "Reports",
    style: { padding: "1rem" },
    children: <Content>Report content goes here.</Content>,
  },
};
