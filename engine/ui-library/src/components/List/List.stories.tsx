import type { Meta, StoryObj } from "@storybook/react-vite";
import { List } from "./List";
import { Badge } from "../Badge/Badge";

const meta = {
  title: "Content/List",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const repos = [
  { name: "lending", desc: "Loan, Underwriter, Approve · updated 2d ago", status: "active" },
  { name: "marketplace", desc: "Listing, Booking, Host/Guest · updated 5d ago", status: "active" },
  { name: "healthcare", desc: "Patient, AttendingPhysician · updated 1w ago", status: "draft" },
];

/** A dense, repo/issue-style list — leading glyph, title + meta, trailing status. */
export const Default: Story = {
  render: () => (
    <List.Root style={{ maxWidth: "40rem" }}>
      {repos.map((r) => (
        <List.Row key={r.name}>
          <List.Leading>📦</List.Leading>
          <List.Main>
            <List.Title>
              <a href={`#${r.name}`}>{r.name}</a>
            </List.Title>
            <List.Description>{r.desc}</List.Description>
          </List.Main>
          <List.Trailing>
            <Badge variant={r.status === "active" ? "success" : "neutral"}>
              {r.status}
            </Badge>
          </List.Trailing>
        </List.Row>
      ))}
    </List.Root>
  ),
};

/** Whole-row links: each row is an `<a>` via `asChild`. */
export const RowLinks: Story = {
  render: () => (
    <List.Root style={{ maxWidth: "40rem" }}>
      {repos.map((r) => (
        <List.Row key={r.name} asChild>
          <a href={`#${r.name}`}>
            <List.Leading>📦</List.Leading>
            <List.Main>
              <List.Title>{r.name}</List.Title>
              <List.Description>{r.desc}</List.Description>
            </List.Main>
            <List.Trailing>→</List.Trailing>
          </a>
        </List.Row>
      ))}
    </List.Root>
  ),
};
