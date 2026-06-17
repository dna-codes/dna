import type { Meta, StoryObj } from "@storybook/react-vite";
import { ApplicationModule } from "./ApplicationModule";

const meta = {
  title: "Structure/ApplicationModule",
  component: ApplicationModule,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ApplicationModule>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A named module becomes a `region` landmark and exposes its id/name via
 * `useApplicationModule()` for nav highlighting and breadcrumbs.
 */
export const Default: Story = {
  args: {
    id: "billing",
    name: "Billing",
    children: "Billing module content",
    style: { padding: "1rem", border: "1px solid #ddd" },
  },
};
