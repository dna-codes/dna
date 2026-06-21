import type { Meta, StoryObj } from "@storybook/react-vite";
import { Container } from "./Container";
import { Header } from "../Header/Header";
import { Sidebar } from "../Sidebar/Sidebar";
import { Content } from "../Content/Content";
import { Footer } from "../Footer/Footer";

const meta = {
  title: "Structure/Container",
  component: Container,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A generic, non-landmark layout box — the escape hatch for arbitrary nesting. */
export const Default: Story = {
  args: {
    children: "Generic container",
    style: { padding: "1rem", border: "1px dashed #bbb" },
  },
};

/**
 * The structural pieces composed into an application shell. The landmarks
 * (`banner`, `complementary`, `contentinfo`) are siblings; the route's `<main>`
 * (a `Page`, not built yet) would sit where the `Content` placeholder is.
 */
export const ApplicationShell: Story = {
  render: () => (
    <Container style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header.Root style={{ padding: "1rem", borderBottom: "1px solid #ddd" }}>
        Banner
      </Header.Root>
      <Container style={{ display: "flex", flex: 1 }}>
        <Sidebar
          aria-label="Primary"
          style={{ padding: "1rem", borderRight: "1px solid #ddd", width: 200 }}
        >
          Navigation
        </Sidebar>
        <Content style={{ padding: "1rem", flex: 1 }}>
          Route content (this is where a <code>Page</code> / <code>&lt;main&gt;</code> goes)
        </Content>
      </Container>
      <Footer style={{ padding: "1rem", borderTop: "1px solid #ddd" }}>
        © 2026 Acme
      </Footer>
    </Container>
  ),
};
