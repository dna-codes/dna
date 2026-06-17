import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Table } from "./Table";

describe("Table", () => {
  it("renders the compound parts with their styling hooks over semantic elements", () => {
    const { container } = render(
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Ada</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>,
    );
    expect(container.querySelector("table[data-ui-table]")).not.toBeNull();
    expect(container.querySelector("thead[data-ui-table-header]")).not.toBeNull();
    expect(container.querySelector("tbody[data-ui-table-body]")).not.toBeNull();
    expect(screen.getByText("Name").tagName).toBe("TH");
    expect(screen.getByText("Ada").tagName).toBe("TD");
  });

  it("ships no class of its own by default", () => {
    const { container } = render(<Table.Root />);
    expect((container.querySelector("[data-ui-table]") as HTMLElement).className).toBe("");
  });

  it("forwards a consumer className", () => {
    const { container } = render(<Table.Root className="app-table" />);
    expect(container.querySelector("[data-ui-table]")).toHaveClass("app-table");
  });
});
