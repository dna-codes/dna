import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { Collapsible as RadixCollapsible } from "radix-ui";

export type CollapsibleProps = ComponentPropsWithoutRef<
  typeof RadixCollapsible.Root
>;
export type CollapsibleTriggerProps = ComponentPropsWithoutRef<
  typeof RadixCollapsible.Trigger
>;
export type CollapsibleContentProps = ComponentPropsWithoutRef<
  typeof RadixCollapsible.Content
>;

/**
 * Root of a headless, accessible show/hide region built on Radix `Collapsible`
 * — a single expandable section (use `Accordion` for grouped sections). Exposes
 * the `--radix-collapsible-content-height` CSS var for animation. Compose with
 * the attached `Trigger` and `Content` parts; each ships a
 * `data-ui-collapsible-*` hook plus forwarded `className`/`style`.
 */
const Root = forwardRef<
  ElementRef<typeof RadixCollapsible.Root>,
  CollapsibleProps
>(function Collapsible({ className, ...rest }, ref) {
  return (
    <RadixCollapsible.Root
      ref={ref}
      className={className}
      data-ui-collapsible=""
      {...rest}
    />
  );
});

const Trigger = forwardRef<
  ElementRef<typeof RadixCollapsible.Trigger>,
  CollapsibleTriggerProps
>(function CollapsibleTrigger({ className, ...rest }, ref) {
  return (
    <RadixCollapsible.Trigger
      ref={ref}
      className={className}
      data-ui-collapsible-trigger=""
      {...rest}
    />
  );
});

const Content = forwardRef<
  ElementRef<typeof RadixCollapsible.Content>,
  CollapsibleContentProps
>(function CollapsibleContent({ className, ...rest }, ref) {
  return (
    <RadixCollapsible.Content
      ref={ref}
      className={className}
      data-ui-collapsible-content=""
      {...rest}
    />
  );
});

export const Collapsible = Object.assign(Root, { Trigger, Content });
