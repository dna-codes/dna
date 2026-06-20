import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { Slot } from "radix-ui";

/** Props shared by every `AppBar.*` part. */
export interface AppBarProps extends HTMLAttributes<HTMLElement> {
  /**
   * Merge props onto the single child element instead of rendering the default
   * element for this part.
   *
   * @see https://www.radix-ui.com/primitives/docs/guides/composition
   */
  asChild?: boolean;
}

export type AppBarBrandProps = AppBarProps;
export type AppBarNavProps = AppBarProps;
export type AppBarSearchProps = AppBarProps;
export type AppBarSpacerProps = AppBarProps;
export type AppBarActionsProps = AppBarProps;

/**
 * The global top application bar — a GitHub-style chrome composition. Radix has
 * no primitive for page structure, so it follows the `Table` pattern: `Slot`
 * `asChild` parts that ship only `data-ui-appbar-*` hooks over the correct
 * semantic elements, making no visual decision of their own.
 *
 * `AppBar.Root` renders a top-level `<header>` (the `banner` landmark — keep it
 * a sibling of the route's `<main>`/`Page`, never inside it). The parts lay out
 * left-to-right by default (skin): brand, primary nav, a growable search slot,
 * then the actions cluster pinned to the end.
 *
 * ```tsx
 * <AppBar.Root>
 *   <AppBar.Brand>DNA.codes</AppBar.Brand>
 *   <AppBar.Nav>
 *     <a href="/repos" aria-current="page">Repositories</a>
 *     <a href="/issues">Issues</a>
 *   </AppBar.Nav>
 *   <AppBar.Search><Input type="search" placeholder="Search…" /></AppBar.Search>
 *   <AppBar.Actions><Avatar.Root>…</Avatar.Root></AppBar.Actions>
 * </AppBar.Root>
 * ```
 */
const Root = forwardRef<HTMLElement, AppBarProps>(function AppBar(
  { asChild = false, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "header";
  return <Comp ref={ref} className={className} data-ui-appbar="" {...rest} />;
});

const Brand = forwardRef<HTMLDivElement, AppBarBrandProps>(function AppBarBrand(
  { asChild = false, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp ref={ref} className={className} data-ui-appbar-brand="" {...rest} />
  );
});

const Nav = forwardRef<HTMLElement, AppBarNavProps>(function AppBarNav(
  { asChild = false, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "nav";
  // Default a label so this navigation landmark is distinguishable from the
  // page's other nav regions; consumers override via `aria-label`.
  return (
    <Comp
      ref={ref}
      className={className}
      aria-label="Primary"
      data-ui-appbar-nav=""
      {...rest}
    />
  );
});

const Search = forwardRef<HTMLDivElement, AppBarSearchProps>(function AppBarSearch(
  { asChild = false, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "div";
  // `role="search"` exposes the global search as its own landmark.
  return (
    <Comp
      ref={ref}
      className={className}
      role="search"
      data-ui-appbar-search=""
      {...rest}
    />
  );
});

const Spacer = forwardRef<HTMLDivElement, AppBarSpacerProps>(function AppBarSpacer(
  { asChild = false, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp
      ref={ref}
      className={className}
      aria-hidden="true"
      data-ui-appbar-spacer=""
      {...rest}
    />
  );
});

const Actions = forwardRef<HTMLDivElement, AppBarActionsProps>(
  function AppBarActions({ asChild = false, className, ...rest }, ref) {
    const Comp = asChild ? Slot.Root : "div";
    return (
      <Comp
        ref={ref}
        className={className}
        data-ui-appbar-actions=""
        {...rest}
      />
    );
  },
);

Root.displayName = "AppBar";
Brand.displayName = "AppBar.Brand";
Nav.displayName = "AppBar.Nav";
Search.displayName = "AppBar.Search";
Spacer.displayName = "AppBar.Spacer";
Actions.displayName = "AppBar.Actions";

/** Compound, headless global application bar. Compose the namespaced parts. */
export const AppBar = {
  Root,
  Brand,
  Nav,
  Search,
  Spacer,
  Actions,
};
