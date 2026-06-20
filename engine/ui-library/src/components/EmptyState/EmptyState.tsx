import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { Slot } from "radix-ui";

/** Props shared by every `EmptyState.*` part. */
export interface EmptyStateProps extends HTMLAttributes<HTMLElement> {
  /**
   * Merge props onto the single child element instead of rendering the default
   * element for this part.
   *
   * @see https://www.radix-ui.com/primitives/docs/guides/composition
   */
  asChild?: boolean;
}

export type EmptyStateIconProps = EmptyStateProps;
export type EmptyStateTitleProps = EmptyStateProps;
export type EmptyStateDescriptionProps = EmptyStateProps;
export type EmptyStateActionsProps = EmptyStateProps;

/**
 * The canonical empty-state pattern — the centered "nothing here yet" placeholder
 * for a list, table, or panel with no data. Headless: `Slot` `asChild` parts
 * that ship only `data-ui-empty-state-*` hooks; the skin centers the column and
 * mutes the supporting text.
 *
 * ```tsx
 * <EmptyState.Root>
 *   <EmptyState.Icon>📂</EmptyState.Icon>
 *   <EmptyState.Title>No resources yet</EmptyState.Title>
 *   <EmptyState.Description>Create the first resource to get started.</EmptyState.Description>
 *   <EmptyState.Actions><Button variant="primary">New resource</Button></EmptyState.Actions>
 * </EmptyState.Root>
 * ```
 */
const Root = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { asChild = false, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp ref={ref} className={className} data-ui-empty-state="" {...rest} />
  );
});

const Icon = forwardRef<HTMLDivElement, EmptyStateIconProps>(
  function EmptyStateIcon({ asChild = false, className, ...rest }, ref) {
    const Comp = asChild ? Slot.Root : "div";
    return (
      <Comp
        ref={ref}
        className={className}
        aria-hidden="true"
        data-ui-empty-state-icon=""
        {...rest}
      />
    );
  },
);

const Title = forwardRef<HTMLParagraphElement, EmptyStateTitleProps>(
  function EmptyStateTitle({ asChild = false, className, ...rest }, ref) {
    const Comp = asChild ? Slot.Root : "p";
    return (
      <Comp
        ref={ref}
        className={className}
        data-ui-empty-state-title=""
        {...rest}
      />
    );
  },
);

const Description = forwardRef<
  HTMLParagraphElement,
  EmptyStateDescriptionProps
>(function EmptyStateDescription({ asChild = false, className, ...rest }, ref) {
  const Comp = asChild ? Slot.Root : "p";
  return (
    <Comp
      ref={ref}
      className={className}
      data-ui-empty-state-description=""
      {...rest}
    />
  );
});

const Actions = forwardRef<HTMLDivElement, EmptyStateActionsProps>(
  function EmptyStateActions({ asChild = false, className, ...rest }, ref) {
    const Comp = asChild ? Slot.Root : "div";
    return (
      <Comp
        ref={ref}
        className={className}
        data-ui-empty-state-actions=""
        {...rest}
      />
    );
  },
);

Root.displayName = "EmptyState";
Icon.displayName = "EmptyState.Icon";
Title.displayName = "EmptyState.Title";
Description.displayName = "EmptyState.Description";
Actions.displayName = "EmptyState.Actions";

/** Compound, headless empty-state placeholder. Compose the namespaced parts. */
export const EmptyState = {
  Root,
  Icon,
  Title,
  Description,
  Actions,
};
