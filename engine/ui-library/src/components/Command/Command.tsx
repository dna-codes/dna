import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
} from "react";
import type {
  HTMLAttributes,
  InputHTMLAttributes,
  KeyboardEvent,
  ReactNode,
} from "react";
import { Dialog as RadixDialog, VisuallyHidden } from "radix-ui";

interface CommandContextValue {
  /** Id of the active (virtually focused) option, mirrored to aria-activedescendant. */
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  /** Stable id of the listbox, so the combobox input can find its options. */
  listId: string;
}

const CommandContext = createContext<CommandContextValue | null>(null);

function useCommand(part: string): CommandContextValue {
  const ctx = useContext(CommandContext);
  if (!ctx) {
    throw new Error(`Command.${part} must be used within a Command.Root`);
  }
  return ctx;
}

/** Visible, enabled options in DOM order, scoped to this palette's listbox. */
function getOptions(listId: string): HTMLElement[] {
  const list = typeof document === "undefined" ? null : document.getElementById(listId);
  if (!list) return [];
  return Array.from(
    list.querySelectorAll<HTMLElement>(
      '[data-ui-command-item]:not([aria-disabled="true"])',
    ),
  );
}

export interface CommandProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

/**
 * Building blocks for a command / search palette — an overlay-ready combobox
 * with a filterable, keyboard-navigable list. Radix has no command primitive
 * (cmdk-style), so the list follows the `Table` approach: a headless
 * `role="combobox"`/`role="listbox"`/`role="option"` set with `data-ui-command-*`
 * hooks and no visual decision. Filtering is **consumer-controlled** — render
 * the `Item`s that match your query; the component owns virtual focus
 * (`aria-activedescendant`), arrow/Home/End/Enter keys, and pointer hover.
 *
 * `Command.Root` works inline; wrap it in `Command.Dialog` for the modal palette
 * (built on Radix `Dialog` — focus trap, scroll lock, `Esc` dismissal).
 *
 * ```tsx
 * <Command.Dialog open={open} onOpenChange={setOpen} label="Command palette">
 *   <Command.Input value={q} onValueChange={setQ} placeholder="Type a command…" />
 *   <Command.List>
 *     {results.length === 0 && <Command.Empty>No results.</Command.Empty>}
 *     {results.map((r) => (
 *       <Command.Item key={r.id} onSelect={() => run(r)}>{r.label}</Command.Item>
 *     ))}
 *   </Command.List>
 * </Command.Dialog>
 * ```
 */
const Root = forwardRef<HTMLDivElement, CommandProps>(function Command(
  { children, className, ...rest },
  ref,
) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const baseId = useId();
  const listId = `${baseId}-list`;

  // Keep the active option valid as the consumer filters items in and out: if
  // there is no active option (or it dropped out of the list), fall back to the
  // first. This must run after EVERY render (the option set changes when the
  // consumer re-renders its filtered `Item`s, with no dep we could key on); the
  // guards below make it a no-op once `activeId` is valid, so it never loops.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const opts = getOptions(listId);
    if (opts.length === 0) {
      if (activeId !== null) setActiveId(null);
      return;
    }
    if (!activeId || !opts.some((o) => o.id === activeId)) {
      setActiveId(opts[0].id);
    }
  });

  return (
    <CommandContext.Provider value={{ activeId, setActiveId, listId }}>
      <div ref={ref} className={className} data-ui-command="" {...rest}>
        {children}
      </div>
    </CommandContext.Provider>
  );
});

export interface CommandInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  /** Controlled query value. */
  value?: string;
  /** Uncontrolled initial query value. */
  defaultValue?: string;
  /** Fired with the new query on every keystroke. */
  onValueChange?: (value: string) => void;
}

const Input = forwardRef<HTMLInputElement, CommandInputProps>(
  function CommandInput(
    { value, defaultValue, onValueChange, onKeyDown, ...rest },
    ref,
  ) {
    const { activeId, setActiveId, listId } = useCommand("Input");

    const move = useCallback(
      (to: "next" | "prev" | "first" | "last") => {
        const opts = getOptions(listId);
        if (opts.length === 0) return;
        const idx = opts.findIndex((o) => o.id === activeId);
        let next: HTMLElement;
        if (to === "first") next = opts[0];
        else if (to === "last") next = opts[opts.length - 1];
        else if (to === "next") next = opts[(idx + 1) % opts.length];
        else next = opts[(idx - 1 + opts.length) % opts.length];
        setActiveId(next.id);
        next.scrollIntoView({ block: "nearest" });
      },
      [activeId, listId, setActiveId],
    );

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        switch (event.key) {
          case "ArrowDown":
            event.preventDefault();
            move("next");
            break;
          case "ArrowUp":
            event.preventDefault();
            move("prev");
            break;
          case "Home":
            event.preventDefault();
            move("first");
            break;
          case "End":
            event.preventDefault();
            move("last");
            break;
          case "Enter": {
            if (!activeId) break;
            event.preventDefault();
            document.getElementById(activeId)?.click();
            break;
          }
          // Esc is intentionally left to bubble so Command.Dialog can close.
        }
      },
      [activeId, move, onKeyDown],
    );

    return (
      <input
        ref={ref}
        type="text"
        role="combobox"
        aria-expanded
        aria-controls={listId}
        aria-activedescendant={activeId ?? undefined}
        aria-autocomplete="list"
        autoComplete="off"
        data-ui-command-input=""
        value={value}
        defaultValue={defaultValue}
        onChange={(e) => onValueChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        {...rest}
      />
    );
  },
);

