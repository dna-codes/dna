import type { Meta, StoryObj } from "@storybook/react-vite";
import { Application } from "./Application";
import { ApplicationModule } from "../ApplicationModule/ApplicationModule";
import { Header } from "../Header/Header";
import { Sidebar } from "../Sidebar/Sidebar";
import { Footer } from "../Footer/Footer";
import { Content } from "../Content/Content";
import { Page } from "../Page/Page";

const meta = {
  title: "Structure/Application",
  component: Application,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Application>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The provider boundary on its own — a non-landmark `<div>`. */
export const Default: Story = {
  args: {
    children: "Application root (provider boundary)",
    style: { padding: "1rem" },
  },
};

/**
 * The full coarse-grained hierarchy assembled: `Application` wraps a persistent
 * shell (`Header`, `Sidebar`, `Footer`) and an `ApplicationModule` region whose
 * `Page` is the single `<main>` for the route. All styling is inline (consumer).
 */
export const FullHierarchy: Story = {
  render: () => (
    <Application
      dir="ltr"
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <Header.Root style={{ padding: "1rem", borderBottom: "1px solid #ddd" }}>
        Banner
      </Header.Root>
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar
          aria-label="Primary"
          style={{ padding: "1rem", borderRight: "1px solid #ddd", width: 200 }}
        >
          Navigation
        </Sidebar>
        <ApplicationModule name="Billing" style={{ flex: 1 }}>
          <Page path="/billing/invoices" title="Invoices" style={{ padding: "1rem" }}>
            <Content>Invoice list (route content lives in the single main)</Content>
          </Page>
        </ApplicationModule>
      </div>
      <Footer style={{ padding: "1rem", borderTop: "1px solid #ddd" }}>
        © 2026 Acme
      </Footer>
    </Application>
  ),
};
