import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { Slot } from "radix-ui";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Merge props onto the single child element instead of rendering a native
   * `<div>`.
   *
   * @see https://www.radix-ui.com/primitives/docs/guides/composition
   */
  asChild?: boolean;
}

/**
 * A headless content placeholder shown while data loads. Radix has no skeleton
 * primitive; this ships only the right semantics — `aria-hidden` so the
 * placeholder isn't announced — plus a `data-ui-skeleton` styling hook and
 * forwarded `className`/`style`. The shimmer/pulse animation is the consumer's
 * (animate the hook in CSS). Pair with a `Spinner`/live region for a11y.
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  function Skeleton({ asChild = false, className, ...rest }, ref) {
    const Comp = asChild ? Slot.Root : "div";
    return (
      <Comp
        ref={ref}
        className={className}
        data-ui-skeleton=""
        aria-hidden="true"
        {...rest}
      />
    );
  },
);
