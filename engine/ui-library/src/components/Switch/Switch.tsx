import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { Switch as RadixSwitch } from "radix-ui";

export interface SwitchProps
  extends ComponentPropsWithoutRef<typeof RadixSwitch.Root> {
  /** Props forwarded to the internal Radix `Thumb` (the moving knob). */
  thumbProps?: ComponentPropsWithoutRef<typeof RadixSwitch.Thumb>;
}

/**
 * A headless, accessible on/off switch built on Radix `Switch`. Renders a
 * `Root` (role `switch`, with a hidden native input for forms) wrapping a
 * `Thumb`. Ships only `data-ui-switch` / `data-ui-switch-thumb` hooks plus
 * forwarded `className`/`style`; Radix surfaces `data-state` for styling.
 */
export const Switch = forwardRef<
  ElementRef<typeof RadixSwitch.Root>,
  SwitchProps
>(function Switch({ className, thumbProps, ...rest }, ref) {
  return (
    <RadixSwitch.Root ref={ref} className={className} data-ui-switch="" {...rest}>
      <RadixSwitch.Thumb data-ui-switch-thumb="" {...thumbProps} />
    </RadixSwitch.Root>
  );
});
