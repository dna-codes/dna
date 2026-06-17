import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { Tooltip as RadixTooltip } from "radix-ui";

export type TooltipProps = ComponentPropsWithoutRef<typeof RadixTooltip.Root>;
export type TooltipProviderProps = ComponentPropsWithoutRef<
  typeof RadixTooltip.Provider
>;
export type TooltipTriggerProps = ComponentPropsWithoutRef<
  typeof RadixTooltip.Trigger
>;
export type TooltipArrowProps = ComponentPropsWithoutRef<
  typeof RadixTooltip.Arrow
>;

export interface TooltipContentProps
  extends ComponentPropsWithoutRef<typeof RadixTooltip.Content> {
  /** Render an arrow pointing at the trigger. */
  arrow?: boolean;
  /** Props forwarded to the internal Radix `Arrow`. */
  arrowProps?: TooltipArrowProps;
  /** Props forwarded to the internal Radix `Portal`. */
  portalProps?: ComponentPropsWithoutRef<typeof RadixTooltip.Portal>;
}

/**
 * Root of a headless, accessible tooltip built on Radix `Tooltip`. Requires a
 * `Tooltip.Provider` ancestor (mount one near your app root to share open/close
 * delays). Compose with the attached `Trigger` and `Content` parts; each ships
 * a `data-ui-tooltip-*` hook plus forwarded `className`/`style`.
 */
const Root = RadixTooltip.Root;
const Provider = RadixTooltip.Provider;

const Trigger = forwardRef<
  ElementRef<typeof RadixTooltip.Trigger>,
  TooltipTriggerProps
>(function TooltipTrigger({ className, ...rest }, ref) {
  return (
    <RadixTooltip.Trigger
      ref={ref}
      className={className}
      data-ui-tooltip-trigger=""
      {...rest}
    />
  );
});

const Content = forwardRef<
  ElementRef<typeof RadixTooltip.Content>,
  TooltipContentProps
>(function TooltipContent(
  { className, children, arrow, arrowProps, portalProps, ...rest },
  ref,
) {
  return (
    <RadixTooltip.Portal {...portalProps}>
      <RadixTooltip.Content
        ref={ref}
        className={className}
        data-ui-tooltip-content=""
        {...rest}
      >
        {children}
        {arrow && <RadixTooltip.Arrow data-ui-tooltip-arrow="" {...arrowProps} />}
      </RadixTooltip.Content>
    </RadixTooltip.Portal>
  );
});

export const Tooltip = Object.assign(Root, { Provider, Trigger, Content });
