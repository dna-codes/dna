import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Command } from "./Command";
import { Button } from "../Button/Button";

const meta = {
  title: "Content/Command",
  parameters: { layout: "centered" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const COMMANDS = [
  { id: "new-resource", label: "New resource", group: "Create" },
  { id: "new-operation", label: "New operation", group: "Create" },
  { id: "new-process", label: "New process", group: "Create" },
  { id: "go-resources", label: "Go to Resources", group: "Navigate" },
  { id: "go-operations", label: "Go to Operations", group: "Navigate" },
  { id: "go-roles", label: "Go to Roles", group: "Navigate" },
  { id: "toggle-theme", label: "Toggle light / dark", group: "Preferences" },
];

function PaletteDemo() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [last, setLast] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? COMMANDS.filter((c) => c.label.toLowerCase().includes(q))
      : COMMANDS;
    const groups = new Map<string, typeof COMMANDS>();
    for (const c of matched) {
      groups.set(c.group, [...(groups.get(c.group) ?? []), c]);
    }
    return groups;
  }, [query]);

  const run = (id: string, label: string) => {
    setLast(label);
    setOpen(false);
    void id;
  };

  return (
    <div style={{ display: "grid", gap: "1rem", justifyItems: "center" }}>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open command palette
      </Button>
      {last && (
        <p style={{ color: "var(--ui-color-text-muted)", margin: 0 }}>
          Ran: <strong>{last}</strong>
        </p>
      )}
      <Command.Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setQuery("");
        }}
        label="Command palette"
      >
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Type a command or search…"
          aria-label="Command"
        />
        <Command.List>
          {results.size === 0 && <Command.Empty>No results.</Command.Empty>}
          {[...results.entries()].map(([group, items]) => (
            <Command.Group key={group} heading={group}>
              {items.map((c) => (
                <Command.Item key={c.id} onSelect={() => run(c.id, c.label)}>
                  {c.label}
                </Command.Item>
              ))}
            </Command.Group>
          ))}
        </Command.List>
      </Command.Dialog>
    </div>
  );
}

/**
 * A modal command palette: open it, type to filter, navigate with ↑/↓ (Home/End
 * jump, Enter runs the active item), and dismiss with Esc. Filtering is owned by
 * the story; the component owns virtual focus, keyboard nav, and a11y.
 */
export const Default: Story = {
  render: () => <PaletteDemo />,
};
