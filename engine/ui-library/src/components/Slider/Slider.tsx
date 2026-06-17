import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { Slider as RadixSlider } from "radix-ui";

export interface SliderProps
  extends ComponentPropsWithoutRef<typeof RadixSlider.Root> {
  /** Props forwarded to the internal Radix `Track`. */
  trackProps?: ComponentPropsWithoutRef<typeof RadixSlider.Track>;
  /** Props forwarded to the internal Radix `Range` (the filled portion). */
  rangeProps?: ComponentPropsWithoutRef<typeof RadixSlider.Range>;
  /** Props forwarded to every internal Radix `Thumb`. */
  thumbProps?: ComponentPropsWithoutRef<typeof RadixSlider.Thumb>;
}

/**
 * A headless, accessible slider built on Radix `Slider`. Renders the full part
 * structure (`Track` > `Range`, plus one `Thumb` per value) so a range slider
 * "just works" — pass a two-element `value`/`defaultValue` and two thumbs are
 * rendered. Ships `data-ui-slider*` hooks plus forwarded `className`/`style`.
 */
export const Slider = forwardRef<
  ElementRef<typeof RadixSlider.Root>,
  SliderProps
>(function Slider(
  { className, trackProps, rangeProps, thumbProps, ...rest },
  ref,
) {
  // One thumb per value. Fall back to a single thumb when uncontrolled with no
  // default supplied (Radix itself defaults to one value).
  const values = rest.value ?? rest.defaultValue ?? [rest.min ?? 0];

  return (
    <RadixSlider.Root
      ref={ref}
      className={className}
      data-ui-slider=""
      {...rest}
    >
      <RadixSlider.Track data-ui-slider-track="" {...trackProps}>
        <RadixSlider.Range data-ui-slider-range="" {...rangeProps} />
      </RadixSlider.Track>
      {values.map((_, i) => (
        <RadixSlider.Thumb key={i} data-ui-slider-thumb="" {...thumbProps} />
      ))}
    </RadixSlider.Root>
  );
});
