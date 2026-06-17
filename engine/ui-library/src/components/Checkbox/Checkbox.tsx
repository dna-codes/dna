import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef, ReactNode } from "react";
import { Checkbox as RadixCheckbox } from "radix-ui";

export interface CheckboxProps
  extends ComponentPropsWithoutRef<typeof RadixCheckbox.Root> {
  /**
   * Indicator content rendered when the checkbox is checked or indeterminate
   * (e.g. a check or dash icon). Radix only mounts it in those states, so you
   * never have to toggle visibility yourself.
   */
  children?: ReactNode;
  /** Props forwarded to the internal Radix `Indicator`. */
  indicatorProps?: ComponentPropsWithoutRef<typeof RadixCheckbox.Indicator>;
}

/**
 * A headless, accessible checkbox built on Radix `Checkbox`. Renders a `Root`
 * (a real focusable control with a hidden native input for forms) wrapping an
 * `Indicator` that Radix only mounts while checked/indeterminate. Ships only
 * `data-ui-checkbox` / `data-ui-checkbox-indicator` hooks plus forwarded
 * `className`/`style`; Radix surfaces `data-state` for styling.
 */
export const Checkbox = forwardRef<
  ElementRef<typeof RadixCheckbox.Root>,
  CheckboxProps
>(function Checkbox({ className, children, indicatorProps, ...rest }, ref) {
  return (
    <RadixCheckbox.Root
      ref={ref}
      className={className}
      data-ui-checkbox=""
      {...rest}
    >
      <RadixCheckbox.Indicator data-ui-checkbox-indicator="" {...indicatorProps}>
        {children}
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
});
