import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, renderHook, act } from "@testing-library/react";
import {
  ThemeToggle,
  useTheme,
  setTheme,
  THEME_STORAGE_KEY,
} from "./ThemeToggle";

beforeEach(() => {
  // Each test drives the store to a deterministic state, but clear the persisted
  // value + applied attribute so assertions start clean.
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

// The appearance store is Radix-free (plain DOM + the headless React hook), so
// it is verified directly here — independent of the Radix-rendered control.
describe("appearance store (useTheme / setTheme)", () => {
  it("setTheme applies data-theme and persists the preference", () => {
    setTheme("dark");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    setTheme("light");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("resolves System against matchMedia (no dark preference here → light)", () => {
    setTheme("system");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("useTheme reflects the preference and resolved theme, and stays in sync", () => {
    const { result } = renderHook(() => useTheme());

    act(() => result.current.setTheme("dark"));
    expect(result.current.theme).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");

    act(() => result.current.setTheme("light"));
    expect(result.current.theme).toBe("light");
    expect(result.current.resolvedTheme).toBe("light");
  });
});

describe("ThemeToggle", () => {
  it("renders a labelled radiogroup with the appearance options", () => {
    render(<ThemeToggle />);
    expect(
      screen.getByRole("radiogroup", { name: "Appearance" }),
    ).toHaveAttribute("data-ui-theme-toggle");
    expect(screen.getByRole("radio", { name: "Light" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Dark" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "System" })).toBeInTheDocument();
  });

  it("applies and persists the theme when an option is chosen", () => {
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("radio", { name: "Dark" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(screen.getByRole("radio", { name: "Dark" })).toHaveAttribute(
      "aria-checked",
      "true",
    );

    fireEvent.click(screen.getByRole("radio", { name: "Light" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("resolves System against the OS preference (matchMedia → light here)", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("radio", { name: "System" }));
    // The jsdom matchMedia polyfill reports no dark preference → light.
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("accepts custom options", () => {
    render(
      <ThemeToggle
        options={[
          { value: "light", label: "Day" },
          { value: "dark", label: "Night" },
        ]}
      />,
    );
    expect(screen.getByRole("radio", { name: "Day" })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "System" })).toBeNull();
  });

  it("keeps useTheme in sync with the control", () => {
    function Readout() {
      const { theme, resolvedTheme } = useTheme();
      return (
        <div>
          <span data-testid="pref">{theme}</span>
          <span data-testid="resolved">{resolvedTheme}</span>
        </div>
      );
    }
    render(
      <>
        <ThemeToggle />
        <Readout />
      </>,
    );

    fireEvent.click(screen.getByRole("radio", { name: "Dark" }));
    expect(screen.getByTestId("pref")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
  });
});
