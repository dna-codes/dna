import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { VisuallyHidden } from "radix-ui";

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Accessible label announced to assistive tech. Rendered visually hidden so
   * the spinner has a name without showing text. Defaults to `"Loading"`.
   */
  label?: string;
  /**
   * Visual indicator content (an icon/SVG/CSS spinner). Marked `aria-hidden`
   * since the accessible name comes from `label`. If omitted, the consumer is
   * expected to draw the spinner from the `[data-ui-spinner]` hook in CSS.
   */
  children?: ReactNode;
}

/**
 * A headless, accessible loading spinner. Radix has no spinner primitive, so
 * this ships only the correct semantics — `role="status"` with a visually
 * hidden label — plus a `data-ui-spinner` styling hook and forwarded
 * `className`/`style`. The spinning visual itself is entirely the consumer's
 * (animate the hook in CSS, or pass an icon as `children`).
 */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(
  function Spinner({ label = "Loading", children, className, ...rest }, ref) {
    return (
      <span
        ref={ref}
        role="status"
        className={className}
        data-ui-spinner=""
        {...rest}
      >
        {children != null && <span aria-hidden="true">{children}</span>}
        <VisuallyHidden.Root>{label}</VisuallyHidden.Root>
      </span>
    );
  },
);
