import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { Toast as RadixToast } from "radix-ui";

export type ToastProviderProps = ComponentPropsWithoutRef<
  typeof RadixToast.Provider
>;
export type ToastViewportProps = ComponentPropsWithoutRef<
  typeof RadixToast.Viewport
>;
export type ToastProps = ComponentPropsWithoutRef<typeof RadixToast.Root>;
export type ToastTitleProps = ComponentPropsWithoutRef<
  typeof RadixToast.Title
>;
export type ToastDescriptionProps = ComponentPropsWithoutRef<
  typeof RadixToast.Description
>;
export type ToastActionProps = ComponentPropsWithoutRef<
  typeof RadixToast.Action
>;
export type ToastCloseProps = ComponentPropsWithoutRef<
  typeof RadixToast.Close
>;

/**
 * Root of a headless, accessible toast built on Radix `Toast`. Mount one
 * `Toast.Provider` near your app root and one `Toast.Viewport` for placement;
 * render a `Toast` per notification (it handles swipe-to-dismiss, timers, and
 * the polite/assertive live region). Compose with the attached `Title`,
 * `Description`, `Action`, and `Close` parts; each ships a `data-ui-toast-*`
 * hook plus forwarded `className`/`style`.
 */
const Provider = RadixToast.Provider;

const Viewport = forwardRef<
  ElementRef<typeof RadixToast.Viewport>,
  ToastViewportProps
>(function ToastViewport({ className, ...rest }, ref) {
  return (
    <RadixToast.Viewport
      ref={ref}
      className={className}
      data-ui-toast-viewport=""
      {...rest}
    />
  );
});

const Root = forwardRef<ElementRef<typeof RadixToast.Root>, ToastProps>(
  function Toast({ className, ...rest }, ref) {
    return (
      <RadixToast.Root
        ref={ref}
        className={className}
        data-ui-toast=""
        {...rest}
      />
    );
  },
);

const Title = forwardRef<ElementRef<typeof RadixToast.Title>, ToastTitleProps>(
  function ToastTitle({ className, ...rest }, ref) {
    return (
      <RadixToast.Title
        ref={ref}
        className={className}
        data-ui-toast-title=""
        {...rest}
      />
    );
  },
);

const Description = forwardRef<
  ElementRef<typeof RadixToast.Description>,
  ToastDescriptionProps
>(function ToastDescription({ className, ...rest }, ref) {
  return (
    <RadixToast.Description
      ref={ref}
      className={className}
      data-ui-toast-description=""
      {...rest}
    />
  );
});

const Action = forwardRef<
  ElementRef<typeof RadixToast.Action>,
  ToastActionProps
>(function ToastAction({ className, ...rest }, ref) {
  return (
    <RadixToast.Action
      ref={ref}
      className={className}
      data-ui-toast-action=""
      {...rest}
    />
  );
});

const Close = forwardRef<ElementRef<typeof RadixToast.Close>, ToastCloseProps>(
  function ToastClose({ className, ...rest }, ref) {
    return (
      <RadixToast.Close
        ref={ref}
        className={className}
        data-ui-toast-close=""
        {...rest}
      />
    );
  },
);

export const Toast = Object.assign(Root, {
  Provider,
  Viewport,
  Title,
  Description,
  Action,
  Close,
});
