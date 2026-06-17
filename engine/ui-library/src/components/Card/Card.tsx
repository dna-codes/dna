import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { Slot } from "radix-ui";

/** Props shared by every `Card.*` part. */
export interface CardProps extends HTMLAttributes<HTMLElement> {
  /**
   * Merge props onto the single child element instead of rendering the default
   * element for this part.
   *
   * @see https://www.radix-ui.com/primitives/docs/guides/composition
   */
  asChild?: boolean;
}

export type CardHeaderProps = CardProps;
export type CardTitleProps = CardProps;
export type CardDescriptionProps = CardProps;
export type CardBodyProps = CardProps;
export type CardFooterProps = CardProps;

/**
 * A headless, unstyled card — a generic surface for grouping related content
 * (dashboards, pricing tiers, list rows). Radix has no card primitive, so it
 * follows the `Button` pattern with `Slot`-powered `asChild` parts that ship
 * only `data-ui-card-*` hooks plus forwarded `className`/`style`. The compound
 * parts are layout-only conventions — use as many or as few as you need.
 */
const Root = forwardRef<HTMLDivElement, CardProps>(function Card(
  { asChild = false, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "div";
  return <Comp ref={ref} className={className} data-ui-card="" {...rest} />;
});

const Header = forwardRef<HTMLDivElement, CardHeaderProps>(function CardHeader(
  { asChild = false, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp ref={ref} className={className} data-ui-card-header="" {...rest} />
  );
});

const Title = forwardRef<HTMLHeadingElement, CardTitleProps>(function CardTitle(
  { asChild = false, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "h3";
  return (
    <Comp ref={ref} className={className} data-ui-card-title="" {...rest} />
  );
});

const Description = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  function CardDescription({ asChild = false, className, ...rest }, ref) {
    const Comp = asChild ? Slot.Root : "p";
    return (
      <Comp
        ref={ref}
        className={className}
        data-ui-card-description=""
        {...rest}
      />
    );
  },
);

const Body = forwardRef<HTMLDivElement, CardBodyProps>(function CardBody(
  { asChild = false, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "div";
  return <Comp ref={ref} className={className} data-ui-card-body="" {...rest} />;
});

const Footer = forwardRef<HTMLDivElement, CardFooterProps>(function CardFooter(
  { asChild = false, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp ref={ref} className={className} data-ui-card-footer="" {...rest} />
  );
});

export const Card = Object.assign(Root, {
  Header,
  Title,
  Description,
  Body,
  Footer,
});
