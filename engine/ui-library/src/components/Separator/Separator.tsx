import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { Separator as RadixSeparator } from "radix-ui";

export type SeparatorProps = ComponentPropsWithoutRef<
  typeof RadixSeparator.Root
>;

/**
 * A headless, accessible divider built on Radix `Separator`. By default it is a
 * semantic separator with the correct `role`/`aria-orientation`; pass
 * `decorative` for a purely visual rule that is hidden from assistive tech.
 * Ships only a `data-ui-separator` hook plus forwarded `className`/`style`.
 * Radix surfaces `data-orientation` for styling horizontal vs. vertical.
 */
export const Separator = forwardRef<
  ElementRef<typeof RadixSeparator.Root>,
  SeparatorProps
>(function Separator({ className, ...rest }, ref) {
  return (
    <RadixSeparator.Root
      ref={ref}
      className={className}
      data-ui-separator=""
      {...rest}
    />
  );
});
