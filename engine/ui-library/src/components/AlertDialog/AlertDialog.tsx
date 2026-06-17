import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { AlertDialog as RadixAlertDialog } from "radix-ui";

export type AlertDialogProps = ComponentPropsWithoutRef<
  typeof RadixAlertDialog.Root
>;
export type AlertDialogTriggerProps = ComponentPropsWithoutRef<
  typeof RadixAlertDialog.Trigger
>;
export type AlertDialogActionProps = ComponentPropsWithoutRef<
  typeof RadixAlertDialog.Action
>;
export type AlertDialogCancelProps = ComponentPropsWithoutRef<
  typeof RadixAlertDialog.Cancel
>;
export type AlertDialogTitleProps = ComponentPropsWithoutRef<
  typeof RadixAlertDialog.Title
>;
export type AlertDialogDescriptionProps = ComponentPropsWithoutRef<
  typeof RadixAlertDialog.Description
>;
export type AlertDialogOverlayProps = ComponentPropsWithoutRef<
  typeof RadixAlertDialog.Overlay
>;

export interface AlertDialogContentProps
  extends ComponentPropsWithoutRef<typeof RadixAlertDialog.Content> {
  /** Render without the dimmed overlay backdrop. */
  withoutOverlay?: boolean;
  /** Props forwarded to the internal Radix `Overlay`. */
  overlayProps?: AlertDialogOverlayProps;
  /** Props forwarded to the internal Radix `Portal`. */
  portalProps?: ComponentPropsWithoutRef<typeof RadixAlertDialog.Portal>;
}

/**
 * Root of a headless, accessible confirmation dialog built on Radix
 * `AlertDialog`. Unlike `Dialog` it is not dismissible by outside-click and
 * focuses `Cancel` by default — the right primitive for destructive "are you
 * sure?" flows. Compose with the attached `Trigger`, `Content`, `Title`,
 * `Description`, `Action`, and `Cancel` parts.
 */
const Root = RadixAlertDialog.Root;

const Trigger = forwardRef<
  ElementRef<typeof RadixAlertDialog.Trigger>,
  AlertDialogTriggerProps
>(function AlertDialogTrigger({ className, ...rest }, ref) {
  return (
    <RadixAlertDialog.Trigger
      ref={ref}
      className={className}
      data-ui-alert-dialog-trigger=""
      {...rest}
    />
  );
});

const Content = forwardRef<
  ElementRef<typeof RadixAlertDialog.Content>,
  AlertDialogContentProps
>(function AlertDialogContent(
  { className, children, withoutOverlay, overlayProps, portalProps, ...rest },
  ref,
) {
  return (
    <RadixAlertDialog.Portal {...portalProps}>
      {!withoutOverlay && (
        <RadixAlertDialog.Overlay
          data-ui-alert-dialog-overlay=""
          {...overlayProps}
        />
      )}
      <RadixAlertDialog.Content
        ref={ref}
        className={className}
        data-ui-alert-dialog-content=""
        {...rest}
      >
        {children}
      </RadixAlertDialog.Content>
    </RadixAlertDialog.Portal>
  );
});

const Title = forwardRef<
  ElementRef<typeof RadixAlertDialog.Title>,
  AlertDialogTitleProps
>(function AlertDialogTitle({ className, ...rest }, ref) {
  return (
    <RadixAlertDialog.Title
      ref={ref}
      className={className}
      data-ui-alert-dialog-title=""
      {...rest}
    />
  );
});

const Description = forwardRef<
  ElementRef<typeof RadixAlertDialog.Description>,
  AlertDialogDescriptionProps
>(function AlertDialogDescription({ className, ...rest }, ref) {
  return (
    <RadixAlertDialog.Description
      ref={ref}
      className={className}
      data-ui-alert-dialog-description=""
      {...rest}
    />
  );
});

const Action = forwardRef<
  ElementRef<typeof RadixAlertDialog.Action>,
  AlertDialogActionProps
>(function AlertDialogAction({ className, ...rest }, ref) {
  return (
    <RadixAlertDialog.Action
      ref={ref}
      className={className}
      data-ui-alert-dialog-action=""
      {...rest}
    />
  );
});

const Cancel = forwardRef<
  ElementRef<typeof RadixAlertDialog.Cancel>,
  AlertDialogCancelProps
>(function AlertDialogCancel({ className, ...rest }, ref) {
  return (
    <RadixAlertDialog.Cancel
      ref={ref}
      className={className}
      data-ui-alert-dialog-cancel=""
      {...rest}
    />
  );
});

export const AlertDialog = Object.assign(Root, {
  Trigger,
  Content,
  Title,
  Description,
  Action,
  Cancel,
});
