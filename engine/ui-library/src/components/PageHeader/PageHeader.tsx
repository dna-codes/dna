import { forwardRef } from "react";
import type { AnchorHTMLAttributes, HTMLAttributes } from "react";
import { Slot } from "radix-ui";

/** Props shared by the structural `PageHeader.*` parts. */
export interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
  /**
   * Merge props onto the single child element instead of rendering the default
   * element for this part.
   *
   * @see https://www.radix-ui.com/primitives/docs/guides/composition
   */
  asChild?: boolean;
}

export type PageHeaderBreadcrumbProps = PageHeaderProps;
export type PageHeaderHeadingProps = PageHeaderProps;
export type PageHeaderTitleProps = PageHeaderProps;
export type PageHeaderActionsProps = PageHeaderProps;
export type PageHeaderDescriptionProps = PageHeaderProps;

export interface PageHeaderBreadcrumbItemProps
  extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * Merge props onto the single child element instead of rendering an `<a>`.
   * For the current/last crumb, render a non-link with `asChild` and set
   * `aria-current="page"` (e.g. `<PageHeader.BreadcrumbItem asChild
   * aria-current="page"><span>Detail</span></PageHeader.BreadcrumbItem>`).
   */
  asChild?: boolean;
}

/**
 * The in-page header — title + breadcrumb trail + actions slot, GitHub-style.
 * It sits **inside** the route's `Page`/`<main>`, so it is intentionally a
 * non-landmark `<div>` (not a `banner`). Headless: `Slot` `asChild` parts that
 * ship only `data-ui-page-header-*` hooks and make no visual decision; the skin
 * lays out the title row (actions pinned to the end) and the breadcrumb
 * separators.
 *
 * ```tsx
 * <PageHeader.Root>
 *   <PageHeader.Breadcrumb>
 *     <PageHeader.BreadcrumbItem href="/">DNA.codes</PageHeader.BreadcrumbItem>
 *     <PageHeader.BreadcrumbItem href="/resources">Resources</PageHeader.BreadcrumbItem>
 *     <PageHeader.BreadcrumbItem asChild aria-current="page"><span>Loan</span></PageHeader.BreadcrumbItem>
 *   </PageHeader.Breadcrumb>
 *   <PageHeader.Heading>
 *     <PageHeader.Title>Loan</PageHeader.Title>
 *     <PageHeader.Actions><Button variant="primary">New</Button></PageHeader.Actions>
 *   </PageHeader.Heading>
 *   <PageHeader.Description>A loan the org manages.</PageHeader.Description>
 * </PageHeader.Root>
 * ```
 */
const Root = forwardRef<HTMLDivElement, PageHeaderProps>(function PageHeader(
  { asChild = false, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp ref={ref} className={className} data-ui-page-header="" {...rest} />
  );
});

const Breadcrumb = forwardRef<HTMLElement, PageHeaderBreadcrumbProps>(
  function PageHeaderBreadcrumb({ asChild = false, className, ...rest }, ref) {
    const Comp = asChild ? Slot.Root : "nav";
    return (
      <Comp
        ref={ref}
        className={className}
        aria-label="Breadcrumb"
        data-ui-page-header-breadcrumb=""
        {...rest}
      />
    );
  },
);

const BreadcrumbItem = forwardRef<
  HTMLAnchorElement,
  PageHeaderBreadcrumbItemProps
>(function PageHeaderBreadcrumbItem({ asChild = false, className, ...rest }, ref) {
  const Comp = asChild ? Slot.Root : "a";
  return (
    <Comp
      ref={ref}
      className={className}
      data-ui-page-header-breadcrumb-item=""
      {...rest}
    />
  );
});

const Heading = forwardRef<HTMLDivElement, PageHeaderHeadingProps>(
  function PageHeaderHeading({ asChild = false, className, ...rest }, ref) {
    const Comp = asChild ? Slot.Root : "div";
    return (
      <Comp
        ref={ref}
        className={className}
        data-ui-page-header-heading=""
        {...rest}
      />
    );
  },
);

const Title = forwardRef<HTMLHeadingElement, PageHeaderTitleProps>(
  function PageHeaderTitle({ asChild = false, className, ...rest }, ref) {
    const Comp = asChild ? Slot.Root : "h1";
    return (
      <Comp
        ref={ref}
        className={className}
        data-ui-page-header-title=""
        {...rest}
      />
    );
  },
);

const Actions = forwardRef<HTMLDivElement, PageHeaderActionsProps>(
  function PageHeaderActions({ asChild = false, className, ...rest }, ref) {
    const Comp = asChild ? Slot.Root : "div";
    return (
      <Comp
        ref={ref}
        className={className}
        data-ui-page-header-actions=""
        {...rest}
      />
    );
  },
);

const Description = forwardRef<HTMLParagraphElement, PageHeaderDescriptionProps>(
  function PageHeaderDescription({ asChild = false, className, ...rest }, ref) {
    const Comp = asChild ? Slot.Root : "p";
    return (
      <Comp
        ref={ref}
        className={className}
        data-ui-page-header-description=""
        {...rest}
      />
    );
  },
);

Root.displayName = "PageHeader";
Breadcrumb.displayName = "PageHeader.Breadcrumb";
BreadcrumbItem.displayName = "PageHeader.BreadcrumbItem";
Heading.displayName = "PageHeader.Heading";
Title.displayName = "PageHeader.Title";
Actions.displayName = "PageHeader.Actions";
Description.displayName = "PageHeader.Description";

/** Compound, headless in-page header. Compose the namespaced parts. */
export const PageHeader = {
  Root,
  Breadcrumb,
  BreadcrumbItem,
  Heading,
  Title,
  Actions,
  Description,
};
