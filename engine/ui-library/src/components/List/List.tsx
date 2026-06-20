import { forwardRef } from "react";
import type { HTMLAttributes, LiHTMLAttributes } from "react";
import { Slot } from "radix-ui";

/** Props shared by the structural `List.*` parts. */
export interface ListProps extends HTMLAttributes<HTMLElement> {
  /**
   * Merge props onto the single child element instead of rendering the default
   * element for this part.
   *
   * @see https://www.radix-ui.com/primitives/docs/guides/composition
   */
  asChild?: boolean;
}

export interface ListRowProps extends LiHTMLAttributes<HTMLLIElement> {
  /**
   * Merge props onto the single child element instead of rendering an `<li>` —
   * e.g. render a whole-row link with `<List.Row asChild><a href="…" /></List.Row>`.
   */
  asChild?: boolean;
}

export type ListLeadingProps = ListProps;
export type ListMainProps = ListProps;
export type ListTitleProps = ListProps;
export type ListDescriptionProps = ListProps;
export type ListTrailingProps = ListProps;

/**
 * The canonical dense list-row pattern — GitHub repo/issue-style rows. Radix has
 * no list primitive, so it follows the `Table` pattern: `Slot` `asChild` parts
 * over the correct semantic elements (`ul`/`li`), shipping only `data-ui-list-*`
 * hooks. The skin makes the rows dense, rule-separated, and hover-highlighted;
 * `Main` grows while `Leading`/`Trailing` hug the edges.
 *
 * ```tsx
 * <List.Root>
 *   <List.Row>
 *     <List.Leading>📦</List.Leading>
 *     <List.Main>
 *       <List.Title><a href="/loan">Loan</a></List.Title>
 *       <List.Description>3 attributes · updated 2d ago</List.Description>
 *     </List.Main>
 *     <List.Trailing><Badge>active</Badge></List.Trailing>
 *   </List.Row>
 * </List.Root>
 * ```
 */
const Root = forwardRef<HTMLUListElement, ListProps>(function List(
  { asChild = false, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "ul";
  // `role="list"` keeps the list semantics even when the skin removes the
  // default list-style (Safari drops the implicit role on `list-style: none`).
  return (
    <Comp
      ref={ref}
      className={className}
      role="list"
      data-ui-list=""
      {...rest}
    />
  );
});

const Row = forwardRef<HTMLLIElement, ListRowProps>(function ListRow(
  { asChild = false, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "li";
  return (
    <Comp ref={ref} className={className} data-ui-list-row="" {...rest} />
  );
});

const Leading = forwardRef<HTMLDivElement, ListLeadingProps>(
  function ListLeading({ asChild = false, className, ...rest }, ref) {
    const Comp = asChild ? Slot.Root : "div";
    return (
      <Comp
        ref={ref}
        className={className}
        data-ui-list-leading=""
        {...rest}
      />
    );
  },
);

const Main = forwardRef<HTMLDivElement, ListMainProps>(function ListMain(
  { asChild = false, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp ref={ref} className={className} data-ui-list-main="" {...rest} />
  );
});

const Title = forwardRef<HTMLDivElement, ListTitleProps>(function ListTitle(
  { asChild = false, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp ref={ref} className={className} data-ui-list-title="" {...rest} />
  );
});

const Description = forwardRef<HTMLDivElement, ListDescriptionProps>(
  function ListDescription({ asChild = false, className, ...rest }, ref) {
    const Comp = asChild ? Slot.Root : "div";
    return (
      <Comp
        ref={ref}
        className={className}
        data-ui-list-description=""
        {...rest}
      />
    );
  },
);

const Trailing = forwardRef<HTMLDivElement, ListTrailingProps>(
  function ListTrailing({ asChild = false, className, ...rest }, ref) {
    const Comp = asChild ? Slot.Root : "div";
    return (
      <Comp
        ref={ref}
        className={className}
        data-ui-list-trailing=""
        {...rest}
      />
    );
  },
);

Root.displayName = "List";
Row.displayName = "List.Row";
Leading.displayName = "List.Leading";
Main.displayName = "List.Main";
Title.displayName = "List.Title";
Description.displayName = "List.Description";
Trailing.displayName = "List.Trailing";

/** Compound, headless dense list. Compose the namespaced parts. */
export const List = {
  Root,
  Row,
  Leading,
  Main,
  Title,
  Description,
  Trailing,
};
