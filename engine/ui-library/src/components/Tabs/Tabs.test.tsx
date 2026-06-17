import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs } from "./Tabs";

function Example() {
  return (
    <Tabs defaultValue="account">
      <Tabs.List aria-label="Settings">
        <Tabs.Trigger value="account">Account</Tabs.Trigger>
        <Tabs.Trigger value="password">Password</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="account">Account panel</Tabs.Content>
      <Tabs.Content value="password">Password panel</Tabs.Content>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("shows the default tab's panel", () => {
    render(<Example />);
    expect(screen.getByText("Account panel")).toBeVisible();
    expect(screen.queryByText("Password panel")).not.toBeInTheDocument();
  });

  it("switches panels on tab click", async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole("tab", { name: "Password" }));
    expect(screen.getByText("Password panel")).toBeVisible();
  });

  it("exposes stable styling hooks", () => {
    render(<Example />);
    expect(screen.getByRole("tablist")).toHaveAttribute("data-ui-tabs-list");
    expect(screen.getByRole("tab", { name: "Account" })).toHaveAttribute(
      "data-ui-tabs-trigger",
    );
  });

  it("triggers ship no class of their own", () => {
    render(<Example />);
    expect(screen.getByRole("tab", { name: "Account" }).className).toBe("");
  });
});
