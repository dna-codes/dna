import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { Slot } from "radix-ui";

/**
 * A mono-font inline label for technical identifiers: resource type names,
 * IDs, schema keys, and other code-adjacent strings.
 *
 * Distinct from Badge (which carries status/category intent). Tag is for
 * raw technical vocabulary — it reads like `<code>` but as a chip.
 */

export type TagVariant = "neutral" | "primary";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Merge props onto the single child element instead of rendering a `<span>`.
   * @see https://www.radix-ui.com/primitives/docs/guides/composition
   */
  asChild?: boolean;
  /**
   * Visual intent. `primary` = teal tint (active/selected vocabulary).
   * Neutral by default.
   */
  variant?: TagVariant;
}

export const Tag = forwardRef<HTMLSpanElement, TagProps>(function Tag(
  { asChild = false, className, variant, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      ref={ref}
      className={className}
      data-ui-tag=""
      data-variant={variant}
      {...rest}
    />
  );
});
