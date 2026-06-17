import type { Meta, StoryObj } from "@storybook/react-vite";
import { Table } from "./Table";

const meta = {
  title: "Display/Table",
  component: Table.Root,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Table.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

const columns = ["Name", "Customer", "Status", "Total"];
const rows = [
  ["SW-1001", "Ava Thompson", "paid", "129.99"],
  ["SW-1002", "Liam Patel", "fulfilled", "54.50"],
  ["SW-1003", "Noah Kim", "pending", "312.00"],
];

export const Default: Story = {
  render: () => (
    <Table.Root style={{ minWidth: 480 }}>
      <Table.Header>
        <Table.Row>
          {columns.map((c) => (
            <Table.HeaderCell key={c}>{c}</Table.HeaderCell>
          ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rows.map((r) => (
          <Table.Row key={r[0]}>
            {r.map((cell, i) => (
              <Table.Cell key={i}>{cell}</Table.Cell>
            ))}
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  ),
};
