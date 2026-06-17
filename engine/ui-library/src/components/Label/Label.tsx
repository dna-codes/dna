import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { Label as RadixLabel } from "radix-ui";

export type LabelProps = ComponentPropsWithoutRef<typeof RadixLabel.Root>;

/**
 * A headless, accessible form label built on Radix `Label`. Radix prevents text
 * selection on double-click (matching native label ergonomics) and wires up
 * association via `htmlFor`. Ships only a `data-ui-label` styling hook plus the
 * forwarded `className`/`style`.
 */
export const Label = forwardRef<ElementRef<typeof RadixLabel.Root>, LabelProps>(
  function Label({ className, ...rest }, ref) {
    return (
      <RadixLabel.Root
        ref={ref}
        className={className}
        data-ui-label=""
        {...rest}
      />
    );
  },
);
