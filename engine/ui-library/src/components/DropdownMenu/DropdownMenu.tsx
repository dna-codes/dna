import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef, ReactNode } from "react";
import { DropdownMenu as RadixDropdownMenu } from "radix-ui";

export type DropdownMenuProps = ComponentPropsWithoutRef<
  typeof RadixDropdownMenu.Root
>;
export type DropdownMenuTriggerProps = ComponentPropsWithoutRef<
  typeof RadixDropdownMenu.Trigger
>;
export type DropdownMenuItemProps = ComponentPropsWithoutRef<
  typeof RadixDropdownMenu.Item
>;
export type DropdownMenuLabelProps = ComponentPropsWithoutRef<
  typeof RadixDropdownMenu.Label
>;
export type DropdownMenuGroupProps = ComponentPropsWithoutRef<
  typeof RadixDropdownMenu.Group
>;
export type DropdownMenuSeparatorProps = ComponentPropsWithoutRef<
  typeof RadixDropdownMenu.Separator
>;
export type DropdownMenuRadioGroupProps = ComponentPropsWithoutRef<
  typeof RadixDropdownMenu.RadioGroup
>;
export type DropdownMenuSubProps = ComponentPropsWithoutRef<
  typeof RadixDropdownMenu.Sub
>;
export type DropdownMenuSubTriggerProps = ComponentPropsWithoutRef<
  typeof RadixDropdownMenu.SubTrigger
>;

export interface DropdownMenuContentProps
  extends ComponentPropsWithoutRef<typeof RadixDropdownMenu.Content> {
  /** Props forwarded to the internal Radix `Portal`. */
  portalProps?: ComponentPropsWithoutRef<typeof RadixDropdownMenu.Portal>;
}

export interface DropdownMenuCheckboxItemProps
  extends ComponentPropsWithoutRef<typeof RadixDropdownMenu.CheckboxItem> {
  /** Indicator content shown when checked (e.g. a check icon). */
  indicator?: ReactNode;
}

export interface DropdownMenuRadioItemProps
  extends ComponentPropsWithoutRef<typeof RadixDropdownMenu.RadioItem> {
  /** Indicator content shown when selected (e.g. a dot). */
  indicator?: ReactNode;
}

export type DropdownMenuSubContentProps = ComponentPropsWithoutRef<
  typeof RadixDropdownMenu.SubContent
> & {
  portalProps?: ComponentPropsWithoutRef<typeof RadixDropdownMenu.Portal>;
};

/**
 * Root of a headless, accessible dropdown menu built on Radix `DropdownMenu`.
 * Provides roving focus, typeahead, submenus, and checkbox/radio items. Compose
 * with the attached parts; each ships a `data-ui-dropdown-menu-*` hook plus
 * forwarded `className`/`style`.
 */
const Root = RadixDropdownMenu.Root;
const Group = RadixDropdownMenu.Group;
const RadioGroup = RadixDropdownMenu.RadioGroup;
const Sub = RadixDropdownMenu.Sub;

const Trigger = forwardRef<
  ElementRef<typeof RadixDropdownMenu.Trigger>,
  DropdownMenuTriggerProps
>(function DropdownMenuTrigger({ className, ...rest }, ref) {
  return (
    <RadixDropdownMenu.Trigger
      ref={ref}
      className={className}
      data-ui-dropdown-menu-trigger=""
      {...rest}
    />
  );
});

const Content = forwardRef<
  ElementRef<typeof RadixDropdownMenu.Content>,
  DropdownMenuContentProps
>(function DropdownMenuContent({ className, portalProps, ...rest }, ref) {
  return (
    <RadixDropdownMenu.Portal {...portalProps}>
      <RadixDropdownMenu.Content
        ref={ref}
        className={className}
        data-ui-dropdown-menu-content=""
        {...rest}
      />
    </RadixDropdownMenu.Portal>
  );
});

const Item = forwardRef<
  ElementRef<typeof RadixDropdownMenu.Item>,
  DropdownMenuItemProps
>(function DropdownMenuItem({ className, ...rest }, ref) {
  return (
    <RadixDropdownMenu.Item
      ref={ref}
      className={className}
      data-ui-dropdown-menu-item=""
      {...rest}
    />
  );
});

const CheckboxItem = forwardRef<
  ElementRef<typeof RadixDropdownMenu.CheckboxItem>,
  DropdownMenuCheckboxItemProps
>(function DropdownMenuCheckboxItem(
  { className, children, indicator, ...rest },
  ref,
) {
  return (
    <RadixDropdownMenu.CheckboxItem
      ref={ref}
      className={className}
      data-ui-dropdown-menu-checkbox-item=""
      {...rest}
    >
      <RadixDropdownMenu.ItemIndicator data-ui-dropdown-menu-item-indicator="">
        {indicator}
      </RadixDropdownMenu.ItemIndicator>
      {children}
    </RadixDropdownMenu.CheckboxItem>
  );
});

const RadioItem = forwardRef<
  ElementRef<typeof RadixDropdownMenu.RadioItem>,
  DropdownMenuRadioItemProps
>(function DropdownMenuRadioItem(
  { className, children, indicator, ...rest },
  ref,
) {
  return (
    <RadixDropdownMenu.RadioItem
      ref={ref}
      className={className}
      data-ui-dropdown-menu-radio-item=""
      {...rest}
    >
      <RadixDropdownMenu.ItemIndicator data-ui-dropdown-menu-item-indicator="">
        {indicator}
      </RadixDropdownMenu.ItemIndicator>
      {children}
    </RadixDropdownMenu.RadioItem>
  );
});

const Label = forwardRef<
  ElementRef<typeof RadixDropdownMenu.Label>,
  DropdownMenuLabelProps
>(function DropdownMenuLabel({ className, ...rest }, ref) {
  return (
    <RadixDropdownMenu.Label
      ref={ref}
      className={className}
      data-ui-dropdown-menu-label=""
      {...rest}
    />
  );
});

const Separator = forwardRef<
  ElementRef<typeof RadixDropdownMenu.Separator>,
  DropdownMenuSeparatorProps
>(function DropdownMenuSeparator({ className, ...rest }, ref) {
  return (
    <RadixDropdownMenu.Separator
      ref={ref}
      className={className}
      data-ui-dropdown-menu-separator=""
      {...rest}
    />
  );
});

const SubTrigger = forwardRef<
  ElementRef<typeof RadixDropdownMenu.SubTrigger>,
  DropdownMenuSubTriggerProps
>(function DropdownMenuSubTrigger({ className, ...rest }, ref) {
  return (
    <RadixDropdownMenu.SubTrigger
      ref={ref}
      className={className}
      data-ui-dropdown-menu-sub-trigger=""
      {...rest}
    />
  );
});

const SubContent = forwardRef<
  ElementRef<typeof RadixDropdownMenu.SubContent>,
  DropdownMenuSubContentProps
>(function DropdownMenuSubContent({ className, portalProps, ...rest }, ref) {
  return (
    <RadixDropdownMenu.Portal {...portalProps}>
      <RadixDropdownMenu.SubContent
        ref={ref}
        className={className}
        data-ui-dropdown-menu-sub-content=""
        {...rest}
      />
    </RadixDropdownMenu.Portal>
  );
});

export const DropdownMenu = Object.assign(Root, {
  Trigger,
  Content,
  Item,
  CheckboxItem,
  RadioGroup,
  RadioItem,
  Label,
  Separator,
  Group,
  Sub,
  SubTrigger,
  SubContent,
});
