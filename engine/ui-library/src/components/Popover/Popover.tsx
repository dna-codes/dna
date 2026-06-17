import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { Popover as RadixPopover } from "radix-ui";

export type PopoverProps = ComponentPropsWithoutRef<typeof RadixPopover.Root>;
export type PopoverTriggerProps = ComponentPropsWithoutRef<
  typeof RadixPopover.Trigger
>;
export type PopoverAnchorProps = ComponentPropsWithoutRef<
  typeof RadixPopover.Anchor
>;
export type PopoverCloseProps = ComponentPropsWithoutRef<
  typeof RadixPopover.Close
>;
export type PopoverArrowProps = ComponentPropsWithoutRef<
  typeof RadixPopover.Arrow
>;

export interface PopoverContentProps
  extends ComponentPropsWithoutRef<typeof RadixPopover.Content> {
  /** Render an arrow pointing at the trigger/anchor. */
  arrow?: boolean;
  /** Props forwarded to the internal Radix `Arrow`. */
  arrowProps?: PopoverArrowProps;
  /** Render inline instead of inside a portal. Defaults to portalled. */
  inline?: boolean;
  /** Props forwarded to the internal Radix `Portal`. */
  portalProps?: ComponentPropsWithoutRef<typeof RadixPopover.Portal>;
}

/**
 * Root of a headless, accessible popover built on Radix `Popover`. Handles
 * positioning (collision-aware), focus management, and dismissal. Compose with
 * the attached `Trigger`, `Anchor`, `Content`, and `Close` parts; each ships a
 * `data-ui-popover-*` hook plus forwarded `className`/`style`.
 */
const Root = RadixPopover.Root;

const Trigger = forwardRef<
  ElementRef<typeof RadixPopover.Trigger>,
  PopoverTriggerProps
>(function PopoverTrigger({ className, ...rest }, ref) {
  return (
    <RadixPopover.Trigger
      ref={ref}
      className={className}
      data-ui-popover-trigger=""
      {...rest}
    />
  );
});

const Anchor = forwardRef<
  ElementRef<typeof RadixPopover.Anchor>,
  PopoverAnchorProps
>(function PopoverAnchor({ className, ...rest }, ref) {
  return (
    <RadixPopover.Anchor
      ref={ref}
      className={className}
      data-ui-popover-anchor=""
      {...rest}
    />
  );
});

const Content = forwardRef<
  ElementRef<typeof RadixPopover.Content>,
  PopoverContentProps
>(function PopoverContent(
  { className, children, arrow, arrowProps, inline = false, portalProps, ...rest },
  ref,
) {
  const content = (
    <RadixPopover.Content
      ref={ref}
      className={className}
      data-ui-popover-content=""
      {...rest}
    >
      {children}
      {arrow && <RadixPopover.Arrow data-ui-popover-arrow="" {...arrowProps} />}
    </RadixPopover.Content>
  );

  if (inline) return content;
  return <RadixPopover.Portal {...portalProps}>{content}</RadixPopover.Portal>;
});

const Close = forwardRef<
  ElementRef<typeof RadixPopover.Close>,
  PopoverCloseProps
>(function PopoverClose({ className, ...rest }, ref) {
  return (
    <RadixPopover.Close
      ref={ref}
      className={className}
      data-ui-popover-close=""
      {...rest}
    />
  );
});

export const Popover = Object.assign(Root, {
  Trigger,
  Anchor,
  Content,
  Close,
});
