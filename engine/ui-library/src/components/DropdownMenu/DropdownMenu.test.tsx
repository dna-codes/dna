import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DropdownMenu } from "./DropdownMenu";

function Example({ onSelect }: { onSelect?: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger>Actions</DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Label>Account</DropdownMenu.Label>
        <DropdownMenu.Item onSelect={onSelect}>Profile</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item>Sign out</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}

describe("DropdownMenu", () => {
  it("is closed by default", () => {
    render(<Example />);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens on trigger click and renders items", async () => {
    render(<Example />);
    await userEvent.click(screen.getByText("Actions"));
    expect(screen.getByRole("menu")).toHaveAttribute(
      "data-ui-dropdown-menu-content",
    );
    expect(screen.getByRole("menuitem", { name: "Profile" })).toBeInTheDocument();
  });

  it("fires onSelect and closes when an item is chosen", async () => {
    const onSelect = vi.fn();
    render(<Example onSelect={onSelect} />);
    await userEvent.click(screen.getByText("Actions"));
    await userEvent.click(screen.getByText("Profile"));
    expect(onSelect).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("trigger ships its styling hook and no class of its own", () => {
    render(<Example />);
    const trigger = screen.getByText("Actions");
    expect(trigger).toHaveAttribute("data-ui-dropdown-menu-trigger");
    expect(trigger.className).toBe("");
  });
});
