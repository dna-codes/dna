import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { Direction, Slot } from "radix-ui";

export interface ApplicationProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Reading direction for the whole app. When set, wraps the tree in Radix's
   * `DirectionProvider` so every Radix widget below inherits it. Omit to let
   * Radix fall back to its default (`ltr`).
   */
  dir?: "ltr" | "rtl";
  /**
   * Merge props onto the single child element instead of rendering a `<div>`.
   * @see https://www.radix-ui.com/primitives/docs/guides/composition
   */
  asChild?: boolean;
  children?: ReactNode;
}

/**
 * The application root — the single mount point for app-wide providers. It is
 * intentionally **not** a landmark (it wraps the chrome — `Header`, `Sidebar`,
 * `Footer` — and the route's `<main>`/`Page`, so it cannot itself be `<main>`).
 *
 * It composes Radix's `DirectionProvider` when `dir` is set; add any other
 * app-wide Radix providers (e.g. `Tooltip.Provider`, `Toast.Provider`) as
 * children. Renders a plain `<div>` with the `data-ui-application` hook.
 */
export const Application = forwardRef<HTMLDivElement, ApplicationProps>(
  function Application({ dir, asChild = false, children, ...rest }, ref) {
    const Comp = asChild ? Slot.Root : "div";

    const root = (
      <Comp ref={ref} data-ui-application="" {...rest}>
        {children}
      </Comp>
    );

    return dir ? (
      <Direction.DirectionProvider dir={dir}>{root}</Direction.DirectionProvider>
    ) : (
      root
    );
  },
);
