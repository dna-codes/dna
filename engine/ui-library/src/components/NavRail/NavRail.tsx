import { forwardRef } from "react";
import type { AnchorHTMLAttributes, HTMLAttributes } from "react";
import { Slot } from "radix-ui";

/** Props shared by the structural `NavRail.*` parts. */
export interface NavRailProps extends HTMLAttributes<HTMLElement> {
  /**
   * Merge props onto the single child element instead of rendering the default
   * element for this part.
   *
   * @see https://www.radix-ui.com/primitives/docs/guides/composition
   */
  asChild?: boolean;
}

export type NavRailSectionProps = NavRailProps;
export type NavRailLabelProps = NavRailProps;

export interface NavRailItemProps
  extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * Merge props onto the single child element instead of rendering an `<a>` —
   * use it to render a router link while keeping the hooks and a11y wiring
   * (e.g. `<NavRail.Item asChild><Link to="/x" /></NavRail.Item>`).
   */
  asChild?: boolean;
}

/**
 * The left navigation rail — a GitHub-style section-nav side region. Renders a
 * `<nav>` (the `navigation` landmark); place it inside a `Sidebar` (`<aside>`,
 * the `complementary` landmark) for the full "complementary navigation" region,
 * or use it standalone. Headless: `Slot` `asChild` parts that ship only
 * `data-ui-navrail-*` hooks, making no visual decision.
 *
 * Mark the active destination with `aria-current="page"` on the `Item` — the
 * skin renders the selection highlight off that attribute, and assistive tech
 * announces it. Group related links with `Section` + `Label`.
 *
 * ```tsx
 * <Sidebar asChild>
 *   <NavRail.Root>
 *     <NavRail.Section>
 *       <NavRail.Label>Workspace</NavRail.Label>
 *       <NavRail.Item href="/overview" aria-current="page">Overview</NavRail.Item>
 *       <NavRail.Item href="/resources">Resources</NavRail.Item>
 *     </NavRail.Section>
 *   </NavRail.Root>
 * </Sidebar>
 * ```
 */
const Root = forwardRef<HTMLElement, NavRailProps>(function NavRail(
  { asChild = false, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "nav";
  // Default a label so this navigation landmark is distinguishable from other
  // nav regions (e.g. the Header's primary nav); consumers override it.
  return (
    <Comp
      ref={ref}
      className={className}
      aria-label="Sections"
      data-ui-navrail=""
      {...rest}
    />
  );
});

const Section = forwardRef<HTMLDivElement, NavRailSectionProps>(
  function NavRailSection({ asChild = false, className, ...rest }, ref) {
    const Comp = asChild ? Slot.Root : "div";
    return (
      <Comp
        ref={ref}
        className={className}
        data-ui-navrail-section=""
        {...rest}
      />
    );
  },
);

const Label = forwardRef<HTMLDivElement, NavRailLabelProps>(function NavRailLabel(
  { asChild = false, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp ref={ref} className={className} data-ui-navrail-label="" {...rest} />
  );
});

const Item = forwardRef<HTMLAnchorElement, NavRailItemProps>(
  function NavRailItem({ asChild = false, className, ...rest }, ref) {
    const Comp = asChild ? Slot.Root : "a";
    return (
      <Comp ref={ref} className={className} data-ui-navrail-item="" {...rest} />
    );
  },
);

Root.displayName = "NavRail";
Section.displayName = "NavRail.Section";
Label.displayName = "NavRail.Label";
Item.displayName = "NavRail.Item";

/** Compound, headless left navigation rail. Compose the namespaced parts. */
export const NavRail = {
  Root,
  Section,
  Label,
  Item,
};
