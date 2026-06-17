import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { AspectRatio as RadixAspectRatio } from "radix-ui";

export type AspectRatioProps = ComponentPropsWithoutRef<
  typeof RadixAspectRatio.Root
>;

/**
 * A headless container that constrains its content to a desired width/height
 * `ratio` (e.g. `16 / 9`), built on Radix `AspectRatio`. Useful for responsive
 * media on landing pages. Ships only a `data-ui-aspect-ratio` hook plus
 * forwarded `className`/`style`.
 */
export const AspectRatio = forwardRef<
  ElementRef<typeof RadixAspectRatio.Root>,
  AspectRatioProps
>(function AspectRatio({ className, ...rest }, ref) {
  return (
    <RadixAspectRatio.Root
      ref={ref}
      className={className}
      data-ui-aspect-ratio=""
      {...rest}
    />
  );
});
