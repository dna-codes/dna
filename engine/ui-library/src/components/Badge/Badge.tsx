import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { Slot } from "radix-ui";

/** Status intent. Emitted as `data-variant`; the component picks no look itself. */
export type BadgeVariant =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Merge props onto the single child element instead of rendering a native
   * `<span>` — e.g. to render the badge as a link or a status `<output>`.
   *
   * @see https://www.radix-ui.com/primitives/docs/guides/composition
   */
  asChild?: boolean;
  /**
   * Status intent. Emits a `data-variant` styling hook ONLY — the component
   * makes no visual decision; the skin layer styles the hook. Omitted when
   * unset so the default look applies.
   */
  variant?: BadgeVariant;
}

/**
 * A headless badge/label/pill. Radix has no primitive for this, so it follows
 * the `Button` pattern: a `Slot`-powered element that makes no visual decision
 * and ships only styling hooks — `data-ui-badge`, an optional `data-variant`,
 * plus forwarded `className`/`style` and native props.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { asChild = false, className, variant, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      ref={ref}
      className={className}
      data-ui-badge=""
      data-variant={variant}
      {...rest}
    />
  );
});
