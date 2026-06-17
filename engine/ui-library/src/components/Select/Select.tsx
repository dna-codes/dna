import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef, ReactNode } from "react";
import { Select as RadixSelect } from "radix-ui";

export type SelectProps = ComponentPropsWithoutRef<typeof RadixSelect.Root>;
export type SelectTriggerProps = ComponentPropsWithoutRef<
  typeof RadixSelect.Trigger
>;
export type SelectValueProps = ComponentPropsWithoutRef<
  typeof RadixSelect.Value
>;
export type SelectIconProps = ComponentPropsWithoutRef<typeof RadixSelect.Icon>;
export type SelectGroupProps = ComponentPropsWithoutRef<
  typeof RadixSelect.Group
>;
export type SelectLabelProps = ComponentPropsWithoutRef<
  typeof RadixSelect.Label
>;
export type SelectSeparatorProps = ComponentPropsWithoutRef<
  typeof RadixSelect.Separator
>;

export interface SelectContentProps
  extends ComponentPropsWithoutRef<typeof RadixSelect.Content> {
  /** Render outside a portal (inline). Defaults to portalled. */
  inline?: boolean;
  /** Props forwarded to the internal Radix `Portal`. */
  portalProps?: ComponentPropsWithoutRef<typeof RadixSelect.Portal>;
  /** Props forwarded to the internal Radix `Viewport`. */
  viewportProps?: ComponentPropsWithoutRef<typeof RadixSelect.Viewport>;
}

export interface SelectItemProps
  extends ComponentPropsWithoutRef<typeof RadixSelect.Item> {
  /** Indicator content shown when this item is selected (e.g. a check icon). */
  indicator?: ReactNode;
  /** Props forwarded to the internal Radix `ItemIndicator`. */
  indicatorProps?: ComponentPropsWithoutRef<typeof RadixSelect.ItemIndicator>;
}

/**
 * Root of a headless, accessible select built on Radix `Select`. Renders a
 * hidden native `<select>` for form submission and full typeahead/keyboard
 * support. Compose with the attached `Trigger`, `Value`, `Content`, `Item`,
 * `Group`, `Label`, and `Separator` parts. Each part ships a `data-ui-select-*`
 * hook plus forwarded `className`/`style`.
 */
const Root = RadixSelect.Root;

const Trigger = forwardRef<
  ElementRef<typeof RadixSelect.Trigger>,
  SelectTriggerProps
>(function SelectTrigger({ className, ...rest }, ref) {
  return (
    <RadixSelect.Trigger
      ref={ref}
      className={className}
      data-ui-select-trigger=""
      {...rest}
    />
  );
});

const Value = forwardRef<
  ElementRef<typeof RadixSelect.Value>,
  SelectValueProps
>(function SelectValue({ className, ...rest }, ref) {
  return (
    <RadixSelect.Value
      ref={ref}
      className={className}
      data-ui-select-value=""
      {...rest}
    />
  );
});

const Icon = forwardRef<ElementRef<typeof RadixSelect.Icon>, SelectIconProps>(
  function SelectIcon({ className, ...rest }, ref) {
    return (
      <RadixSelect.Icon
        ref={ref}
        className={className}
        data-ui-select-icon=""
        {...rest}
      />
    );
  },
);

const Content = forwardRef<
  ElementRef<typeof RadixSelect.Content>,
  SelectContentProps
>(function SelectContent(
  { className, children, inline = false, portalProps, viewportProps, ...rest },
  ref,
) {
  const content = (
    <RadixSelect.Content
      ref={ref}
      className={className}
      data-ui-select-content=""
      {...rest}
    >
      <RadixSelect.Viewport data-ui-select-viewport="" {...viewportProps}>
        {children}
      </RadixSelect.Viewport>
    </RadixSelect.Content>
  );

  if (inline) return content;
  return <RadixSelect.Portal {...portalProps}>{content}</RadixSelect.Portal>;
});

const Item = forwardRef<ElementRef<typeof RadixSelect.Item>, SelectItemProps>(
  function SelectItem(
    { className, children, indicator, indicatorProps, ...rest },
    ref,
  ) {
    return (
      <RadixSelect.Item
        ref={ref}
        className={className}
        data-ui-select-item=""
        {...rest}
      >
        <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
        <RadixSelect.ItemIndicator
          data-ui-select-item-indicator=""
          {...indicatorProps}
        >
          {indicator}
        </RadixSelect.ItemIndicator>
      </RadixSelect.Item>
    );
  },
);

const Group = forwardRef<
  ElementRef<typeof RadixSelect.Group>,
  SelectGroupProps
>(function SelectGroup({ className, ...rest }, ref) {
  return (
    <RadixSelect.Group
      ref={ref}
      className={className}
      data-ui-select-group=""
      {...rest}
    />
  );
});

const Label = forwardRef<
  ElementRef<typeof RadixSelect.Label>,
  SelectLabelProps
>(function SelectLabel({ className, ...rest }, ref) {
  return (
    <RadixSelect.Label
      ref={ref}
      className={className}
      data-ui-select-label=""
      {...rest}
    />
  );
});

const Separator = forwardRef<
  ElementRef<typeof RadixSelect.Separator>,
  SelectSeparatorProps
>(function SelectSeparator({ className, ...rest }, ref) {
  return (
    <RadixSelect.Separator
      ref={ref}
      className={className}
      data-ui-select-separator=""
      {...rest}
    />
  );
});

export const Select = Object.assign(Root, {
  Trigger,
  Value,
  Icon,
  Content,
  Item,
  Group,
  Label,
  Separator,
});
