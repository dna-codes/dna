import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { List } from "./List";

describe("List", () => {
  it("renders a list with rows and the parts' styling hooks", () => {
    render(
      <List.Root>
        <List.Row>
          <List.Leading>📦</List.Leading>
          <List.Main>
            <List.Title>
              <a href="/loan">Loan</a>
            </List.Title>
            <List.Description>3 attributes</List.Description>
          </List.Main>
          <List.Trailing>active</List.Trailing>
        </List.Row>
      </List.Root>,
    );

    const list = screen.getByRole("list");
    expect(list.tagName).toBe("UL");
    expect(list).toHaveAttribute("data-ui-list");
    expect(screen.getByRole("listitem")).toHaveAttribute("data-ui-list-row");
    expect(screen.getByRole("link", { name: "Loan" })).toHaveAttribute(
      "href",
      "/loan",
    );
    expect(screen.getByText("3 attributes")).toHaveAttribute(
      "data-ui-list-description",
    );
  });

  it("keeps an explicit role=list even when default list semantics are dropped", () => {
    render(
      <List.Root>
        <List.Row>Row</List.Row>
      </List.Root>,
    );
    expect(screen.getByRole("list")).toHaveAttribute("role", "list");
  });

  it("ships no class of its own and forwards className, native props, and ref", () => {
    let node: HTMLElement | null = null;
    render(
      <List.Root
        className="repo-list"
        id="rl"
        ref={(el) => {
          node = el;
        }}
      >
        <List.Row>Row</List.Row>
      </List.Root>,
    );
    const list = screen.getByRole("list");
    expect(list).toHaveClass("repo-list");
    expect(list).toHaveAttribute("id", "rl");
    expect(node).toBeInstanceOf(HTMLElement);
  });

  it("composes a row onto a whole-row link with asChild", () => {
    render(
      <List.Root>
        <List.Row asChild>
          <a href="/loan">Loan row</a>
        </List.Row>
      </List.Root>,
    );
    const link = screen.getByRole("link", { name: "Loan row" });
    expect(link).toHaveAttribute("href", "/loan");
    expect(link).toHaveAttribute("data-ui-list-row");
  });
});
