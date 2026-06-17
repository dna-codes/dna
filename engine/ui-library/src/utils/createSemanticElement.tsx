import { forwardRef } from "react";
import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { Slot } from "radix-ui";

export interface SemanticElementProps extends HTMLAttributes<HTMLElement> {
  /**
   * Merge props onto the single child element instead of rendering the default
   * tag. Use this to swap the underlying element while keeping the semantics
   * and styling hook (e.g. render a `Sidebar` as a `<nav>`).
   *
   * @see https://www.radix-ui.com/primitives/docs/guides/composition
   */
  asChild?: boolean;
  children?: ReactNode;
}

/**
 * Builds a headless, unstyled structural/landmark component.
 *
 * These components have no Radix primitive (Radix covers widgets, not page
 * structure), so their accessibility comes from the right semantic element —
 * `<header>`, `<footer>`, `<aside>`, etc. — exactly as Radix would wire ARIA
 * under the hood. They keep the same contracts as the rest of the library:
 * `forwardRef`, `asChild` via `Slot`, a stable `data-*` hook, and full native
 * prop/`className`/`style` passthrough. Ship no styling.
 */
export function createSemanticElement(
  displayName: string,
  defaultTag: ElementType,
  dataAttr: `data-ui-${string}`,
) {
  const Component = forwardRef<HTMLElement, SemanticElementProps>(
    function SemanticElement({ asChild = false, ...rest }, ref) {
      const Comp = asChild ? Slot.Root : defaultTag;
      return <Comp ref={ref} {...{ [dataAttr]: "" }} {...rest} />;
    },
  );
  Component.displayName = displayName;
  return Component;
}
