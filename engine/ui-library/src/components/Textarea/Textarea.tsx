import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { Slot } from "radix-ui";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Merge props onto the single child element instead of rendering a native
   * `<textarea>`.
   *
   * @see https://www.radix-ui.com/primitives/docs/guides/composition
   */
  asChild?: boolean;
}

/**
 * A headless, unstyled multiline text field. Ships only a stable styling hook
 * (`data-ui-textarea`), a `data-invalid` mirror of `aria-invalid`, and the
 * forwarded `className`/`style` plus native `<textarea>` props.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { asChild = false, className, "aria-invalid": ariaInvalid, ...rest },
    ref,
  ) {
    const Comp = asChild ? Slot.Root : "textarea";
    const invalid =
      ariaInvalid !== undefined && ariaInvalid !== false && ariaInvalid !== "false";

    return (
      <Comp
        ref={ref}
        className={className}
        data-ui-textarea=""
        data-invalid={invalid ? "" : undefined}
        aria-invalid={ariaInvalid}
        {...rest}
      />
    );
  },
);
