import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { HoverCard as RadixHoverCard } from "radix-ui";

export type HoverCardProps = ComponentPropsWithoutRef<
  typeof RadixHoverCard.Root
>;
export type HoverCardTriggerProps = ComponentPropsWithoutRef<
  typeof RadixHoverCard.Trigger
>;
export type HoverCardArrowProps = ComponentPropsWithoutRef<
  typeof RadixHoverCard.Arrow
>;

export interface HoverCardContentProps
  extends ComponentPropsWithoutRef<typeof RadixHoverCard.Content> {
  /** Render an arrow pointing at the trigger. */
  arrow?: boolean;
  /** Props forwarded to the internal Radix `Arrow`. */
  arrowProps?: HoverCardArrowProps;
  /** Props forwarded to the internal Radix `Portal`. */
  portalProps?: ComponentPropsWithoutRef<typeof RadixHoverCard.Portal>;
}

/**
 * Root of a headless, accessible hover card built on Radix `HoverCard` — a
 * sighted-only rich preview shown on pointer hover (e.g. user/link previews on
 * a landing page). Compose with the attached `Trigger` and `Content` parts;
 * each ships a `data-ui-hover-card-*` hook plus forwarded `className`/`style`.
 */
const Root = RadixHoverCard.Root;

const Trigger = forwardRef<
  ElementRef<typeof RadixHoverCard.Trigger>,
  HoverCardTriggerProps
>(function HoverCardTrigger({ className, ...rest }, ref) {
  return (
    <RadixHoverCard.Trigger
      ref={ref}
      className={className}
      data-ui-hover-card-trigger=""
      {...rest}
    />
  );
});

const Content = forwardRef<
  ElementRef<typeof RadixHoverCard.Content>,
  HoverCardContentProps
>(function HoverCardContent(
  { className, children, arrow, arrowProps, portalProps, ...rest },
  ref,
) {
  return (
    <RadixHoverCard.Portal {...portalProps}>
      <RadixHoverCard.Content
        ref={ref}
        className={className}
        data-ui-hover-card-content=""
        {...rest}
      >
        {children}
        {arrow && (
          <RadixHoverCard.Arrow data-ui-hover-card-arrow="" {...arrowProps} />
        )}
      </RadixHoverCard.Content>
    </RadixHoverCard.Portal>
  );
});

export const HoverCard = Object.assign(Root, { Trigger, Content });
