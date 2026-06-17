import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { Dialog as RadixDialog } from "radix-ui";

export type DialogProps = ComponentPropsWithoutRef<typeof RadixDialog.Root>;
export type DialogTriggerProps = ComponentPropsWithoutRef<
  typeof RadixDialog.Trigger
>;
export type DialogCloseProps = ComponentPropsWithoutRef<
  typeof RadixDialog.Close
>;
export type DialogTitleProps = ComponentPropsWithoutRef<
  typeof RadixDialog.Title
>;
export type DialogDescriptionProps = ComponentPropsWithoutRef<
  typeof RadixDialog.Description
>;
export type DialogOverlayProps = ComponentPropsWithoutRef<
  typeof RadixDialog.Overlay
>;

export interface DialogContentProps
  extends ComponentPropsWithoutRef<typeof RadixDialog.Content> {
  /** Render without the dimmed overlay backdrop. */
  withoutOverlay?: boolean;
  /** Props forwarded to the internal Radix `Overlay`. */
  overlayProps?: DialogOverlayProps;
  /** Props forwarded to the internal Radix `Portal`. */
  portalProps?: ComponentPropsWithoutRef<typeof RadixDialog.Portal>;
}

/**
 * Root of a headless, accessible modal dialog built on Radix `Dialog`. Handles
 * focus trapping, scroll locking, `Esc`/outside-click dismissal, and ARIA
 * wiring. Compose with the attached `Trigger`, `Content`, `Title`,
 * `Description`, and `Close` parts. Each ships a `data-ui-dialog-*` hook plus
 * forwarded `className`/`style`.
 */
const Root = RadixDialog.Root;

const Trigger = forwardRef<
  ElementRef<typeof RadixDialog.Trigger>,
  DialogTriggerProps
>(function DialogTrigger({ className, ...rest }, ref) {
  return (
    <RadixDialog.Trigger
      ref={ref}
      className={className}
      data-ui-dialog-trigger=""
      {...rest}
    />
  );
});

/**
 * The dialog surface. Renders `Portal` > `Overlay` > `Content` so the modal is
 * portalled out of the DOM flow with a backdrop by default. Pass
 * `withoutOverlay` for a non-dimmed dialog.
 */
const Content = forwardRef<
  ElementRef<typeof RadixDialog.Content>,
  DialogContentProps
>(function DialogContent(
  { className, children, withoutOverlay, overlayProps, portalProps, ...rest },
  ref,
) {
  return (
    <RadixDialog.Portal {...portalProps}>
      {!withoutOverlay && (
        <RadixDialog.Overlay data-ui-dialog-overlay="" {...overlayProps} />
      )}
      <RadixDialog.Content
        ref={ref}
        className={className}
        data-ui-dialog-content=""
        {...rest}
      >
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
});

const Title = forwardRef<
  ElementRef<typeof RadixDialog.Title>,
  DialogTitleProps
>(function DialogTitle({ className, ...rest }, ref) {
  return (
    <RadixDialog.Title
      ref={ref}
      className={className}
      data-ui-dialog-title=""
      {...rest}
    />
  );
});

const Description = forwardRef<
  ElementRef<typeof RadixDialog.Description>,
  DialogDescriptionProps
>(function DialogDescription({ className, ...rest }, ref) {
  return (
    <RadixDialog.Description
      ref={ref}
      className={className}
      data-ui-dialog-description=""
      {...rest}
    />
  );
});

const Close = forwardRef<
  ElementRef<typeof RadixDialog.Close>,
  DialogCloseProps
>(function DialogClose({ className, ...rest }, ref) {
  return (
    <RadixDialog.Close
      ref={ref}
      className={className}
      data-ui-dialog-close=""
      {...rest}
    />
  );
});

export const Dialog = Object.assign(Root, {
  Trigger,
  Content,
  Title,
  Description,
  Close,
});
