import type { Meta, StoryObj } from "@storybook/react-vite";
import { Header } from "./Header";
import { Input } from "../Input/Input";
import { Button } from "../Button/Button";
import { Avatar } from "../Avatar/Avatar";

const meta = {
  title: "Structure/Header",
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
    <Header.Root>
      <Header.Brand>DNA.codes</Header.Brand>
      <Header.Nav>
        <a href="#repos" aria-current="page">
          Resources
        </a>
        <a href="#issues">Operations</a>
        <a href="#actions">Processes</a>
      </Header.Nav>
      <Header.Search>
        <Input type="search" placeholder="Search DNA…" aria-label="Search" />
      </Header.Search>
      <Header.Actions>
        <Button variant="ghost" size="sm">
          Docs
        </Button>
        <Avatar>
          <Avatar.Fallback>TK</Avatar.Fallback>
        </Avatar>
      </Header.Actions>
    </Header.Root>
  ),
};
