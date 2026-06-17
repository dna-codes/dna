import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { Accordion as RadixAccordion } from "radix-ui";

export type AccordionProps = ComponentPropsWithoutRef<
  typeof RadixAccordion.Root
>;
export type AccordionItemProps = ComponentPropsWithoutRef<
  typeof RadixAccordion.Item
>;
export type AccordionTriggerProps = ComponentPropsWithoutRef<
  typeof RadixAccordion.Trigger
>;
export type AccordionContentProps = ComponentPropsWithoutRef<
  typeof RadixAccordion.Content
>;

export interface AccordionHeaderTriggerProps extends AccordionTriggerProps {
  /** Props forwarded to the wrapping Radix `Header` (an `<h3>` by default). */
  headerProps?: ComponentPropsWithoutRef<typeof RadixAccordion.Header>;
}

/**
 * Root of a headless, accessible accordion built on Radix `Accordion`. Supports
 * `type="single"` or `"multiple"`, keyboard navigation, and the
 * `--radix-accordion-content-height` CSS var for animating open/close. Compose
 * with the attached `Item`, `Trigger`, and `Content` parts; each ships a
 * `data-ui-accordion-*` hook plus forwarded `className`/`style`.
 */
const Root = forwardRef<ElementRef<typeof RadixAccordion.Root>, AccordionProps>(
  function Accordion({ className, ...rest }, ref) {
    return (
      // The Radix Root is a discriminated union on `type`; spread keeps it intact.
      <RadixAccordion.Root
        ref={ref}
        className={className}
        data-ui-accordion=""
        {...(rest as AccordionProps)}
      />
    );
  },
);

const Item = forwardRef<
  ElementRef<typeof RadixAccordion.Item>,
  AccordionItemProps
>(function AccordionItem({ className, ...rest }, ref) {
  return (
    <RadixAccordion.Item
      ref={ref}
      className={className}
      data-ui-accordion-item=""
      {...rest}
    />
  );
});

/**
 * The clickable header row. Wrapped in a Radix `Header` (a heading element) so
 * the accordion exposes proper document structure to assistive tech.
 */
const Trigger = forwardRef<
  ElementRef<typeof RadixAccordion.Trigger>,
  AccordionHeaderTriggerProps
>(function AccordionTrigger({ className, headerProps, ...rest }, ref) {
  return (
    <RadixAccordion.Header data-ui-accordion-header="" {...headerProps}>
      <RadixAccordion.Trigger
        ref={ref}
        className={className}
        data-ui-accordion-trigger=""
        {...rest}
      />
    </RadixAccordion.Header>
  );
});

const Content = forwardRef<
  ElementRef<typeof RadixAccordion.Content>,
  AccordionContentProps
>(function AccordionContent({ className, ...rest }, ref) {
  return (
    <RadixAccordion.Content
      ref={ref}
      className={className}
      data-ui-accordion-content=""
      {...rest}
    />
  );
});

export const Accordion = Object.assign(Root, { Item, Trigger, Content });
