import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Slot } from "radix-ui";

/** Visual intent. Emitted as `data-variant`; the component picks no look itself. */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

/** Control size. Emitted as `data-size`; the component picks no dimensions itself. */
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Merge props onto the single child element instead of rendering a native
   * `<button>`. Use this to keep button behaviour while rendering a different
   * element (e.g. an `<a>` or a router `<Link>`).
   *
   * @see https://www.radix-ui.com/primitives/docs/guides/composition
   */
  asChild?: boolean;
  /**
   * Visual intent. Emits a `data-variant` styling hook ONLY — the component
   * makes no visual decision; the skin layer (or your own CSS/Tailwind) styles
   * the hook. Omitted when unset so the default look applies.
   */
  variant?: ButtonVariant;
  /**
   * Control size. Emits a `data-size` styling hook ONLY. Omitted when unset so
   * the skin's default size applies.
   */
  size?: ButtonSize;
  /** Content rendered inside the button. */
  children: ReactNode;
}

/**
 * A headless, accessible button primitive built on Radix UI.
 *
 * It makes no visual decision — it ships behaviour, accessibility, and stable
 * styling hooks only: `data-ui-button`, a forwarded `className`, and optional
 * `data-variant`/`data-size` attributes that the skin layer targets. When
 * rendering a native element it defaults `type` to `"button"`; with `asChild`
 * it composes onto the provided child via Radix `Slot`.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { asChild = false, type, className, variant, size, children, ...rest },
    ref,
  ) {
    const Comp = asChild ? Slot.Root : "button";

    return (
      <Comp
        ref={ref}
        // `type` is only meaningful on a native button; when composing onto an
        // arbitrary child (e.g. an anchor) we leave it to the consumer.
        type={asChild ? type : (type ?? "button")}
        className={className}
        data-ui-button=""
        data-variant={variant}
        data-size={size}
        {...rest}
      >
        {children}
      </Comp>
    );
  },
);
