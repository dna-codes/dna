import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "./Card";

describe("Card", () => {
  it("renders the compound parts with their styling hooks", () => {
    const { container } = render(
      <Card>
        <Card.Header>
          <Card.Title>Title</Card.Title>
          <Card.Description>Desc</Card.Description>
        </Card.Header>
        <Card.Body>Body</Card.Body>
        <Card.Footer>Footer</Card.Footer>
      </Card>,
    );
    expect(container.querySelector("[data-ui-card]")).not.toBeNull();
    expect(container.querySelector("[data-ui-card-header]")).not.toBeNull();
    expect(container.querySelector("[data-ui-card-body]")).not.toBeNull();
    expect(container.querySelector("[data-ui-card-footer]")).not.toBeNull();
    expect(screen.getByText("Title").tagName).toBe("H3");
    expect(screen.getByText("Desc").tagName).toBe("P");
  });

  it("ships no class of its own by default", () => {
    const { container } = render(<Card>content</Card>);
    expect(
      (container.querySelector("[data-ui-card]") as HTMLElement).className,
    ).toBe("");
  });

  it("forwards a consumer className", () => {
    const { container } = render(<Card className="app-card">x</Card>);
    expect(container.querySelector("[data-ui-card]")).toHaveClass("app-card");
  });

  it("composes the root onto a child with asChild", () => {
    render(
      <Card asChild>
        <article>Article card</article>
      </Card>,
    );
    const article = screen.getByText("Article card");
    expect(article.tagName).toBe("ARTICLE");
    expect(article).toHaveAttribute("data-ui-card");
  });

  it("composes the title onto a child heading level with asChild", () => {
    render(
      <Card.Title asChild>
        <h2>Heading two</h2>
      </Card.Title>,
    );
    const heading = screen.getByRole("heading", { name: "Heading two" });
    expect(heading.tagName).toBe("H2");
    expect(heading).toHaveAttribute("data-ui-card-title");
  });
});
