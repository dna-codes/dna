import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { Progress as RadixProgress } from "radix-ui";

export interface ProgressProps
  extends ComponentPropsWithoutRef<typeof RadixProgress.Root> {
  /** Props forwarded to the internal Radix `Indicator` (the filled bar). */
  indicatorProps?: ComponentPropsWithoutRef<typeof RadixProgress.Indicator>;
}

/**
 * A headless, accessible progress bar built on Radix `Progress`. Renders a
 * `Root` (role `progressbar` with correct ARIA value attributes) wrapping an
 * `Indicator`. Pass `value={null}` for an indeterminate state. Both parts ship
 * `data-ui-progress*` hooks; Radix surfaces `data-state`, `data-value`, and
 * `data-max` so you can drive the fill width from CSS.
 */
export const Progress = forwardRef<
  ElementRef<typeof RadixProgress.Root>,
  ProgressProps
>(function Progress({ className, indicatorProps, ...rest }, ref) {
  return (
    <RadixProgress.Root
      ref={ref}
      className={className}
      data-ui-progress=""
      {...rest}
    >
      <RadixProgress.Indicator
        data-ui-progress-indicator=""
        {...indicatorProps}
      />
    </RadixProgress.Root>
  );
});
