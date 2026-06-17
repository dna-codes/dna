import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApplicationModule, useApplicationModule } from "./ApplicationModule";

function ModuleProbe() {
  const mod = useApplicationModule();
  return <span>module: {mod ? `${mod.id}/${mod.name}` : "none"}</span>;
}

describe("ApplicationModule", () => {
  it("renders a named region landmark", () => {
    render(<ApplicationModule name="Billing">content</ApplicationModule>);
    expect(screen.getByRole("region", { name: "Billing" })).toBeInTheDocument();
  });

  it("is a generic section (not a landmark) without a name", () => {
    render(<ApplicationModule>content</ApplicationModule>);
    // A nameless <section> is not exposed as a region landmark.
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(screen.getByText("content").tagName).toBe("SECTION");
  });

  it("exposes a stable hook and ships no class of its own", () => {
    render(<ApplicationModule name="Billing">content</ApplicationModule>);
    const node = screen.getByRole("region");
    expect(node).toHaveAttribute("data-ui-application-module");
    expect(node.className).toBe("");
  });

  it("provides id/name to descendants via useApplicationModule", () => {
    render(
      <ApplicationModule id="billing" name="Billing">
        <ModuleProbe />
      </ApplicationModule>,
    );
    expect(screen.getByText("module: billing/Billing")).toBeInTheDocument();
  });

  it("returns null from useApplicationModule outside a module", () => {
    render(<ModuleProbe />);
    expect(screen.getByText("module: none")).toBeInTheDocument();
  });

  it("composes onto a child with asChild", () => {
    render(
      <ApplicationModule asChild name="Admin">
        <nav>links</nav>
      </ApplicationModule>,
    );
    const node = screen.getByRole("navigation", { name: "Admin" });
    expect(node.tagName).toBe("NAV");
    expect(node).toHaveAttribute("data-ui-application-module");
  });
});
