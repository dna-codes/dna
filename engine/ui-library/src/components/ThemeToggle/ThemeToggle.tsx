import { forwardRef, useSyncExternalStore } from "react";
import type { ComponentPropsWithoutRef, ElementRef, ReactNode } from "react";
import { RadioGroup as RadixRadioGroup } from "radix-ui";

/** The user's appearance *preference* — `system` follows the OS setting. */
export type ThemePreference = "light" | "dark" | "system";
/** The concrete theme applied to the document (`system` resolved). */
export type ResolvedTheme = "light" | "dark";

/**
 * `localStorage` key the preference is persisted under. Exported so an app can
 * read the same value in an inline `<head>` script to set `data-theme` before
 * first paint (avoiding a flash of the wrong theme).
 */
export const THEME_STORAGE_KEY = "dna-ui-theme";

// --- Headless appearance store -------------------------------------------- //
// A tiny module-level store (not React context) so every `useTheme`/`ThemeToggle`
// instance stays in sync without a provider, and an app can drive it imperatively
// via `setTheme`. It owns the single source of truth: the persisted preference,
// the resolved theme, and the `data-theme` attribute on the document element.

let currentPreference: ThemePreference = "system";
let currentResolved: ResolvedTheme = "dark";
let initialized = false;
const listeners = new Set<() => void>();

function prefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function resolve(preference: ThemePreference): ResolvedTheme {
  if (preference === "system") return prefersDark() ? "dark" : "light";
  return preference;
}

function readStored(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    // localStorage can throw (private mode, disabled) — fall back to default.
  }
  return "system";
}

function apply() {
  currentResolved = resolve(currentPreference);
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", currentResolved);
  }
}

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  currentPreference = readStored();
  if (typeof window.matchMedia === "function") {
    // Re-resolve live while the user is on "system" and the OS theme flips.
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        if (currentPreference === "system") {
          apply();
          listeners.forEach((l) => l());
        }
      });
  }
  apply();
}

/** Imperatively set the appearance preference (persists + applies immediately). */
export function setTheme(preference: ThemePreference) {
  init();
  currentPreference = preference;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Ignore persistence failures — the in-memory preference still applies.
  }
  apply();
  listeners.forEach((l) => l());
}

function subscribe(callback: () => void): () => void {
  init();
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export interface UseThemeResult {
  /** The chosen preference: `light` | `dark` | `system`. */
  theme: ThemePreference;
  /** The concrete theme in effect (`system` resolved to `light`/`dark`). */
  resolvedTheme: ResolvedTheme;
  /** Set the preference (persists to `localStorage`, updates `data-theme`). */
  setTheme: (preference: ThemePreference) => void;
}

/**
 * Read and control appearance without any UI. Backed by the same store as
 * `ThemeToggle`, so the two stay in sync. Writes `data-theme` to the document
 * element (which `@dna/ui-library/dna.css` keys off) and persists the choice.
 */
export function useTheme(): UseThemeResult {
  const theme = useSyncExternalStore(
    subscribe,
    () => currentPreference,
    () => "system" as ThemePreference,
  );
  const resolvedTheme = useSyncExternalStore(
    subscribe,
    () => currentResolved,
    () => "dark" as ResolvedTheme,
  );
  return { theme, resolvedTheme, setTheme };
}

// --- The control ----------------------------------------------------------- //

export interface ThemeToggleOption {
  value: ThemePreference;
  label: ReactNode;
}

const DEFAULT_OPTIONS: ThemeToggleOption[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export interface ThemeToggleProps
  extends Omit<
    ComponentPropsWithoutRef<typeof RadixRadioGroup.Root>,
    "value" | "defaultValue" | "onValueChange" | "asChild"
  > {
  /** Override the offered options (and their labels). Defaults to Light/Dark/System. */
  options?: ThemeToggleOption[];
}

/**
 * The canonical appearance control — a segmented Light / Dark / System selector.
 * Built on Radix `RadioGroup` (roving focus + arrow-key selection, no pointer-API
 * dependency, so it is fully testable in jsdom — unlike a dropdown-based toggle).
 * Bound to the headless `useTheme` store: selecting an option writes `data-theme`
 * and persists it. Headless — ships only `data-ui-theme-toggle*` hooks; the skin
 * renders the segmented look and the checked segment.
 *
 * ```tsx
 * <Header.Actions>
 *   <ThemeToggle />
 * </Header.Actions>
 * ```
 */
export const ThemeToggle = forwardRef<
  ElementRef<typeof RadixRadioGroup.Root>,
  ThemeToggleProps
>(function ThemeToggle({ options = DEFAULT_OPTIONS, className, ...rest }, ref) {
  const { theme, setTheme: select } = useTheme();
  return (
    <RadixRadioGroup.Root
      ref={ref}
      value={theme}
      onValueChange={(value) => select(value as ThemePreference)}
      orientation="horizontal"
      aria-label="Appearance"
      className={className}
      data-ui-theme-toggle=""
      {...rest}
    >
      {options.map((option) => (
        <RadixRadioGroup.Item
          key={option.value}
          value={option.value}
          data-ui-theme-toggle-option=""
        >
          {option.label}
        </RadixRadioGroup.Item>
      ))}
    </RadixRadioGroup.Root>
  );
});
