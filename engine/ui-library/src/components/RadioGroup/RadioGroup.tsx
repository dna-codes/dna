import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef, ReactNode } from "react";
import { RadioGroup as RadixRadioGroup } from "radix-ui";

export type RadioGroupProps = ComponentPropsWithoutRef<
  typeof RadixRadioGroup.Root
>;

export interface RadioGroupItemProps
  extends ComponentPropsWithoutRef<typeof RadixRadioGroup.Item> {
  /**
   * Indicator content rendered when this item is selected (e.g. a dot). Radix
   * only mounts it while checked.
   */
  children?: ReactNode;
  /** Props forwarded to the internal Radix `Indicator`. */
  indicatorProps?: ComponentPropsWithoutRef<typeof RadixRadioGroup.Indicator>;
}

/**
 * Root of a headless, accessible radio group built on Radix `RadioGroup`.
 * Manages roving focus and arrow-key selection. Ships only a `data-ui-radio-group`
 * hook plus forwarded `className`/`style`. Compose with `RadioGroup.Item`.
 */
const Root = forwardRef<
  ElementRef<typeof RadixRadioGroup.Root>,
  RadioGroupProps
>(function RadioGroup({ className, ...rest }, ref) {
  return (
    <RadixRadioGroup.Root
      ref={ref}
      className={className}
      data-ui-radio-group=""
      {...rest}
    />
  );
});

/**
 * A single radio option. Renders a Radix `Item` wrapping an `Indicator` that is
 * only mounted while selected. Ships `data-ui-radio-group-item` /
 * `data-ui-radio-group-indicator` hooks; Radix surfaces `data-state`.
 */
const Item = forwardRef<
  ElementRef<typeof RadixRadioGroup.Item>,
  RadioGroupItemProps
>(function RadioGroupItem({ className, children, indicatorProps, ...rest }, ref) {
  return (
    <RadixRadioGroup.Item
      ref={ref}
      className={className}
      data-ui-radio-group-item=""
      {...rest}
    >
      <RadixRadioGroup.Indicator
        data-ui-radio-group-indicator=""
        {...indicatorProps}
      >
        {children}
      </RadixRadioGroup.Indicator>
    </RadixRadioGroup.Item>
  );
});

export const RadioGroup = Object.assign(Root, { Item });
