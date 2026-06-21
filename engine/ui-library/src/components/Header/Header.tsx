import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { Slot } from "radix-ui";

/** Props shared by every `Header.*` part. */
export interface HeaderProps extends HTMLAttributes<HTMLElement> {
  /**
   * Merge props onto the single child element instead of rendering the default
   * element for this part.
   *
   * @see https://www.radix-ui.com/primitives/docs/guides/composition
   */
  asChild?: boolean;
}

export type HeaderBrandProps = HeaderProps;
export type HeaderNavProps = HeaderProps;
export type HeaderSearchProps = HeaderProps;
export type HeaderSpacerProps = HeaderProps;
export type HeaderActionsProps = HeaderProps;

/**
 * The global top application bar — a GitHub-style chrome composition. Radix has
 * no primitive for page structure, so it follows the `Table` pattern: `Slot`
 * `asChild` parts that ship only `data-ui-header-*` hooks over the correct
 * semantic elements, making no visual decision of their own.
 *
 * `Header.Root` renders a top-level `<header>` (the `banner` landmark — keep it
 * a sibling of the route's `<main>`/`Page`, never inside it). The parts lay out
 * left-to-right by default (skin): brand, primary nav, a growable search slot,
 * then the actions cluster pinned to the end.
 *
 * ```tsx
 * <Header.Root>
 *   <Header.Brand>DNA.codes</Header.Brand>
 *   <Header.Nav>
 *     <a href="/repos" aria-current="page">Repositories</a>
 *     <a href="/issues">Issues</a>
 *   </Header.Nav>
 *   <Header.Search><Input type="search" placeholder="Search…" /></Header.Search>
 *   <Header.Actions><Avatar.Root>…</Avatar.Root></Header.Actions>
 * </Header.Root>
 * ```
 */
const Root = forwardRef<HTMLElement, HeaderProps>(function Header(
  { asChild = false, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "header";
  return <Comp ref={ref} className={className} data-ui-header="" {...rest} />;
});

const Brand = forwardRef<HTMLDivElement, HeaderBrandProps>(function HeaderBrand(
  { asChild = false, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp ref={ref} className={className} data-ui-header-brand="" {...rest} />
  );
});

const Nav = forwardRef<HTMLElement, HeaderNavProps>(function HeaderNav(
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
      data-ui-header-nav=""
      {...rest}
    />
  );
});

const Search = forwardRef<HTMLDivElement, HeaderSearchProps>(function HeaderSearch(
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
      data-ui-header-search=""
      {...rest}
    />
  );
});

const Spacer = forwardRef<HTMLDivElement, HeaderSpacerProps>(function HeaderSpacer(
  { asChild = false, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp
      ref={ref}
      className={className}
      aria-hidden="true"
      data-ui-header-spacer=""
      {...rest}
    />
  );
});

const Actions = forwardRef<HTMLDivElement, HeaderActionsProps>(
  function HeaderActions({ asChild = false, className, ...rest }, ref) {
    const Comp = asChild ? Slot.Root : "div";
    return (
      <Comp
        ref={ref}
        className={className}
        data-ui-header-actions=""
        {...rest}
      />
    );
  },
);

Root.displayName = "Header";
Brand.displayName = "Header.Brand";
Nav.displayName = "Header.Nav";
Search.displayName = "Header.Search";
Spacer.displayName = "Header.Spacer";
Actions.displayName = "Header.Actions";

/** Compound, headless global application bar. Compose the namespaced parts. */
export const Header = {
  Root,
  Brand,
  Nav,
  Search,
  Spacer,
  Actions,
};