export type CommandListProps = HTMLAttributes<HTMLDivElement>;

const List = forwardRef<HTMLDivElement, CommandListProps>(function CommandList(
  { className, ...rest },
  ref,
) {
  const { listId } = useCommand("List");
  return (
    <div
      ref={ref}
      id={listId}
      role="listbox"
      className={className}
      data-ui-command-list=""
      {...rest}
    />
  );
});

export interface CommandGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Accessible name for the group of options. */
  heading?: ReactNode;
}

const Group = forwardRef<HTMLDivElement, CommandGroupProps>(
  function CommandGroup({ heading, children, className, ...rest }, ref) {
    const headingId = useId();
    return (
      <div
        ref={ref}
        role="group"
        aria-labelledby={heading ? headingId : undefined}
        className={className}
        data-ui-command-group=""
        {...rest}
      >
        {heading && (
          <div id={headingId} data-ui-command-group-heading="" aria-hidden="true">
            {heading}
          </div>
        )}
        {children}
      </div>
    );
  },
);

export interface CommandItemProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  /** Fired when the item is chosen (click or Enter on the active item). */
  onSelect?: () => void;
  /** Render the option non-interactive and skip it during keyboard nav. */
  disabled?: boolean;
}

const Item = forwardRef<HTMLDivElement, CommandItemProps>(function CommandItem(
  { onSelect, disabled = false, id: idProp, className, onClick, onPointerMove, ...rest },
  ref,
) {
  const { activeId, setActiveId } = useCommand("Item");
  const autoId = useId();
  const id = idProp ?? autoId;
  const active = activeId === id;

  return (
    <div
      ref={ref}
      id={id}
      role="option"
      aria-selected={active}
      aria-disabled={disabled || undefined}
      data-ui-command-item=""
      data-active={active ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      className={className}
      onClick={(event) => {
        onClick?.(event);
        if (!disabled) onSelect?.();
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (!disabled && !active) setActiveId(id);
      }}
      {...rest}
    />
  );
});

export type CommandEmptyProps = HTMLAttributes<HTMLDivElement>;

const Empty = forwardRef<HTMLDivElement, CommandEmptyProps>(
  function CommandEmpty({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        role="presentation"
        className={className}
        data-ui-command-empty=""
        {...rest}
      />
    );
  },
);

export interface CommandDialogProps {
  /** Whether the palette is open. */
  open?: boolean;
  /** Fired when the palette requests to open or close (Esc, outside click). */
  onOpenChange?: (open: boolean) => void;
  /** Accessible name for the dialog (also a visually-hidden title). */
  label?: string;
  children?: ReactNode;
}

/**
 * The modal command palette: Radix `Dialog` (focus trap, scroll lock, `Esc`
 * dismissal) wrapping a `Command.Root`. Compose `Command.Input` / `Command.List`
 * / `Command.Item` as children.
 */
function Dialog({
  open,
  onOpenChange,
  label = "Command palette",
  children,
}: CommandDialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay data-ui-command-overlay="" />
        <RadixDialog.Content aria-label={label} data-ui-command-dialog="">
          <VisuallyHidden.Root asChild>
            <RadixDialog.Title>{label}</RadixDialog.Title>
          </VisuallyHidden.Root>
          <Root>{children}</Root>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

Root.displayName = "Command";
Input.displayName = "Command.Input";
List.displayName = "Command.List";
Group.displayName = "Command.Group";
Item.displayName = "Command.Item";
Empty.displayName = "Command.Empty";
Dialog.displayName = "Command.Dialog";

/**
 * Compound, headless command palette. `Root` (+ `Input`/`List`/`Group`/`Item`/
 * `Empty`) is the inline combobox; `Dialog` wraps it in the modal overlay.
 */
export const Command = {
  Root,
  Input,
  List,
  Group,
  Item,
  Empty,
  Dialog,
};
