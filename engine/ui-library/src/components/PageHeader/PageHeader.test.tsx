import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  it("renders title, breadcrumb, actions, and description with their hooks", () => {
    render(
      <PageHeader.Root>
        <PageHeader.Breadcrumb>
          <PageHeader.BreadcrumbItem href="/">DNA.codes</PageHeader.BreadcrumbItem>
          <PageHeader.BreadcrumbItem asChild aria-current="page">
            <span>Loan</span>
          </PageHeader.BreadcrumbItem>
        </PageHeader.Breadcrumb>
        <PageHeader.Heading>
          <PageHeader.Title>Loan</PageHeader.Title>
          <PageHeader.Actions>
            <button>New</button>
          </PageHeader.Actions>
        </PageHeader.Heading>
        <PageHeader.Description>A loan the org manages.</PageHeader.Description>
      </PageHeader.Root>,
    );

    const heading = screen.getByRole("heading", { level: 1, name: "Loan" });
    expect(heading).toHaveAttribute("data-ui-page-header-title");
    expect(screen.getByText("A loan the org manages.")).toHaveAttribute(
      "data-ui-page-header-description",
    );
    expect(screen.getByText("New").closest("[data-ui-page-header-actions]")).not.toBeNull();
  });

  it("exposes the breadcrumb as a named navigation landmark with links", () => {
    render(
      <PageHeader.Root>
        <PageHeader.Breadcrumb>
          <PageHeader.BreadcrumbItem href="/">Home</PageHeader.BreadcrumbItem>
          <PageHeader.BreadcrumbItem href="/resources">
            Resources
          </PageHeader.BreadcrumbItem>
        </PageHeader.Breadcrumb>
      </PageHeader.Root>,
    );

    expect(
      screen.getByRole("navigation", { name: "Breadcrumb" }),
    ).toHaveAttribute("data-ui-page-header-breadcrumb");
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("renders the current crumb as a non-link with aria-current via asChild", () => {
    render(
      <PageHeader.Root>
        <PageHeader.Breadcrumb>
          <PageHeader.BreadcrumbItem asChild aria-current="page">
            <span>Detail</span>
          </PageHeader.BreadcrumbItem>
        </PageHeader.Breadcrumb>
      </PageHeader.Root>,
    );

    const current = screen.getByText("Detail");
    expect(current.tagName).toBe("SPAN");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current).toHaveAttribute("data-ui-page-header-breadcrumb-item");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("is not a banner landmark (it lives inside the page's main)", () => {
    render(
      <PageHeader.Root>
        <PageHeader.Title>Loan</PageHeader.Title>
      </PageHeader.Root>,
    );
    expect(screen.queryByRole("banner")).toBeNull();
  });

  it("ships no class of its own and forwards className, native props, and ref", () => {
    let node: HTMLElement | null = null;
    render(
      <PageHeader.Root
        className="page-head"
        id="ph"
        ref={(el) => {
          node = el;
        }}
      >
        <PageHeader.Title>Loan</PageHeader.Title>
      </PageHeader.Root>,
    );
    const root = document.querySelector("[data-ui-page-header]");
    expect(root).toHaveClass("page-head");
    expect(root).toHaveAttribute("id", "ph");
    expect(node).toBeInstanceOf(HTMLElement);
  });
});
