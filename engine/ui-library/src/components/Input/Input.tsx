import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { Slot } from "radix-ui";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /**
   * Merge props onto the single child element instead of rendering a native
   * `<input>`. Useful for composing onto a masked-input or third-party field
   * while keeping the styling hook.
   *
   * @see https://www.radix-ui.com/primitives/docs/guides/composition
   */
  asChild?: boolean;
}

/**
 * A headless, unstyled text input. Ships no visual styling — only a stable
 * styling hook (`data-ui-input`) plus forwarded `className`/`style` and native
 * input props. Exposes `data-invalid` when `aria-invalid` is set so consumers
 * can style error states from the attribute alone.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { asChild = false, type, className, "aria-invalid": ariaInvalid, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "input";
  // `aria-invalid` is truthy for `true`, `"true"`, `"grammar"`, `"spelling"`.
  const invalid = ariaInvalid !== undefined && ariaInvalid !== false && ariaInvalid !== "false";

  return (
    <Comp
      ref={ref}
      type={asChild ? type : (type ?? "text")}
      className={className}
      data-ui-input=""
      data-invalid={invalid ? "" : undefined}
      aria-invalid={ariaInvalid}
      {...rest}
    />
  );
});
