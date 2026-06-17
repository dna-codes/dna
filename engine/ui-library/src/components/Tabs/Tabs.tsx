import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { Tabs as RadixTabs } from "radix-ui";

export type TabsProps = ComponentPropsWithoutRef<typeof RadixTabs.Root>;
export type TabsListProps = ComponentPropsWithoutRef<typeof RadixTabs.List>;
export type TabsTriggerProps = ComponentPropsWithoutRef<
  typeof RadixTabs.Trigger
>;
export type TabsContentProps = ComponentPropsWithoutRef<
  typeof RadixTabs.Content
>;

/**
 * Root of a headless, accessible tabs widget built on Radix `Tabs`. Manages
 * roving focus, arrow-key navigation, and `aria-selected`/`aria-controls`
 * wiring. Compose with the attached `List`, `Trigger`, and `Content` parts;
 * each ships a `data-ui-tabs-*` hook plus forwarded `className`/`style`.
 */
const Root = forwardRef<ElementRef<typeof RadixTabs.Root>, TabsProps>(
  function Tabs({ className, ...rest }, ref) {
    return (
      <RadixTabs.Root
        ref={ref}
        className={className}
        data-ui-tabs=""
        {...rest}
      />
    );
  },
);

const List = forwardRef<ElementRef<typeof RadixTabs.List>, TabsListProps>(
  function TabsList({ className, ...rest }, ref) {
    return (
      <RadixTabs.List
        ref={ref}
        className={className}
        data-ui-tabs-list=""
        {...rest}
      />
    );
  },
);

const Trigger = forwardRef<
  ElementRef<typeof RadixTabs.Trigger>,
  TabsTriggerProps
>(function TabsTrigger({ className, ...rest }, ref) {
  return (
    <RadixTabs.Trigger
      ref={ref}
      className={className}
      data-ui-tabs-trigger=""
      {...rest}
    />
  );
});

const Content = forwardRef<
  ElementRef<typeof RadixTabs.Content>,
  TabsContentProps
>(function TabsContent({ className, ...rest }, ref) {
  return (
    <RadixTabs.Content
      ref={ref}
      className={className}
      data-ui-tabs-content=""
      {...rest}
    />
  );
});

export const Tabs = Object.assign(Root, { List, Trigger, Content });
