import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AspectRatio } from "./AspectRatio";

describe("AspectRatio", () => {
  it("renders its children inside the ratio container", () => {
    const { container, getByAltText } = render(
      <AspectRatio ratio={16 / 9}>
        <img src="x" alt="banner" />
      </AspectRatio>,
    );
    expect(container.querySelector("[data-ui-aspect-ratio]")).not.toBeNull();
    expect(getByAltText("banner")).toBeInTheDocument();
  });

  it("forwards a consumer className", () => {
    const { container } = render(
      <AspectRatio className="app-ar" ratio={1}>
        <div />
      </AspectRatio>,
    );
    expect(container.querySelector("[data-ui-aspect-ratio]")).toHaveClass(
      "app-ar",
    );
  });
});
