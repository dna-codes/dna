// Public entry point for the library. Re-export every component and its
// types here so consumers can `import { Button } from "@dna/ui-library"`.
//
// The library is headless: importing it has NO CSS side effects. Components
// ship behaviour + accessibility only. Consumers who want the optional design
// tokens import them explicitly: `import "@dna/ui-library/styles.css"`.

// Primitives (Slot-based, Radix-compatible)
export * from "./components/Button";
export * from "./components/Badge";
export * from "./components/Tag";
export * from "./components/Card";

// Forms
export * from "./components/Input";
export * from "./components/Textarea";
export * from "./components/Label";
export * from "./components/Checkbox";
export * from "./components/Switch";
export * from "./components/RadioGroup";
export * from "./components/Select";
export * from "./components/Slider";

// Overlays & menus
export * from "./components/Dialog";
export * from "./components/AlertDialog";
export * from "./components/Tooltip";
export * from "./components/Popover";
export * from "./components/DropdownMenu";
export * from "./components/HoverCard";

// Navigation & disclosure
export * from "./components/Tabs";
export * from "./components/Accordion";
export * from "./components/Collapsible";

// Display & feedback
export * from "./components/Table";
export * from "./components/Avatar";
export * from "./components/Separator";
export * from "./components/AspectRatio";
export * from "./components/Progress";
export * from "./components/Spinner";
export * from "./components/Skeleton";
export * from "./components/Toast";

// Structural / layout primitives. These have no Radix primitive (Radix covers
// widgets, not page structure); accessibility comes from the right semantic
// element + ARIA landmarks, with the same headless contracts as the rest.
export * from "./components/Application";
export * from "./components/ApplicationModule";
export * from "./components/Page";
export * from "./components/Header";
export * from "./components/Footer";
export * from "./components/Sidebar";
export * from "./components/Content";
export * from "./components/Workflow";
export * from "./components/Container";
export * from "./components/Inline";

// Application chrome — GitHub-style compositions over the structural primitives:
// the global top bar, the left section-nav rail, and the in-page header.
export * from "./components/AppBar";
export * from "./components/NavRail";
export * from "./components/PageHeader";

// Content patterns — GitHub-style dense rows, the empty-state placeholder, and
// the command/search palette building blocks (combobox + filterable listbox).
export * from "./components/List";
export * from "./components/EmptyState";
export * from "./components/Command";

// Appearance — the canonical Light/Dark/System control plus the headless
// `useTheme`/`setTheme` store that drives `data-theme` (read by dna.css).
export * from "./components/ThemeToggle";

// State-machine engine (XState). Tier-2 backbone: the headless `Machine`
// component set plus the public machine API (hooks, the sequence-machine
// factory, Radix-widget binding adapters, and the re-exported XState toolkit).
export * from "./components/Machine";
export * from "./machine";

// Utilities
export { clsx } from "./utils/clsx";
export type { ClassValue } from "./utils/clsx";
